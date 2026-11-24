import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  formatMinutes,
  formatMonthKey,
  isDateKey,
  isMonthKey,
  isWorkday,
  monthRange,
  shiftMonth,
  toDateKey,
} from "@/lib/time";

describe("toDateKey", () => {
  it("usa o fuso America/Sao_Paulo", () => {
    // 02:30 UTC do dia 2 ainda é dia 1 em São Paulo (UTC-3)
    expect(toDateKey(new Date("2026-11-02T02:30:00Z"))).toBe("2026-11-01");
    expect(toDateKey(new Date("2026-11-02T03:00:00Z"))).toBe("2026-11-02");
  });
});

describe("intervalos de datas", () => {
  it("calcula o mês", () => {
    expect(monthRange("2026-02")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(monthRange("2028-02")).toEqual({ start: "2028-02-01", end: "2028-02-29" });
    expect(monthRange("2026-12")).toEqual({ start: "2026-12-01", end: "2026-12-31" });
  });
  it("navega entre meses e anos", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
  it("lista dias inclusive", () => {
    expect(daysBetween("2026-02-27", "2026-03-02")).toEqual(["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("identifica dias úteis", () => {
    expect(isWorkday("2026-11-23")).toBe(true); // segunda
    expect(isWorkday("2026-11-27")).toBe(true); // sexta
    expect(isWorkday("2026-11-28")).toBe(false); // sábado
    expect(isWorkday("2026-11-29")).toBe(false); // domingo
  });
  it("valida chaves", () => {
    expect(isDateKey("2026-02-29")).toBe(false);
    expect(isDateKey("2026-11-23")).toBe(true);
    expect(isDateKey("9999-12-31")).toBe(false);
    expect(isDateKey("0001-01-01")).toBe(false);
    expect(isMonthKey("2026-13")).toBe(false);
    expect(isMonthKey("2026-11")).toBe(true);
  });
});

describe("formatação", () => {
  it("formata minutos", () => {
    expect(formatMinutes(0)).toBe("00:00");
    expect(formatMinutes(485)).toBe("08:05");
    expect(formatMinutes(-30, true)).toBe("-00:30");
    expect(formatMinutes(90, true)).toBe("+01:30");
  });
  it("formata o mês", () => {
    expect(formatMonthKey("2026-11")).toBe("Novembro de 2026");
  });
});
