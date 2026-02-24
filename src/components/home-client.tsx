"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  username: string;
};

type Item = {
  id: string;
  name: string;
  color: string;
};

type CatalogEntry = {
  id: string;
  name: string;
  color: string;
  type: "fruit" | "vegetable";
};

const RAINBOW_ORDER = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"] as const;

const RAINBOW_HEX: Record<(typeof RAINBOW_ORDER)[number], string> = {
  red: "#e53935",
  orange: "#fb8c00",
  yellow: "#fdd835",
  green: "#43a047",
  blue: "#1e88e5",
  indigo: "#3949ab",
  violet: "#8e24aa",
};

const COLOR_TO_RAINBOW: Record<string, (typeof RAINBOW_ORDER)[number]> = {
  red: "red",
  orange: "orange",
  yellow: "yellow",
  green: "green",
  blue: "blue",
  indigo: "indigo",
  violet: "violet",
  purple: "violet",
  pink: "red",
};

const introText =
  "Eat 30 or more different fruits and vegetables each week, across the rainbow of colors. This app helps you log variety, not calories, and build a healthier routine.";

export default function HomeClient() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [newItem, setNewItem] = useState("");
  const [manualColor, setManualColor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    initialize().catch(() => {
      setError("Unable to load session.");
      setLoading(false);
    });
  }, []);

  async function initialize() {
    const meRes = await fetch("/api/auth/me", { cache: "no-store" });
    const meJson = await meRes.json();

    if (!meRes.ok || !meJson.success) {
      setUser(null);
      setLoading(false);
      return;
    }

    setUser(meJson.user);
    await loadCatalog();
    await loadItems();
    setLoading(false);
  }

  async function loadCatalog() {
    const res = await fetch("/api/catalog", { cache: "no-store" });
    const json = await res.json();

    if (res.ok && json.success) {
      setCatalog(json.entries);
      return;
    }

    setError(json.message ?? "Unable to load fruit and veg catalog.");
  }

  function getMatchedCatalogEntry(name: string) {
    return catalog.find((entry) => entry.name.toLowerCase() === name.trim().toLowerCase()) ?? null;
  }

  function getRainbowBand(color: string) {
    return COLOR_TO_RAINBOW[color.trim().toLowerCase()] ?? null;
  }

  function getRainbowGradient() {
    const totals = Object.fromEntries(RAINBOW_ORDER.map((color) => [color, 0])) as Record<
      (typeof RAINBOW_ORDER)[number],
      number
    >;

    for (const item of items) {
      const band = getRainbowBand(item.color);
      if (band) {
        totals[band] += 1;
      }
    }

    const includedBands = RAINBOW_ORDER.filter((band) => totals[band] > 0);
    const totalCount = includedBands.reduce((sum, band) => sum + totals[band], 0);

    if (totalCount === 0) {
      return `linear-gradient(to right, ${RAINBOW_ORDER.map((band) => RAINBOW_HEX[band]).join(", ")})`;
    }

    let progress = 0;
    const stops: string[] = [];

    for (const band of includedBands) {
      const percentage = (totals[band] / totalCount) * 100;
      const end = progress + percentage;
      const color = RAINBOW_HEX[band];
      stops.push(`${color} ${progress.toFixed(2)}% ${end.toFixed(2)}%`);
      progress = end;
    }

    return `linear-gradient(to right, ${stops.join(", ")})`;
  }

  async function loadItems() {
    const res = await fetch("/api/items", { cache: "no-store" });
    const json = await res.json();

    if (res.ok && json.success) {
      setItems(json.items);
      return;
    }

    setError(json.message ?? "Unable to load items.");
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const matchedEntry = getMatchedCatalogEntry(newItem);
    const resolvedColor = matchedEntry?.color ?? manualColor.trim();

    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newItem, color: resolvedColor }),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      setError(json.message ?? "Unable to add item.");
      return;
    }

    setNewItem("");
    setManualColor("");
    await loadItems();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setItems([]);
  }

  if (loading) {
    return <main>Loading...</main>;
  }

  const matchedEntry = getMatchedCatalogEntry(newItem);
  const activeColor = matchedEntry?.color ?? manualColor;

  if (!user) {
    return (
      <main>
        <h1>30different</h1>
        <p>{introText}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/signup")}>Sign up</button>
          <button onClick={() => router.push("/login")}>Log in</button>
        </div>
        {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}
      </main>
    );
  }

  return (
    <main>
      <div style={{ width: 360, maxWidth: "100%", marginBottom: 16 }}>
        <div
          style={{
            width: "100%",
            height: 180,
            borderRadius: "180px 180px 0 0",
            background: getRainbowGradient(),
            position: "relative",
            overflow: "hidden",
            border: "1px solid #d7dce5",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "12%",
              right: "12%",
              bottom: 0,
              height: "72%",
              background: "#f7fafc",
              borderRadius: "180px 180px 0 0",
            }}
          />
        </div>
      </div>
      <h1>Welcome, {user.username}</h1>
      <p>Track all the different fruit and veg varieties you have eaten this week.</p>

      <form onSubmit={handleAddItem} style={{ display: "grid", gap: 8, maxWidth: 500 }}>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          list="produce-catalog"
          placeholder="e.g. Strawberry"
          required
        />
        <datalist id="produce-catalog">
          {catalog.map((entry) => (
            <option key={entry.id} value={entry.name} />
          ))}
        </datalist>

        <input
          type="text"
          value={activeColor}
          onChange={(e) => setManualColor(e.target.value)}
          placeholder="Color (auto-filled for known fruit/veg)"
          disabled={Boolean(matchedEntry)}
          required
        />

        <button type="submit">Add item</button>
      </form>

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name} ({item.color})
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={loadItems}>Refresh</button>
        <button onClick={handleLogout}>Log out</button>
      </div>

      {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}
    </main>
  );
}
