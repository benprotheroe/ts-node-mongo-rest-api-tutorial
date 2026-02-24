"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  username: string;
};

type RainbowBand = "red" | "orange" | "yellow" | "green" | "blue" | "indigo" | "violet";

type Item = {
  id: string;
  name: string;
  colorName: string;
  colorHex: string;
  rainbowBand: RainbowBand;
};

type CatalogEntry = {
  id: string;
  name: string;
  colorName: string;
  colorHex: string;
  rainbowBand: RainbowBand;
  type: "fruit" | "vegetable";
};

const RAINBOW_ORDER: RainbowBand[] = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];

const RAINBOW_HEX: Record<RainbowBand, string> = {
  red: "#e53935",
  orange: "#fb8c00",
  yellow: "#fdd835",
  green: "#43a047",
  blue: "#1e88e5",
  indigo: "#3949ab",
  violet: "#8e24aa",
};

const BAND_HUE_RANGE: Record<RainbowBand, { start: number; end: number; wraps?: boolean }> = {
  red: { start: 340, end: 25, wraps: true },
  orange: { start: 15, end: 55 },
  yellow: { start: 45, end: 90 },
  green: { start: 85, end: 170 },
  blue: { start: 170, end: 235 },
  indigo: { start: 225, end: 255 },
  violet: { start: 250, end: 320 },
};

const introText =
  "Plan your week around food color variety. Add each fruit and vegetable and track how balanced your rainbow diet looks in one clear visual.";

function hexToHue(hex: string) {
  const valid = /^#([0-9A-Fa-f]{6})$/.test(hex);
  if (!valid) {
    return null;
  }

  const value = hex.slice(1);
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) {
    return 0;
  }

  let hue = 0;
  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  const degrees = Math.round(hue * 60);
  return (degrees + 360) % 360;
}

export default function HomeClient() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [newItem, setNewItem] = useState("");
  const [manualColorName, setManualColorName] = useState("");
  const [manualColorHex, setManualColorHex] = useState("#7cb342");
  const [manualBand, setManualBand] = useState<RainbowBand>("green");
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

  function getRainbowStats() {
    const totals = Object.fromEntries(RAINBOW_ORDER.map((band) => [band, 0])) as Record<RainbowBand, number>;

    for (const item of items) {
      totals[item.rainbowBand] += 1;
    }

    const includedBands = RAINBOW_ORDER.filter((band) => totals[band] > 0);
    const totalCount = includedBands.reduce((sum, band) => sum + totals[band], 0);

    return { totals, includedBands, totalCount };
  }

  function getRainbowGradient() {
    if (items.length === 0) {
      return `linear-gradient(to right, ${RAINBOW_ORDER.map((band) => RAINBOW_HEX[band]).join(", ")})`;
    }

    function getBandProgress(colorHex: string, band: RainbowBand) {
      const hue = hexToHue(colorHex);
      if (hue === null) {
        return 0.5;
      }

      const range = BAND_HUE_RANGE[band];

      if (range.wraps) {
        const adjustedHue = hue < range.start ? hue + 360 : hue;
        const adjustedEnd = range.end + 360;
        const progress = (adjustedHue - range.start) / (adjustedEnd - range.start);
        return Math.max(0, Math.min(1, progress));
      }

      const progress = (hue - range.start) / (range.end - range.start);
      return Math.max(0, Math.min(1, progress));
    }

    const orderedItems = [...items].sort((a, b) => {
      const bandOrder = RAINBOW_ORDER.indexOf(a.rainbowBand) - RAINBOW_ORDER.indexOf(b.rainbowBand);
      if (bandOrder !== 0) {
        return bandOrder;
      }

      const withinBand = getBandProgress(a.colorHex, a.rainbowBand) - getBandProgress(b.colorHex, b.rainbowBand);
      if (withinBand !== 0) {
        return withinBand;
      }

      return a.name.localeCompare(b.name);
    });

    const step = 100 / orderedItems.length;
    let progress = 0;
    const stops: string[] = [];

    for (const item of orderedItems) {
      const end = progress + step;
      const color = /^#([0-9A-Fa-f]{6})$/.test(item.colorHex)
        ? item.colorHex
        : RAINBOW_HEX[item.rainbowBand];
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

    const payload = matchedEntry
      ? {
          name: newItem,
          colorName: matchedEntry.colorName,
          colorHex: matchedEntry.colorHex,
          rainbowBand: matchedEntry.rainbowBand,
        }
      : {
          name: newItem,
          colorName: manualColorName.trim(),
          colorHex: manualColorHex,
          rainbowBand: manualBand,
        };

    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      setError(json.message ?? "Unable to add item.");
      return;
    }

    setNewItem("");
    setManualColorName("");
    setManualColorHex("#7cb342");
    setManualBand("green");
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
  const rainbowStats = getRainbowStats();
  const uniqueColors = new Set(items.map((item) => item.rainbowBand)).size;

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
          <p>Known fruit/veg auto-fill an RGB color. For custom entries, set your own RGB and band.</p>

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

            {matchedEntry ? (
              <div className="list-item">
                <span className="item-left">
                  <span className="color-dot" style={{ background: matchedEntry.colorHex }} />
                  <span>{matchedEntry.colorName}</span>
                </span>
                <span className="muted">{matchedEntry.rainbowBand}</span>
              </div>
            ) : (
              <>
                <input
                  className="field"
                  type="text"
                  value={manualColorName}
                  onChange={(e) => setManualColorName(e.target.value)}
                  placeholder="Color name e.g. Kale Green"
                  required
                />
                <div className="btn-row">
                  <input
                    className="field"
                    type="color"
                    value={manualColorHex}
                    onChange={(e) => setManualColorHex(e.target.value)}
                    aria-label="Choose RGB color"
                    style={{ width: 62, padding: 4 }}
                  />
                  <select
                    className="field"
                    value={manualBand}
                    onChange={(e) => setManualBand(e.target.value as RainbowBand)}
                    aria-label="Choose rainbow band"
                    style={{ flex: 1 }}
                  >
                    {RAINBOW_ORDER.map((band) => (
                      <option key={band} value={band}>
                        {band}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

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
          <p>Each produce item now stores an inferred RGB code and a ROYGBIV band.</p>

          {items.length === 0 ? (
            <p className="empty">No produce logged yet. Add your first item to start the visual.</p>
          ) : (
            <ul className="list">
              {items.map((item) => (
                <li key={item.id} className="list-item">
                  <span className="item-left">
                    <span className="color-dot" style={{ background: item.colorHex }} />
                    <span>{item.name}</span>
                  </span>
                  <span className="muted">
                    {item.colorName} ({item.colorHex})
                  </span>
                </li>
              ))}
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
