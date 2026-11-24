import { daysBetween, isWorkday } from "./time";

export type EntryType = "entrada" | "saida";

export interface TimeEntry {
  id: string;
  uid: string;
  tipo: EntryType;
  timestamp: Date;
  dateKey: string;
}

export interface DaySummary {
  dateKey: string;
  entries: TimeEntry[];
  workedMinutes: number;
  /** Entrada sem saída correspondente. */
  open: boolean;
}

/** Tipo da próxima marcação a partir da última marcação do dia. */
export function nextEntryType(lastOfDay: Pick<TimeEntry, "tipo"> | null | undefined): EntryType {
  return lastOfDay?.tipo === "entrada" ? "saida" : "entrada";
}

/** Soma os pares entrada → saída de um dia, em minutos. */
export function summarizeDay(dateKey: string, entries: TimeEntry[]): DaySummary {
  const sorted = [...entries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  let openAt: Date | null = null;
  let ms = 0;
  for (const e of sorted) {
    if (e.tipo === "entrada") {
      openAt ??= e.timestamp;
    } else if (openAt) {
      ms += e.timestamp.getTime() - openAt.getTime();
      openAt = null;
    }
  }
  return { dateKey, entries: sorted, workedMinutes: Math.floor(ms / 60000), open: openAt !== null };
}

export function groupByDay(entries: TimeEntry[]) {
  const map = new Map<string, TimeEntry[]>();
  for (const e of entries) {
    const list = map.get(e.dateKey) ?? [];
    list.push(e);
    map.set(e.dateKey, list);
  }
  return map;
}

/** Um resumo por dia do intervalo, incluindo dias sem marcações. */
export function summarizePeriod(entries: TimeEntry[], start: string, end: string): DaySummary[] {
  const byDay = groupByDay(entries);
  return daysBetween(start, end).map((k) => summarizeDay(k, byDay.get(k) ?? []));
}

export function totalWorked(days: DaySummary[]) {
  return days.reduce((acc, d) => acc + d.workedMinutes, 0);
}

/** Horas esperadas por dia útil: jornada semanal / 5, de segunda a sexta. */
export function expectedMinutesForDay(dateKey: string, weeklyHours: number) {
  return isWorkday(dateKey) ? Math.round((weeklyHours * 60) / 5) : 0;
}

export interface ReportRow extends DaySummary {
  expectedMinutes: number;
  balanceMinutes: number;
}

export interface ReportTotals {
  workedMinutes: number;
  expectedMinutes: number;
  balanceMinutes: number;
}

/**
 * Linhas do relatório de frequência. Dias depois de `today` não contam como
 * horas esperadas, para o saldo de um período em andamento não ficar negativo.
 */
export function buildReport(
  entries: TimeEntry[],
  start: string,
  end: string,
  weeklyHours: number,
  today: string,
): { rows: ReportRow[]; totals: ReportTotals } {
  const rows = summarizePeriod(entries, start, end).map((d) => {
    const expected = d.dateKey <= today ? expectedMinutesForDay(d.dateKey, weeklyHours) : 0;
    return { ...d, expectedMinutes: expected, balanceMinutes: d.workedMinutes - expected };
  });
  const totals = rows.reduce<ReportTotals>(
    (acc, r) => ({
      workedMinutes: acc.workedMinutes + r.workedMinutes,
      expectedMinutes: acc.expectedMinutes + r.expectedMinutes,
      balanceMinutes: acc.balanceMinutes + r.balanceMinutes,
    }),
    { workedMinutes: 0, expectedMinutes: 0, balanceMinutes: 0 },
  );
  return { rows, totals };
}
