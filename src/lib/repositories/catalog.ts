import { getDb } from "@/lib/db";
import { DEFAULT_PRODUCE_CATALOG } from "@/lib/data/produce-catalog";

export type CatalogRecord = {
  id: string;
  name: string;
  normalizedName: string;
  colorName: string;
  colorHex: string;
  rainbowBand: "red" | "orange" | "yellow" | "green" | "blue" | "indigo" | "violet";
  type: "fruit" | "vegetable";
};

const CATALOG_COLLECTION = "produce_catalog";

let seedPromise: Promise<void> | null = null;

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function getDocIdFromName(name: string) {
  return normalizeName(name).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const LEGACY_COLOR_TO_BAND: Record<string, CatalogRecord["rainbowBand"]> = {
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

const BAND_HEX: Record<CatalogRecord["rainbowBand"], string> = {
  red: "#e53935",
  orange: "#fb8c00",
  yellow: "#fdd835",
  green: "#43a047",
  blue: "#1e88e5",
  indigo: "#3949ab",
  violet: "#8e24aa",
};

function normalizeCatalogRecord(
  id: string,
  data: Partial<CatalogRecord> & { color?: string; name?: string; type?: "fruit" | "vegetable" }
): CatalogRecord {
  if (data.name && data.normalizedName && data.colorName && data.colorHex && data.rainbowBand && data.type) {
    return {
      id,
      name: data.name,
      normalizedName: data.normalizedName,
      colorName: data.colorName,
      colorHex: data.colorHex,
      rainbowBand: data.rainbowBand,
      type: data.type,
    };
  }

  const legacyColor = (data.color ?? "green").toLowerCase();
  const band = LEGACY_COLOR_TO_BAND[legacyColor] ?? "green";
  const baseName = data.name ?? "Unknown produce";
  return {
    id,
    name: baseName,
    normalizedName: data.normalizedName ?? normalizeName(baseName),
    colorName: data.colorName ?? legacyColor.charAt(0).toUpperCase() + legacyColor.slice(1),
    colorHex: data.colorHex ?? BAND_HEX[band],
    rainbowBand: data.rainbowBand ?? band,
    type: data.type ?? "vegetable",
  };
}

async function syncCatalog() {
  const db = getDb();
  const batch = db.batch();
  for (const entry of DEFAULT_PRODUCE_CATALOG) {
    const ref = db.collection(CATALOG_COLLECTION).doc(getDocIdFromName(entry.name));
    batch.set(ref, {
      name: entry.name,
      normalizedName: normalizeName(entry.name),
      colorName: entry.colorName,
      colorHex: entry.colorHex,
      rainbowBand: entry.rainbowBand,
      type: entry.type,
    }, { merge: true });
  }

  await batch.commit();
}

async function ensureCatalogSeeded() {
  if (!seedPromise) {
    seedPromise = syncCatalog();
  }

  await seedPromise;
}

export async function listCatalogEntries() {
  await ensureCatalogSeeded();

  const db = getDb();
  const snapshot = await db.collection(CATALOG_COLLECTION).get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data() as Partial<CatalogRecord> & { color?: string };
      return normalizeCatalogRecord(doc.id, data);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCatalogEntryByName(name: string) {
  await ensureCatalogSeeded();

  const db = getDb();
  const normalizedName = normalizeName(name);
  const snapshot = await db
    .collection(CATALOG_COLLECTION)
    .where("normalizedName", "==", normalizedName)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data() as Partial<CatalogRecord> & { color?: string };
  return normalizeCatalogRecord(doc.id, data);
}
