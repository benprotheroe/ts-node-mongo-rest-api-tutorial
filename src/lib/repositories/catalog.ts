import { getDb } from "@/lib/db";
import { DEFAULT_PRODUCE_CATALOG } from "@/lib/data/produce-catalog";

export type CatalogRecord = {
  id: string;
  name: string;
  normalizedName: string;
  color: string;
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

async function seedCatalogIfEmpty() {
  const db = getDb();
  const existing = await db.collection(CATALOG_COLLECTION).limit(1).get();

  if (!existing.empty) {
    return;
  }

  const batch = db.batch();
  for (const entry of DEFAULT_PRODUCE_CATALOG) {
    const ref = db.collection(CATALOG_COLLECTION).doc(getDocIdFromName(entry.name));
    batch.set(ref, {
      name: entry.name,
      normalizedName: normalizeName(entry.name),
      color: entry.color,
      type: entry.type,
    });
  }

  await batch.commit();
}

async function ensureCatalogSeeded() {
  if (!seedPromise) {
    seedPromise = seedCatalogIfEmpty();
  }

  await seedPromise;
}

export async function listCatalogEntries() {
  await ensureCatalogSeeded();

  const db = getDb();
  const snapshot = await db.collection(CATALOG_COLLECTION).get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data() as Omit<CatalogRecord, "id">;
      return {
        id: doc.id,
        ...data,
      };
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
  const data = doc.data() as Omit<CatalogRecord, "id">;
  return {
    id: doc.id,
    ...data,
  };
}
