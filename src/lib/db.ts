import { cert, getApps, initializeApp } from "firebase-admin/app";
import { Firestore, getFirestore } from "firebase-admin/firestore";

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountJson = process.env.FIRESTORE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountJson) {
    const parsed = JSON.parse(serviceAccountJson) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };

    return initializeApp({
      credential: cert({
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key.replace(/\\n/g, "\n"),
      }),
    });
  }

  const projectId = process.env.FIRESTORE_PROJECT_ID;
  const clientEmail = process.env.GCP_CLIENT_EMAIL;
  const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firestore credentials. Set FIRESTORE_SERVICE_ACCOUNT_KEY or FIRESTORE_PROJECT_ID/GCP_CLIENT_EMAIL/GCP_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

let cachedDb: Firestore | null = null;

export function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const app = initializeFirebaseAdmin();
  cachedDb = getFirestore(app);
  return cachedDb;
}
