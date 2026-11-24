import { describe, expect, it } from "vitest";
import { buildReport, type TimeEntry } from "@/lib/hours";
import { reportFileName, reportToCsv, type AttendanceReport } from "@/lib/server/reports";

const entries: TimeEntry[] = [
  { id: "1", uid: "u", tipo: "entrada", timestamp: new Date("2026-11-23T08:00:00-03:00"), dateKey: "2026-11-23" },
  { id: "2", uid: "u", tipo: "saida", timestamp: new Date("2026-11-23T17:30:00-03:00"), dateKey: "2026-11-23" },
];

function report(): AttendanceReport {
  const { rows, totals } = buildReport(entries, "2026-11-23", "2026-11-24", 40, "2026-11-30");
  return {
    user: { uid: "u", nome: "João da Silva; Jr", email: "j@x.com", perfil: "funcionario", ativo: true, criadoEm: null },
    inicio: "2026-11-23",
    fim: "2026-11-24",
    horasSemanais: 40,
    rows,
    totals,
    geradoEm: new Date("2026-11-30T12:00:00Z"),
  };
}

describe("reportToCsv", () => {
  it("gera as linhas com os mesmos totais", () => {
    const csv = reportToCsv(report());
    expect(csv.startsWith("\uFEFF")).toBe(true);
    const lines = csv.trim().split("\r\n");
    expect(lines[0]).toBe('Funcionário;"João da Silva; Jr"');
    expect(lines).toContain("23/11/2026;Seg;E 08:00 · S 17:30;09:30;08:00;+01:30");
    expect(lines).toContain("24/11/2026;Ter;;00:00;08:00;-08:00");
    expect(lines.at(-1)).toBe("Total;;;09:30;16:00;-06:30");
  });
});

describe("reportFileName", () => {
  it("remove acentos e símbolos", () => {
    expect(reportFileName(report(), "csv")).toBe("frequencia-joao-da-silva-jr-2026-11-23-a-2026-11-24.csv");
  });
});
