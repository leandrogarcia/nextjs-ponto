import { describe, expect, it } from "vitest";
import {
  buildReport,
  expectedMinutesForDay,
  nextEntryType,
  summarizeDay,
  summarizePeriod,
  totalWorked,
  type TimeEntry,
} from "@/lib/hours";

let seq = 0;
function e(tipo: TimeEntry["tipo"], iso: string, dateKey = iso.slice(0, 10)): TimeEntry {
  return { id: String(seq++), uid: "u1", tipo, timestamp: new Date(iso), dateKey };
}

describe("nextEntryType", () => {
  it("alterna entrada e saída", () => {
    expect(nextEntryType(null)).toBe("entrada");
    expect(nextEntryType({ tipo: "entrada" })).toBe("saida");
    expect(nextEntryType({ tipo: "saida" })).toBe("entrada");
  });
});

describe("summarizeDay", () => {
  it("soma vários pares no dia", () => {
    const day = summarizeDay("2026-11-23", [
      e("saida", "2026-11-23T15:00:00-03:00"),
      e("entrada", "2026-11-23T08:00:00-03:00"),
      e("saida", "2026-11-23T12:00:00-03:00"),
      e("entrada", "2026-11-23T13:00:00-03:00"),
    ]);
    expect(day.workedMinutes).toBe(6 * 60);
    expect(day.open).toBe(false);
    expect(day.entries.map((x) => x.tipo)).toEqual(["entrada", "saida", "entrada", "saida"]);
  });

  it("não conta entrada sem saída e marca o dia como aberto", () => {
    const day = summarizeDay("2026-11-23", [
      e("entrada", "2026-11-23T08:00:00-03:00"),
      e("saida", "2026-11-23T12:30:00-03:00"),
      e("entrada", "2026-11-23T13:30:00-03:00"),
    ]);
    expect(day.workedMinutes).toBe(270);
    expect(day.open).toBe(true);
  });

  it("ignora saída sem entrada", () => {
    expect(summarizeDay("2026-11-23", [e("saida", "2026-11-23T08:00:00-03:00")]).workedMinutes).toBe(0);
  });
});

describe("totais do mês", () => {
  it("soma os dias e inclui dias sem marcação", () => {
    const days = summarizePeriod(
      [
        e("entrada", "2026-11-02T08:00:00-03:00"),
        e("saida", "2026-11-02T17:00:00-03:00"),
        e("entrada", "2026-11-03T09:00:00-03:00"),
        e("saida", "2026-11-03T13:15:00-03:00"),
      ],
      "2026-11-01",
      "2026-11-30",
    );
    expect(days).toHaveLength(30);
    expect(totalWorked(days)).toBe(9 * 60 + 4 * 60 + 15);
  });
});

describe("relatório e saldo", () => {
  it("espera jornada/5 só em dias úteis", () => {
    expect(expectedMinutesForDay("2026-11-23", 40)).toBe(480);
    expect(expectedMinutesForDay("2026-11-28", 40)).toBe(0);
    expect(expectedMinutesForDay("2026-11-23", 44)).toBe(528);
  });

  it("calcula trabalhadas, esperadas e saldo", () => {
    const entries = [
      e("entrada", "2026-11-23T08:00:00-03:00"),
      e("saida", "2026-11-23T17:00:00-03:00"), // 9h na segunda
      e("entrada", "2026-11-24T08:00:00-03:00"),
      e("saida", "2026-11-24T14:00:00-03:00"), // 6h na terça
    ];
    const { rows, totals } = buildReport(entries, "2026-11-23", "2026-11-29", 40, "2026-11-30");
    expect(rows).toHaveLength(7);
    expect(rows[0].balanceMinutes).toBe(60);
    expect(rows[1].balanceMinutes).toBe(-120);
    expect(totals).toEqual({ workedMinutes: 900, expectedMinutes: 5 * 480, balanceMinutes: 900 - 2400 });
  });

  it("não espera horas de dias futuros", () => {
    const { totals } = buildReport([], "2026-11-23", "2026-11-27", 40, "2026-11-24");
    expect(totals.expectedMinutes).toBe(2 * 480);
  });
});
