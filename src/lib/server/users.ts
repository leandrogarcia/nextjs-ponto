import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp, type DocumentReference } from "firebase-admin/firestore";
import { AppError, toAppError } from "../errors";
import { assignableRoles, isRole, type Role } from "../roles";
import type { CreateUserInput, UpdateUserInput } from "../schemas";
import { COLLECTIONS, FIRST_MANAGER_LOCK_DOC } from "./collections";
import type { Deps } from "./deps";

export interface AppUser {
  uid: string;
  nome: string;
  email: string;
  perfil: Role;
  ativo: boolean;
  criadoEm: string | null;
}

export interface Actor {
  uid: string;
  perfil: Role;
}

export function toAppUser(uid: string, data: FirebaseFirestore.DocumentData): AppUser {
  const criadoEm = data.criadoEm as Timestamp | undefined;
  return {
    uid,
    nome: String(data.nome ?? ""),
    email: String(data.email ?? ""),
    perfil: isRole(data.perfil) ? data.perfil : "funcionario",
    ativo: data.ativo !== false,
    criadoEm: criadoEm?.toDate?.().toISOString() ?? null,
  };
}

export async function getUser({ db }: Pick<Deps, "db">, uid: string) {
  const snap = await db.collection(COLLECTIONS.users).doc(uid).get();
  return snap.exists ? toAppUser(snap.id, snap.data()!) : null;
}

export async function listUsers({ db }: Pick<Deps, "db">, filter?: { perfil?: Role }) {
  let query: FirebaseFirestore.Query = db.collection(COLLECTIONS.users);
  if (filter?.perfil) query = query.where("perfil", "==", filter.perfil);
  const snap = await query.get();
  return snap.docs.map((d) => toAppUser(d.id, d.data())).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function hasManager({ db }: Pick<Deps, "db">) {
  const snap = await db.collection(COLLECTIONS.users).where("perfil", "==", "gerencia").limit(1).get();
  return !snap.empty;
}

const FIRST_MANAGER_LOCK_TTL_MS = 2 * 60 * 1000;

async function releaseFirstManagerLock(db: Deps["db"], lockRef: DocumentReference, token: string) {
  await db
    .runTransaction(async (tx) => {
      if ((await tx.get(lockRef)).get("token") === token) tx.delete(lockRef);
    })
    .catch(() => undefined);
}

export async function createUser(deps: Deps, actor: Actor, input: CreateUserInput) {
  const { db, auth } = deps;
  const allowed = assignableRoles(actor.perfil, actor.perfil === "root" ? await hasManager(deps) : true);
  if (!allowed.includes(input.perfil)) {
    throw new AppError(
      403,
      actor.perfil === "root" ? "O root só pode cadastrar o primeiro gerente." : "Sem permissão para criar esse perfil.",
    );
  }

  // Trava para duas requisições simultâneas do root não criarem dois gerentes.
  // Uma trava antiga (requisição interrompida) pode ser retomada; o perfil só é
  // salvo se a trava ainda for desta requisição e nenhum gerente existir.
  const lockRef = actor.perfil === "root" ? db.collection(COLLECTIONS.settings).doc(FIRST_MANAGER_LOCK_DOC) : null;
  const lockToken = randomUUID();
  const rootDenied = () => new AppError(403, "O root só pode cadastrar o primeiro gerente.");
  if (lockRef) {
    await db.runTransaction(async (tx) => {
      const lock = await tx.get(lockRef);
      const since = (lock.get("criadoEm") as Timestamp | undefined)?.toMillis() ?? 0;
      if (lock.exists && Date.now() - since < FIRST_MANAGER_LOCK_TTL_MS) throw rootDenied();
      tx.set(lockRef, { criadoEm: Timestamp.now(), token: lockToken });
    });
  }

  let uid: string | undefined;
  try {
    const record = await auth.createUser({ email: input.email, password: input.senha, displayName: input.nome });
    uid = record.uid;
    await auth.setCustomUserClaims(uid, { role: input.perfil });
    const userRef = db.collection(COLLECTIONS.users).doc(uid);
    const profile = {
      uid,
      nome: input.nome,
      email: input.email,
      perfil: input.perfil,
      ativo: true,
      criadoEm: FieldValue.serverTimestamp(),
    };
    if (lockRef) {
      await db.runTransaction(async (tx) => {
        const [lock, managers] = await Promise.all([
          tx.get(lockRef),
          tx.get(db.collection(COLLECTIONS.users).where("perfil", "==", "gerencia").limit(1)),
        ]);
        if (lock.get("token") !== lockToken || !managers.empty) throw rootDenied();
        tx.set(userRef, profile);
      });
    } else {
      await userRef.set(profile);
    }
    return (await getUser(deps, uid))!;
  } catch (err) {
    if (uid) await auth.deleteUser(uid).catch(() => undefined);
    if (lockRef) await releaseFirstManagerLock(db, lockRef, lockToken);
    throw toAppError(err);
  }
}

async function requireEditableTarget(deps: Deps, actor: Actor, uid: string) {
  if (actor.perfil !== "gerencia") throw new AppError(403, "Sem permissão.");
  const target = await getUser(deps, uid);
  if (!target) throw new AppError(404, "Usuário não encontrado.");
  if (target.perfil === "root") throw new AppError(403, "O usuário root não pode ser alterado.");
  return target;
}

export async function updateUser(deps: Deps, actor: Actor, uid: string, input: UpdateUserInput) {
  const { db, auth } = deps;
  const target = await requireEditableTarget(deps, actor, uid);
  const isSelf = actor.uid === uid;
  if (isSelf && input.perfil && input.perfil !== target.perfil) {
    throw new AppError(400, "Você não pode alterar o seu próprio perfil.");
  }
  if (isSelf && input.ativo === false) throw new AppError(400, "Você não pode desativar a si mesmo.");

  const roleChanged = input.perfil !== undefined && input.perfil !== target.perfil;
  const deactivated = input.ativo === false && target.ativo;

  try {
    const authUpdate: Parameters<typeof auth.updateUser>[1] = {};
    if (input.nome !== undefined) authUpdate.displayName = input.nome;
    if (input.email !== undefined) authUpdate.email = input.email;
    if (input.senha !== undefined) authUpdate.password = input.senha;
    if (input.ativo !== undefined) authUpdate.disabled = !input.ativo;
    if (Object.keys(authUpdate).length) await auth.updateUser(uid, authUpdate);
    if (roleChanged) await auth.setCustomUserClaims(uid, { role: input.perfil });
    // Encerra as sessões abertas para o novo perfil ou o bloqueio valerem já.
    if (roleChanged || deactivated || (input.senha !== undefined && !isSelf)) await auth.revokeRefreshTokens(uid);

    const docUpdate: Record<string, unknown> = { atualizadoEm: FieldValue.serverTimestamp() };
    if (input.nome !== undefined) docUpdate.nome = input.nome;
    if (input.email !== undefined) docUpdate.email = input.email;
    if (input.perfil !== undefined) docUpdate.perfil = input.perfil;
    if (input.ativo !== undefined) docUpdate.ativo = input.ativo;
    await db.collection(COLLECTIONS.users).doc(uid).update(docUpdate);
    return (await getUser(deps, uid))!;
  } catch (err) {
    throw toAppError(err);
  }
}

/** Exclui o usuário e a jornada. As marcações de ponto são mantidas como histórico. */
export async function deleteUser(deps: Deps, actor: Actor, uid: string) {
  const { db, auth } = deps;
  await requireEditableTarget(deps, actor, uid);
  if (actor.uid === uid) throw new AppError(400, "Você não pode excluir a si mesmo.");
  try {
    await auth.deleteUser(uid).catch((err) => {
      if ((err as { code?: string }).code !== "auth/user-not-found") throw err;
    });
    const batch = db.batch();
    batch.delete(db.collection(COLLECTIONS.users).doc(uid));
    batch.delete(db.collection(COLLECTIONS.workSchedules).doc(uid));
    await batch.commit();
  } catch (err) {
    throw toAppError(err);
  }
}
