import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { AppError } from "../errors";
import { COLLECTIONS } from "./collections";
import type { Deps } from "./deps";
import { getUser, type Actor } from "./users";

export interface WorkSchedule {
  uid: string;
  horasSemanais: number;
  atualizadoEm: string | null;
}

export async function getSchedule({ db }: Pick<Deps, "db">, uid: string): Promise<WorkSchedule | null> {
  const snap = await db.collection(COLLECTIONS.workSchedules).doc(uid).get();
  if (!snap.exists) return null;
  const at = snap.get("atualizadoEm") as Timestamp | undefined;
  return { uid, horasSemanais: Number(snap.get("horasSemanais") ?? 0), atualizadoEm: at?.toDate().toISOString() ?? null };
}

export async function listSchedules({ db }: Pick<Deps, "db">) {
  const snap = await db.collection(COLLECTIONS.workSchedules).get();
  const map = new Map<string, WorkSchedule>();
  for (const d of snap.docs) {
    const at = d.get("atualizadoEm") as Timestamp | undefined;
    map.set(d.id, { uid: d.id, horasSemanais: Number(d.get("horasSemanais") ?? 0), atualizadoEm: at?.toDate().toISOString() ?? null });
  }
  return map;
}

export async function setSchedule(deps: Deps, actor: Actor, uid: string, horasSemanais: number) {
  if (actor.perfil !== "gerencia") throw new AppError(403, "Sem permissão.");
  const target = await getUser(deps, uid);
  if (!target) throw new AppError(404, "Usuário não encontrado.");
  if (target.perfil !== "funcionario") throw new AppError(400, "A jornada só se aplica a funcionários.");
  await deps.db.collection(COLLECTIONS.workSchedules).doc(uid).set({
    uid,
    horasSemanais,
    atualizadoEm: FieldValue.serverTimestamp(),
  });
  return (await getSchedule(deps, uid))!;
}
