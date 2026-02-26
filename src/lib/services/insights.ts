import type { RainbowBand } from "@/lib/data/produce-catalog";
import type { CatalogRecord } from "@/lib/repositories/catalog";
import type { ItemRecord } from "@/lib/repositories/items";

const RAINBOW_ORDER: RainbowBand[] = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];
const DEFAULT_WINDOW_DAYS = 30;

export type InsightSuggestion = {
  kind: "missing_band" | "balance" | "variety";
  title: string;
  reason: string;
  foods: Array<{
    name: string;
    ukName: string;
    type: "fruit" | "vegetable";
    rainbowBand: RainbowBand;
    colorHex: string;
    plainBenefit: string;
  }>;
};

export type InsightAdvice = {
  foodName: string;
  nutrientFocus: string[];
  plainBenefit: string;
  scienceNote: string;
};

export type InsightsResult = {
  windowDays: number;
  generatedAt: number;
  disclaimer: string;
  totals: {
    itemsInWindow: number;
    colorDiversity: number;
  };
  colorCoverage: {
    countsByBand: Record<RainbowBand, number>;
    missingBands: RainbowBand[];
  };
  fruitVegBalance: {
    fruitCount: number;
    vegetableCount: number;
    dominant: "fruit" | "vegetable" | "balanced" | "unknown";
  };
  suggestions: InsightSuggestion[];
  itemAdvice: InsightAdvice[];
};

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function getBandCounts(items: ItemRecord[]) {
  const counts = Object.fromEntries(RAINBOW_ORDER.map((band) => [band, 0])) as Record<RainbowBand, number>;
  for (const item of items) {
    counts[item.rainbowBand] += 1;
  }
  return counts;
}

function buildCatalogLookup(catalog: CatalogRecord[]) {
  const byName = new Map<string, CatalogRecord>();
  for (const entry of catalog) {
    byName.set(entry.normalizedName, entry);
    for (const alias of entry.normalizedAliases) {
      byName.set(alias, entry);
    }
  }
  return byName;
}

function pickFoods(catalog: CatalogRecord[], limit: number) {
  return catalog.slice(0, limit).map((entry) => ({
    name: entry.name,
    ukName: entry.ukName,
    type: entry.type,
    rainbowBand: entry.rainbowBand,
    colorHex: entry.colorHex,
    plainBenefit: entry.plainBenefit,
  }));
}

export function buildInsights(params: {
  items: ItemRecord[];
  catalog: CatalogRecord[];
  now?: number;
  windowDays?: number;
}): InsightsResult {
  const now = params.now ?? Date.now();
  const windowDays = params.windowDays ?? DEFAULT_WINDOW_DAYS;
  const cutoff = now - windowDays * 24 * 60 * 60 * 1000;
  const windowItems = params.items.filter((item) => item.createdAt >= cutoff);
  const countsByBand = getBandCounts(windowItems);
  const missingBands = RAINBOW_ORDER.filter((band) => countsByBand[band] === 0);
  const colorDiversity = new Set(windowItems.map((item) => item.colorHex.toLowerCase())).size;
  const catalogByName = buildCatalogLookup(params.catalog);

  let fruitCount = 0;
  let vegetableCount = 0;
  for (const item of windowItems) {
    const matched = catalogByName.get(normalizeName(item.name));
    if (matched?.type === "fruit") {
      fruitCount += 1;
    }
    if (matched?.type === "vegetable") {
      vegetableCount += 1;
    }
  }

  const trackedTypeTotal = fruitCount + vegetableCount;
  const dominant: InsightsResult["fruitVegBalance"]["dominant"] =
    trackedTypeTotal === 0
      ? "unknown"
      : fruitCount / trackedTypeTotal > 0.6
        ? "fruit"
        : vegetableCount / trackedTypeTotal > 0.6
          ? "vegetable"
          : "balanced";

  const suggestions: InsightSuggestion[] = [];
  if (missingBands.length > 0) {
    for (const band of missingBands.slice(0, 2)) {
      const bandFoods = params.catalog.filter((entry) => entry.rainbowBand === band);
      suggestions.push({
        kind: "missing_band",
        title: `Add more ${band} foods`,
        reason: `Your last ${windowDays} days are missing ${band} in your rainbow coverage.`,
        foods: pickFoods(bandFoods, 3),
      });
    }
  }

  if (dominant === "fruit") {
    const vegetables = params.catalog.filter((entry) => entry.type === "vegetable");
    suggestions.push({
      kind: "balance",
      title: "Increase vegetables for better balance",
      reason: `Most logged items are fruit in your ${windowDays}-day window. More vegetables improves nutrient spread.`,
      foods: pickFoods(vegetables, 3),
    });
  } else if (dominant === "vegetable") {
    const fruits = params.catalog.filter((entry) => entry.type === "fruit");
    suggestions.push({
      kind: "balance",
      title: "Add fruit to rebalance your week",
      reason: `Most logged items are vegetables in your ${windowDays}-day window. Add fruit for a broader profile.`,
      foods: pickFoods(fruits, 3),
    });
  }

  if (colorDiversity < 5) {
    const unseenBands = RAINBOW_ORDER.filter((band) => countsByBand[band] <= 1);
    const varietyFoods = params.catalog.filter((entry) => unseenBands.includes(entry.rainbowBand));
    suggestions.push({
      kind: "variety",
      title: "Boost your color diversity",
      reason: "Try different shades to increase your distinct-color variety score.",
      foods: pickFoods(varietyFoods, 4),
    });
  }

  const seen = new Set<string>();
  const itemAdvice: InsightAdvice[] = [];
  for (const item of windowItems.sort((a, b) => b.createdAt - a.createdAt)) {
    const key = normalizeName(item.name);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const matched = catalogByName.get(key);
    if (!matched) {
      continue;
    }
    itemAdvice.push({
      foodName: matched.ukName || matched.name,
      nutrientFocus: matched.nutrients.slice(0, 3),
      plainBenefit: matched.plainBenefit,
      scienceNote: matched.scienceNote,
    });
    if (itemAdvice.length >= 5) {
      break;
    }
  }

  return {
    windowDays,
    generatedAt: now,
    disclaimer: "Nutrition guidance is general information and not medical advice.",
    totals: {
      itemsInWindow: windowItems.length,
      colorDiversity,
    },
    colorCoverage: {
      countsByBand,
      missingBands,
    },
    fruitVegBalance: {
      fruitCount,
      vegetableCount,
      dominant,
    },
    suggestions: suggestions.slice(0, 4),
    itemAdvice,
  };
}
