import { getDb } from "@/lib/db";

export type ItemRecord = {
  id: string;
  name: string;
  colorName: string;
  colorHex: string;
  rainbowBand: "red" | "orange" | "yellow" | "green" | "blue" | "indigo" | "violet";
  userId: string;
  createdAt: number;
  updatedAt: number;
};

const ITEMS_COLLECTION = "items";

const LEGACY_COLOR_TO_BAND: Record<string, ItemRecord["rainbowBand"]> = {
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

const BAND_HEX: Record<ItemRecord["rainbowBand"], string> = {
  red: "#e53935",
  orange: "#fb8c00",
  yellow: "#fdd835",
  green: "#43a047",
  blue: "#1e88e5",
  indigo: "#3949ab",
  violet: "#8e24aa",
};

function normalizeLegacyItem(
  id: string,
  data: Partial<ItemRecord> & { color?: string; name?: string; userId?: string }
): ItemRecord {
  if (data.colorName && data.colorHex && data.rainbowBand && data.name && data.userId) {
    return {
      id,
      name: data.name,
      colorName: data.colorName,
      colorHex: data.colorHex,
      rainbowBand: data.rainbowBand,
      userId: data.userId,
      createdAt: data.createdAt ?? Date.now(),
      updatedAt: data.updatedAt ?? Date.now(),
    };
  }

  const legacyColor = (data.color ?? "green").toLowerCase();
  const band = LEGACY_COLOR_TO_BAND[legacyColor] ?? "green";
  return {
    id,
    name: data.name ?? "Unknown item",
    colorName: data.colorName ?? legacyColor.charAt(0).toUpperCase() + legacyColor.slice(1),
    colorHex: data.colorHex ?? BAND_HEX[band],
    rainbowBand: data.rainbowBand ?? band,
    userId: data.userId ?? "",
    createdAt: data.createdAt ?? Date.now(),
    updatedAt: data.updatedAt ?? Date.now(),
  };
}

export async function listItemsByUser(userId: string) {
  const db = getDb();
  const snapshot = await db
    .collection(ITEMS_COLLECTION)
    .where("userId", "==", userId)
    .get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data() as Partial<ItemRecord> & { color?: string };
      return normalizeLegacyItem(doc.id, data);
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function createItem(values: {
  name: string;
  colorName: string;
  colorHex: string;
  rainbowBand: "red" | "orange" | "yellow" | "green" | "blue" | "indigo" | "violet";
  userId: string;
}) {
  const db = getDb();
  const now = Date.now();
  const payload: Omit<ItemRecord, "id"> = {
    name: values.name,
    colorName: values.colorName,
    colorHex: values.colorHex,
    rainbowBand: values.rainbowBand,
    userId: values.userId,
    createdAt: now,
    updatedAt: now,
  };

  const ref = db.collection(ITEMS_COLLECTION).doc();
  await ref.set(payload);

  return {
    id: ref.id,
    ...payload,
  };
}
