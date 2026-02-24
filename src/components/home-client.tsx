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
  "Plan your week around food color variety. Add each fruit and vegetable and track how balanced your rainbow diet looks in one clear visual.";

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

  function getRainbowStats() {
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

    return { totals, includedBands, totalCount };
  }

  function getRainbowGradient() {
    const stats = getRainbowStats();

    if (stats.totalCount === 0) {
      return `linear-gradient(to right, ${RAINBOW_ORDER.map((band) => RAINBOW_HEX[band]).join(", ")})`;
    }

    let progress = 0;
    const stops: string[] = [];

    for (const band of stats.includedBands) {
      const percentage = (stats.totals[band] / stats.totalCount) * 100;
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
  const rainbowStats = getRainbowStats();
  const uniqueColors = new Set(items.map((item) => getRainbowBand(item.color)).filter(Boolean)).size;

  if (!user) {
    return (
      <main>
        <section className="hero-card">
          <div className="hero-top">
            <div>
              <h1 className="hero-title">Build a better rainbow diet</h1>
              <p className="hero-subtitle">{introText}</p>
            </div>
            <div className="pill-row">
              <span className="pill">Color-first tracking</span>
              <span className="pill">30 weekly target</span>
            </div>
          </div>

          <div className="btn-row">
            <button className="btn btn-primary" onClick={() => router.push("/signup")}>
              Create account
            </button>
            <button className="btn" onClick={() => router.push("/login")}>
              Log in
            </button>
          </div>
        </section>
        {error ? <p className="error">{error}</p> : null}
      </main>
    );
  }

  return (
    <main className="page-grid">
      <section className="hero-card">
        <div className="hero-top">
          <div>
            <h1 className="hero-title">Welcome back, {user.username}</h1>
            <p className="hero-subtitle">Your rainbow is weighted by what you ate this week.</p>
          </div>
          <div className="pill-row">
            <span className="pill">Items: {items.length}</span>
            <span className="pill">Rainbow colors: {uniqueColors}/7</span>
            <span className="pill">Goal progress: {Math.min(100, Math.round((items.length / 30) * 100))}%</span>
          </div>
        </div>

        <div className="rainbow-stage">
          <div className="rainbow-arc" style={{ background: getRainbowGradient() }}>
            <div className="rainbow-cutout" />
          </div>
        </div>
      </section>

      <section className="content-grid">
        <article className="card">
          <h2>Add today&apos;s produce</h2>
          <p>Pick from the catalog for automatic color mapping, or set color manually.</p>

          <form onSubmit={handleAddItem} className="form-grid">
            <input
              className="field"
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
              className="field"
              type="text"
              value={activeColor}
              onChange={(e) => setManualColor(e.target.value)}
              placeholder="Color (auto for known fruit/veg)"
              disabled={Boolean(matchedEntry)}
              required
            />

            <div className="btn-row">
              <button className="btn btn-primary" type="submit">
                Add item
              </button>
              <button className="btn" type="button" onClick={loadItems}>
                Refresh
              </button>
              <button className="btn" type="button" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </form>
          {error ? <p className="error">{error}</p> : null}
        </article>

        <article className="card">
          <h2>Your logged foods</h2>
          <p>Every entry contributes to the rainbow in ROYGBIV order.</p>

          {items.length === 0 ? (
            <p className="empty">No produce logged yet. Add your first item to start the visual.</p>
          ) : (
            <ul className="list">
              {items.map((item) => {
                const band = getRainbowBand(item.color);
                const dotColor = band ? RAINBOW_HEX[band] : "#a1a9a1";

                return (
                  <li key={item.id} className="list-item">
                    <span className="item-left">
                      <span className="color-dot" style={{ background: dotColor }} />
                      <span>{item.name}</span>
                    </span>
                    <span className="muted">{item.color}</span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="pill-row" style={{ marginTop: 12 }}>
            {RAINBOW_ORDER.map((band) => (
              <span key={band} className="pill">
                {band}: {rainbowStats.totals[band]}
              </span>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
