import { getDb } from "@/lib/db";
import { DEFAULT_PRODUCE_CATALOG } from "@/lib/data/produce-catalog";
import { getProduceMeta } from "@/lib/data/nutrition";

export type CatalogRecord = {
  id: string;
  name: string;
  normalizedName: string;
  ukName: string;
  normalizedAliases: string[];
  colorName: string;
  colorHex: string;
  rainbowBand: "red" | "orange" | "yellow" | "green" | "blue" | "indigo" | "violet";
  type: "fruit" | "vegetable";
  nutrients: string[];
  plainBenefit: string;
  scienceNote: string;
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
  if (
    data.name &&
    data.normalizedName &&
    data.ukName &&
    data.normalizedAliases &&
    data.colorName &&
    data.colorHex &&
    data.rainbowBand &&
    data.type &&
    data.nutrients &&
    data.plainBenefit &&
    data.scienceNote
  ) {
    return {
      id,
      name: data.name,
      normalizedName: data.normalizedName,
      ukName: data.ukName,
      normalizedAliases: data.normalizedAliases,
      colorName: data.colorName,
      colorHex: data.colorHex,
      rainbowBand: data.rainbowBand,
      type: data.type,
      nutrients: data.nutrients,
      plainBenefit: data.plainBenefit,
      scienceNote: data.scienceNote,
    };
  }

  const legacyColor = (data.color ?? "green").toLowerCase();
  const band = LEGACY_COLOR_TO_BAND[legacyColor] ?? "green";
  const baseName = data.name ?? "Unknown produce";
  const nutrition = getProduceMeta(baseName, band).nutrition;
  return {
    id,
    name: baseName,
    normalizedName: data.normalizedName ?? normalizeName(baseName),
    ukName: data.ukName ?? baseName,
    normalizedAliases: data.normalizedAliases ?? [],
    colorName: data.colorName ?? legacyColor.charAt(0).toUpperCase() + legacyColor.slice(1),
    colorHex: data.colorHex ?? BAND_HEX[band],
    rainbowBand: data.rainbowBand ?? band,
    type: data.type ?? "vegetable",
    nutrients: data.nutrients ?? nutrition?.nutrients ?? [],
    plainBenefit: data.plainBenefit ?? nutrition?.plainBenefit ?? "Adds useful micronutrients to a balanced diet.",
    scienceNote: data.scienceNote ?? nutrition?.scienceNote ?? "Colorful produce contributes phytochemicals and fiber.",
  };
}

async function syncCatalog() {
  const db = getDb();
  const batch = db.batch();
  for (const entry of DEFAULT_PRODUCE_CATALOG) {
    const meta = getProduceMeta(entry.name, entry.rainbowBand);
    const aliases = [meta.ukName, ...(meta.aliases ?? [])].filter(Boolean) as string[];
    const ref = db.collection(CATALOG_COLLECTION).doc(getDocIdFromName(entry.name));
    batch.set(
      ref,
      {
        name: entry.name,
        normalizedName: normalizeName(entry.name),
        ukName: meta.ukName ?? entry.name,
        normalizedAliases: aliases.map((alias) => normalizeName(alias)),
        colorName: entry.colorName,
        colorHex: entry.colorHex,
        rainbowBand: entry.rainbowBand,
        type: entry.type,
        nutrients: meta.nutrition?.nutrients ?? [],
        plainBenefit: meta.nutrition?.plainBenefit ?? "Adds useful micronutrients to a balanced diet.",
        scienceNote: meta.nutrition?.scienceNote ?? "Colorful produce contributes phytochemicals and fiber.",
      },
      { merge: true }
    );
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
  const byName = await db
    .collection(CATALOG_COLLECTION)
    .where("normalizedName", "==", normalizedName)
    .limit(1)
    .get();

  if (!byName.empty) {
    const doc = byName.docs[0];
    const data = doc.data() as Partial<CatalogRecord> & { color?: string };
    return normalizeCatalogRecord(doc.id, data);
  }

  const byAlias = await db
    .collection(CATALOG_COLLECTION)
    .where("normalizedAliases", "array-contains", normalizedName)
    .limit(1)
    .get();

  if (byAlias.empty) {
    return null;
  }

  const doc = byAlias.docs[0];
  const data = doc.data() as Partial<CatalogRecord> & { color?: string };
  return normalizeCatalogRecord(doc.id, data);
}
