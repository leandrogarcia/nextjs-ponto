import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { Deps } from "@/lib/server/deps";

export const PROJECT_ID = "demo-ponto";

export function testDeps(): Deps {
  const app = getApps()[0] ?? initializeApp({ projectId: PROJECT_ID });
  return { db: getFirestore(app), auth: getAuth(app) };
}

export async function resetEmulators() {
  const fs = process.env.FIRESTORE_EMULATOR_HOST;
  const auth = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!fs || !auth) throw new Error("Rode com `npm run test:emulators`.");
  await fetch(`http://${fs}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${auth}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: "DELETE" });
}

export async function closeApps() {
  await Promise.all(getApps().map((a) => deleteApp(a)));
}
