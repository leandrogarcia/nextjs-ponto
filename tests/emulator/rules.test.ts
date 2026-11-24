import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { PROJECT_ID } from "./helpers";

let env: RulesTestEnvironment;

beforeAll(async () => {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST!.split(":");
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host, port: Number(port) },
  });
});

afterAll(() => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users/f1"), { uid: "f1", perfil: "funcionario" });
    await setDoc(doc(db, "users/f2"), { uid: "f2", perfil: "funcionario" });
    await setDoc(doc(db, "timeEntries/e1"), { uid: "f1", tipo: "entrada", dateKey: "2026-11-23" });
    await setDoc(doc(db, "timeEntries/e2"), { uid: "f2", tipo: "entrada", dateKey: "2026-11-23" });
    await setDoc(doc(db, "workSchedules/f1"), { uid: "f1", horasSemanais: 40 });
    await setDoc(doc(db, "settings/app"), { instalado: true });
  });
});

const funcionario = () => env.authenticatedContext("f1", { role: "funcionario" }).firestore();
const gerente = () => env.authenticatedContext("g1", { role: "gerencia" }).firestore();

describe("regras do Firestore", () => {
  it("cliente nunca grava em timeEntries", async () => {
    await assertFails(setDoc(doc(funcionario(), "timeEntries/x"), { uid: "f1", tipo: "entrada" }));
    await assertFails(setDoc(doc(gerente(), "timeEntries/x"), { uid: "f1", tipo: "entrada" }));
  });

  it("funcionário lê só as próprias marcações", async () => {
    await assertSucceeds(getDocs(query(collection(funcionario(), "timeEntries"), where("uid", "==", "f1"))));
    await assertFails(getDoc(doc(funcionario(), "timeEntries/e2")));
    await assertFails(getDocs(collection(funcionario(), "timeEntries")));
  });

  it("funcionário não lê outros usuários nem configurações", async () => {
    await assertSucceeds(getDoc(doc(funcionario(), "users/f1")));
    await assertFails(getDoc(doc(funcionario(), "users/f2")));
    await assertFails(getDoc(doc(funcionario(), "settings/app")));
    await assertFails(setDoc(doc(funcionario(), "users/f1"), { perfil: "gerencia" }));
  });

  it("gerência lê tudo mas não grava pelo cliente", async () => {
    await assertSucceeds(getDocs(collection(gerente(), "timeEntries")));
    await assertSucceeds(getDoc(doc(gerente(), "users/f2")));
    await assertSucceeds(getDoc(doc(gerente(), "workSchedules/f1")));
    await assertFails(setDoc(doc(gerente(), "workSchedules/f1"), { horasSemanais: 10 }));
  });

  it("anônimo não lê nada", async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, "users/f1")));
    await assertFails(getDoc(doc(anon, "settings/app")));
  });
});
