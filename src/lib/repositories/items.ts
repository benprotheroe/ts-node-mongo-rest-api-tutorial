import { getDb } from "@/lib/db";

export type ItemRecord = {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
};

const ITEMS_COLLECTION = "items";

export async function listItemsByUser(userId: string) {
  const db = getDb();
  const snapshot = await db
    .collection(ITEMS_COLLECTION)
    .where("userId", "==", userId)
    .get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data() as Omit<ItemRecord, "id">;
      return {
        id: doc.id,
        ...data,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function createItem(values: { name: string; color: string; userId: string }) {
  const db = getDb();
  const now = Date.now();
  const payload: Omit<ItemRecord, "id"> = {
    name: values.name,
    color: values.color,
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
