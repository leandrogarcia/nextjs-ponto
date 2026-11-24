import { AppError } from "../errors";
import { buildReport, type ReportRow, type ReportTotals } from "../hours";
import { formatDateKey, formatMinutes, formatTime, toDateKey, weekdayLabel } from "../time";
import type { Deps } from "./deps";
import { listEntries } from "./entries";
import { getSchedule } from "./schedules";
import { getUser, type AppUser } from "./users";

export interface AttendanceReport {
  user: AppUser;
  inicio: string;
  fim: string;
  horasSemanais: number;
  rows: ReportRow[];
  totals: ReportTotals;
  geradoEm: Date;
}

export async function getAttendanceReport(deps: Pick<Deps, "db">, uid: string, inicio: string, fim: string, now = new Date()) {
  const user = await getUser(deps, uid);
  if (!user || user.perfil !== "funcionario") throw new AppError(404, "Funcionário não encontrado.");
  const [schedule, entries] = await Promise.all([getSchedule(deps, uid), listEntries(deps, uid, inicio, fim)]);
  const horasSemanais = schedule?.horasSemanais ?? 0;
  const { rows, totals } = buildReport(entries, inicio, fim, horasSemanais, toDateKey(now));
  return { user, inicio, fim, horasSemanais, rows, totals, geradoEm: now } satisfies AttendanceReport;
}

export function entriesLabel(row: ReportRow) {
  return row.entries.map((e) => `${e.tipo === "entrada" ? "E" : "S"} ${formatTime(e.timestamp)}`).join(" · ");
}

function csvCell(value: string) {
  return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** CSV separado por ponto e vírgula, com BOM, para abrir direto no Excel em pt-BR. */
export function reportToCsv(report: AttendanceReport) {
  const lines = [
    ["Funcionário", report.user.nome],
    ["E-mail", report.user.email],
    ["Período", `${formatDateKey(report.inicio)} a ${formatDateKey(report.fim)}`],
    ["Jornada semanal (h)", String(report.horasSemanais)],
    [],
    ["Data", "Dia", "Marcações", "Trabalhadas", "Esperadas", "Saldo"],
    ...report.rows.map((r) => [
      formatDateKey(r.dateKey),
      weekdayLabel(r.dateKey),
      entriesLabel(r),
      formatMinutes(r.workedMinutes),
      formatMinutes(r.expectedMinutes),
      formatMinutes(r.balanceMinutes, true),
    ]),
    [
      "Total",
      "",
      "",
      formatMinutes(report.totals.workedMinutes),
      formatMinutes(report.totals.expectedMinutes),
      formatMinutes(report.totals.balanceMinutes, true),
    ],
  ];
  return "\uFEFF" + lines.map((l) => l.map(csvCell).join(";")).join("\r\n") + "\r\n";
}

export function reportFileName(report: AttendanceReport, ext: string) {
  const slug = report.user.nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `frequencia-${slug || report.user.uid}-${report.inicio}-a-${report.fim}.${ext}`;
}
