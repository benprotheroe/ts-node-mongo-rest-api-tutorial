import { buildInsights } from "@/lib/services/insights";
import type { CatalogRecord } from "@/lib/repositories/catalog";
import type { ItemRecord } from "@/lib/repositories/items";
import type { RainbowBand } from "@/lib/data/produce-catalog";

function makeCatalogEntry(input: {
  id: string;
  name: string;
  ukName: string;
  band: RainbowBand;
  type: "fruit" | "vegetable";
  colorHex: string;
}): CatalogRecord {
  return {
    id: input.id,
    name: input.name,
    normalizedName: input.name.toLowerCase(),
    ukName: input.ukName,
    normalizedAliases: [input.ukName.toLowerCase()],
    colorName: `${input.name} Color`,
    colorHex: input.colorHex,
    rainbowBand: input.band,
    type: input.type,
    nutrients: ["fiber", "vitamin C"],
    plainBenefit: `${input.name} supports balanced nutrition.`,
    scienceNote: `${input.name} contains phytochemicals and micronutrients.`,
  };
}

function makeItem(input: {
  id: string;
  name: string;
  colorHex: string;
  rainbowBand: RainbowBand;
  createdAt: number;
}): ItemRecord {
  return {
    id: input.id,
    name: input.name,
    colorName: `${input.name} Color`,
    colorHex: input.colorHex,
    rainbowBand: input.rainbowBand,
    userId: "u1",
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
}

describe("buildInsights", () => {
  const now = Date.UTC(2026, 1, 26);
  const dayMs = 24 * 60 * 60 * 1000;

  const catalog: CatalogRecord[] = [
    makeCatalogEntry({ id: "1", name: "Carrot", ukName: "Carrot", band: "orange", type: "vegetable", colorHex: "#F57C00" }),
    makeCatalogEntry({ id: "2", name: "Blueberry", ukName: "Blueberry", band: "blue", type: "fruit", colorHex: "#3B4CCA" }),
    makeCatalogEntry({ id: "3", name: "Spinach", ukName: "Spinach", band: "green", type: "vegetable", colorHex: "#2E7D32" }),
    makeCatalogEntry({ id: "4", name: "Apple", ukName: "Apple", band: "red", type: "fruit", colorHex: "#C62828" }),
    makeCatalogEntry({ id: "5", name: "Aubergine", ukName: "Aubergine", band: "violet", type: "vegetable", colorHex: "#5D3A6E" }),
  ];

  it("prioritizes missing rainbow band suggestions", () => {
    const items: ItemRecord[] = [makeItem({ id: "i1", name: "Spinach", colorHex: "#2E7D32", rainbowBand: "green", createdAt: now - dayMs })];

    const result = buildInsights({ items, catalog, now, windowDays: 30 });

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0].kind).toBe("missing_band");
    expect(result.colorCoverage.missingBands).toContain("red");
  });

  it("adds balance suggestions when fruit dominates", () => {
    const items: ItemRecord[] = [
      makeItem({ id: "i1", name: "Apple", colorHex: "#C62828", rainbowBand: "red", createdAt: now - dayMs }),
      makeItem({ id: "i2", name: "Blueberry", colorHex: "#3B4CCA", rainbowBand: "blue", createdAt: now - 2 * dayMs }),
      makeItem({ id: "i3", name: "Apple", colorHex: "#C62828", rainbowBand: "red", createdAt: now - 3 * dayMs }),
    ];

    const result = buildInsights({ items, catalog, now, windowDays: 30 });
    const balance = result.suggestions.find((suggestion) => suggestion.kind === "balance");

    expect(result.fruitVegBalance.dominant).toBe("fruit");
    expect(balance).toBeDefined();
    expect(balance?.foods.some((food) => food.type === "vegetable")).toBe(true);
  });

  it("computes distinct color diversity and variety suggestions", () => {
    const items: ItemRecord[] = [
      makeItem({ id: "i1", name: "Apple", colorHex: "#C62828", rainbowBand: "red", createdAt: now - dayMs }),
      makeItem({ id: "i2", name: "Apple", colorHex: "#C62828", rainbowBand: "red", createdAt: now - 2 * dayMs }),
    ];

    const result = buildInsights({ items, catalog, now, windowDays: 30 });
    const variety = result.suggestions.find((suggestion) => suggestion.kind === "variety");

    expect(result.totals.colorDiversity).toBe(1);
    expect(variety).toBeDefined();
  });

  it("returns item advice entries with nutrition context", () => {
    const items: ItemRecord[] = [
      makeItem({ id: "i1", name: "Carrot", colorHex: "#F57C00", rainbowBand: "orange", createdAt: now - dayMs }),
      makeItem({ id: "i2", name: "Blueberry", colorHex: "#3B4CCA", rainbowBand: "blue", createdAt: now - 2 * dayMs }),
    ];

    const result = buildInsights({ items, catalog, now, windowDays: 30 });

    expect(result.itemAdvice.length).toBeGreaterThan(0);
    expect(result.itemAdvice[0].nutrientFocus.length).toBeGreaterThan(0);
    expect(result.disclaimer.toLowerCase()).toContain("not medical advice");
  });

  it("skips advice entries for items not found in catalog", () => {
    const items: ItemRecord[] = [
      makeItem({ id: "i1", name: "Unknown Food", colorHex: "#AAAAAA", rainbowBand: "green", createdAt: now - dayMs }),
      makeItem({ id: "i2", name: "Carrot", colorHex: "#F57C00", rainbowBand: "orange", createdAt: now - 2 * dayMs }),
    ];

    const result = buildInsights({ items, catalog, now, windowDays: 30 });

    expect(result.itemAdvice.some((entry) => entry.foodName.toLowerCase().includes("unknown"))).toBe(false);
    expect(result.itemAdvice.length).toBe(1);
  });

  it("caps item advice at five foods", () => {
    const extendedCatalog: CatalogRecord[] = [
      ...catalog,
      makeCatalogEntry({ id: "6", name: "Lemon", ukName: "Lemon", band: "yellow", type: "fruit", colorHex: "#F5E04B" }),
      makeCatalogEntry({ id: "7", name: "Broccoli", ukName: "Broccoli", band: "green", type: "vegetable", colorHex: "#2E7D32" }),
      makeCatalogEntry({ id: "8", name: "Tomato", ukName: "Tomato", band: "red", type: "fruit", colorHex: "#D32F2F" }),
    ];

    const items: ItemRecord[] = [
      makeItem({ id: "i1", name: "Carrot", colorHex: "#F57C00", rainbowBand: "orange", createdAt: now - dayMs }),
      makeItem({ id: "i2", name: "Blueberry", colorHex: "#3B4CCA", rainbowBand: "blue", createdAt: now - 2 * dayMs }),
      makeItem({ id: "i3", name: "Spinach", colorHex: "#2E7D32", rainbowBand: "green", createdAt: now - 3 * dayMs }),
      makeItem({ id: "i4", name: "Apple", colorHex: "#C62828", rainbowBand: "red", createdAt: now - 4 * dayMs }),
      makeItem({ id: "i5", name: "Aubergine", colorHex: "#5D3A6E", rainbowBand: "violet", createdAt: now - 5 * dayMs }),
      makeItem({ id: "i6", name: "Lemon", colorHex: "#F5E04B", rainbowBand: "yellow", createdAt: now - 6 * dayMs }),
    ];

    const result = buildInsights({ items, catalog: extendedCatalog, now, windowDays: 30 });

    expect(result.itemAdvice.length).toBe(5);
  });

  it("uses default now/window when omitted and handles unknown dominant", () => {
    const before = Date.now();
    const result = buildInsights({ items: [], catalog });
    const after = Date.now();

    expect(result.windowDays).toBe(30);
    expect(result.generatedAt).toBeGreaterThanOrEqual(before);
    expect(result.generatedAt).toBeLessThanOrEqual(after);
    expect(result.fruitVegBalance.dominant).toBe("unknown");
  });

  it("marks dominant as balanced when fruit and vegetables are close", () => {
    const items: ItemRecord[] = [
      makeItem({ id: "i1", name: "Apple", colorHex: "#C62828", rainbowBand: "red", createdAt: now - dayMs }),
      makeItem({ id: "i2", name: "Spinach", colorHex: "#2E7D32", rainbowBand: "green", createdAt: now - 2 * dayMs }),
    ];

    const result = buildInsights({ items, catalog, now, windowDays: 30 });
    expect(result.fruitVegBalance.dominant).toBe("balanced");
  });

  it("omits missing-band suggestions when all rainbow bands are covered", () => {
    const rainbowCatalog: CatalogRecord[] = [
      makeCatalogEntry({ id: "r1", name: "Tomato", ukName: "Tomato", band: "red", type: "fruit", colorHex: "#D32F2F" }),
      makeCatalogEntry({ id: "r2", name: "Carrot", ukName: "Carrot", band: "orange", type: "vegetable", colorHex: "#F57C00" }),
      makeCatalogEntry({ id: "r3", name: "Lemon", ukName: "Lemon", band: "yellow", type: "fruit", colorHex: "#F5E04B" }),
      makeCatalogEntry({ id: "r4", name: "Spinach", ukName: "Spinach", band: "green", type: "vegetable", colorHex: "#2E7D32" }),
      makeCatalogEntry({ id: "r5", name: "Blueberry", ukName: "Blueberry", band: "blue", type: "fruit", colorHex: "#3B4CCA" }),
      makeCatalogEntry({ id: "r6", name: "Blackberry", ukName: "Blackberry", band: "indigo", type: "fruit", colorHex: "#2E1A47" }),
      makeCatalogEntry({ id: "r7", name: "Aubergine", ukName: "Aubergine", band: "violet", type: "vegetable", colorHex: "#5D3A6E" }),
    ];

    const items: ItemRecord[] = rainbowCatalog.map((entry, index) =>
      makeItem({
        id: `i${index + 1}`,
        name: entry.name,
        colorHex: entry.colorHex,
        rainbowBand: entry.rainbowBand,
        createdAt: now - (index + 1) * dayMs,
      })
    );

    const result = buildInsights({ items, catalog: rainbowCatalog, now, windowDays: 30 });
    expect(result.colorCoverage.missingBands).toHaveLength(0);
    expect(result.suggestions.some((suggestion) => suggestion.kind === "missing_band")).toBe(false);
  });

  it("falls back to canonical name when UK name is empty", () => {
    const fallbackCatalog = catalog.map((entry) =>
      entry.name === "Carrot" ? { ...entry, ukName: "" } : entry
    );
    const items: ItemRecord[] = [
      makeItem({ id: "i1", name: "Carrot", colorHex: "#F57C00", rainbowBand: "orange", createdAt: now - dayMs }),
    ];

    const result = buildInsights({ items, catalog: fallbackCatalog, now, windowDays: 30 });
    expect(result.itemAdvice[0].foodName).toBe("Carrot");
  });
});
