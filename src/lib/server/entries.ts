import { Timestamp } from "firebase-admin/firestore";
import { AppError } from "../errors";
import { nextEntryType, type EntryType, type TimeEntry } from "../hours";
import { toDateKey } from "../time";
import { COLLECTIONS } from "./collections";
import type { Deps } from "./deps";

export const MIN_PUNCH_INTERVAL_SECONDS = Number(process.env.PUNCH_MIN_INTERVAL_SECONDS ?? 60);

function toEntry(doc: FirebaseFirestore.QueryDocumentSnapshot): TimeEntry {
  const data = doc.data();
  return {
    id: doc.id,
    uid: data.uid,
    tipo: data.tipo as EntryType,
    timestamp: (data.timestamp as Timestamp).toDate(),
    dateKey: data.dateKey,
  };
}

const byTime = (a: TimeEntry, b: TimeEntry) => a.timestamp.getTime() - b.timestamp.getTime();

export async function listDayEntries({ db }: Pick<Deps, "db">, uid: string, dateKey: string) {
  const snap = await db
    .collection(COLLECTIONS.timeEntries)
    .where("uid", "==", uid)
    .where("dateKey", "==", dateKey)
    .get();
  return snap.docs.map(toEntry).sort(byTime);
}

/** Marcações de `start` a `end` (dateKeys inclusivos). Usa o índice composto uid + dateKey. */
export async function listEntries({ db }: Pick<Deps, "db">, uid: string, start: string, end: string) {
  const snap = await db
    .collection(COLLECTIONS.timeEntries)
    .where("uid", "==", uid)
    .where("dateKey", ">=", start)
    .where("dateKey", "<=", end)
    .get();
  return snap.docs.map(toEntry).sort(byTime);
}

/**
 * Registra uma marcação com o horário do servidor. O tipo alterna conforme a
 * última marcação do dia, dentro de uma transação para evitar cliques duplos.
 */
export async function recordPunch(
  { db }: Pick<Deps, "db">,
  uid: string,
  now = new Date(),
  expected?: { tipo: EntryType; dateKey: string },
) {
  const dateKey = toDateKey(now);
  const col = db.collection(COLLECTIONS.timeEntries);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(col.where("uid", "==", uid).where("dateKey", "==", dateKey));
    const last = snap.docs.map(toEntry).sort(byTime).at(-1);
    if (last && now.getTime() - last.timestamp.getTime() < MIN_PUNCH_INTERVAL_SECONDS * 1000) {
      throw new AppError(429, `Aguarde ${MIN_PUNCH_INTERVAL_SECONDS} segundos entre marcações.`);
    }
    const tipo = nextEntryType(last);
    // A tela mostrava outro dia ou outra ação (página aberta antes da meia-noite, outra aba).
    if (expected && (expected.dateKey !== dateKey || expected.tipo !== tipo)) {
      throw new AppError(409, "A tela estava desatualizada. Confira a próxima marcação e tente novamente.");
    }
    const ref = col.doc();
    const entry = { uid, tipo, timestamp: Timestamp.fromDate(now), dateKey };
    tx.create(ref, entry);
    return { id: ref.id, uid, tipo, timestamp: now, dateKey } satisfies TimeEntry;
  });
}
