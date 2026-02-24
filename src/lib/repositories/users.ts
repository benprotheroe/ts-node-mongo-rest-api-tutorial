import { getDb } from "@/lib/db";

export type UserRecord = {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
};

const USERS_COLLECTION = "users";

export async function getUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase();
  const db = getDb();
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where("email", "==", normalizedEmail)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data() as Omit<UserRecord, "id">;

  return {
    id: doc.id,
    ...data,
  };
}

export async function getUserById(id: string) {
  const db = getDb();
  const doc = await db.collection(USERS_COLLECTION).doc(id).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data() as Omit<UserRecord, "id">;
  return {
    id: doc.id,
    ...data,
  };
}

export async function createUser(values: {
  email: string;
  username: string;
  passwordHash: string;
}) {
  const db = getDb();
  const now = Date.now();
  const payload: Omit<UserRecord, "id"> = {
    email: values.email.toLowerCase(),
    username: values.username,
    passwordHash: values.passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  const ref = db.collection(USERS_COLLECTION).doc();
  await ref.set(payload);

  return {
    id: ref.id,
    ...payload,
  };
}
