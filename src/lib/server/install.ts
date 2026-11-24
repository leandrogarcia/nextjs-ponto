import { timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { AppError, errorCode, toAppError } from "../errors";
import type { InstallInput } from "../schemas";
import { TIME_ZONE } from "../time";
import { COLLECTIONS, INSTALL_LOCK_DOC, SETTINGS_DOC } from "./collections";
import type { Deps } from "./deps";

export function checkInstallSecret(provided: string, expected: string | undefined) {
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isInstalled({ db }: Pick<Deps, "db">) {
  const snap = await db.collection(COLLECTIONS.settings).doc(SETTINGS_DOC).get();
  return snap.exists && snap.get("instalado") === true;
}

/**
 * Cria `settings/app` e o usuário root. Um documento de trava criado com
 * `create()` garante uma única execução, mesmo com requisições concorrentes.
 */
export async function runInstall(deps: Deps, input: InstallInput, expectedSecret: string | undefined) {
  const { db, auth } = deps;
  if (!expectedSecret) throw new AppError(503, "INSTALL_SECRET não está configurado no servidor.");
  if (!checkInstallSecret(input.secret, expectedSecret)) throw new AppError(401, "Segredo de instalação inválido.");
  if (await isInstalled(deps)) throw new AppError(409, "O sistema já foi instalado.");

  const settings = db.collection(COLLECTIONS.settings);
  const lockRef = settings.doc(INSTALL_LOCK_DOC);
  try {
    await lockRef.create({ criadoEm: FieldValue.serverTimestamp() });
  } catch (err) {
    if (errorCode(err) === "6" || errorCode(err) === "already-exists") {
      throw new AppError(409, "O sistema já foi instalado.");
    }
    throw toAppError(err);
  }

  let uid: string | undefined;
  try {
    const user = await auth.createUser({ email: input.email, password: input.senha, displayName: input.nome });
    uid = user.uid;
    await auth.setCustomUserClaims(uid, { role: "root" });
    const batch = db.batch();
    batch.set(db.collection(COLLECTIONS.users).doc(uid), {
      uid,
      nome: input.nome,
      email: input.email,
      perfil: "root",
      ativo: true,
      criadoEm: FieldValue.serverTimestamp(),
    });
    batch.set(settings.doc(SETTINGS_DOC), {
      instalado: true,
      fusoHorario: TIME_ZONE,
      criadoEm: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return { uid };
  } catch (err) {
    if (uid) await auth.deleteUser(uid).catch(() => undefined);
    await lockRef.delete().catch(() => undefined);
    throw toAppError(err);
  }
}
