import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { listDayEntries, listEntries, recordPunch } from "@/lib/server/entries";
import { getAttendanceReport } from "@/lib/server/reports";
import { closeApps, resetEmulators, testDeps } from "./helpers";

describe("marcações de ponto", () => {
  beforeEach(resetEmulators);
  afterAll(closeApps);

  it("alterna entrada e saída e grava dateKey em America/Sao_Paulo", async () => {
    const deps = testDeps();
    const a = await recordPunch(deps, "u1", new Date("2026-11-23T11:00:00Z")); // 08:00 SP
    const b = await recordPunch(deps, "u1", new Date("2026-11-23T15:00:00Z"));
    const c = await recordPunch(deps, "u1", new Date("2026-11-23T16:00:00Z"));
    expect([a.tipo, b.tipo, c.tipo]).toEqual(["entrada", "saida", "entrada"]);
    expect(a.dateKey).toBe("2026-11-23");

    // 01:00 UTC do dia 24 ainda é dia 23 em São Paulo
    const d = await recordPunch(deps, "u1", new Date("2026-11-24T01:00:00Z"));
    expect(d).toMatchObject({ tipo: "saida", dateKey: "2026-11-23" });

    // novo dia começa com entrada
    const e = await recordPunch(deps, "u1", new Date("2026-11-24T11:00:00Z"));
    expect(e).toMatchObject({ tipo: "entrada", dateKey: "2026-11-24" });

    expect((await listDayEntries(deps, "u1", "2026-11-23")).map((x) => x.tipo)).toEqual([
      "entrada",
      "saida",
      "entrada",
      "saida",
    ]);
  });

  it("lista o mês atual e meses anteriores separadamente", async () => {
    const deps = testDeps();
    await recordPunch(deps, "u1", new Date("2026-10-31T11:00:00Z"));
    await recordPunch(deps, "u1", new Date("2026-11-01T02:30:00Z")); // ainda 31/10 em SP
    await recordPunch(deps, "u1", new Date("2026-11-03T11:00:00Z"));
    await recordPunch(deps, "u2", new Date("2026-11-03T11:00:00Z"));

    expect((await listEntries(deps, "u1", "2026-10-01", "2026-10-31")).length).toBe(2);
    expect((await listEntries(deps, "u1", "2026-11-01", "2026-11-30")).length).toBe(1);
  });

  it("gera o relatório a partir das marcações", async () => {
    const deps = testDeps();
    const f = await deps.auth.createUser({ email: "f@x.com", password: "123456" });
    await deps.db.doc(`users/${f.uid}`).set({ uid: f.uid, nome: "Func", email: "f@x.com", perfil: "funcionario", ativo: true });
    await deps.db.doc(`workSchedules/${f.uid}`).set({ uid: f.uid, horasSemanais: 40 });
    await recordPunch(deps, f.uid, new Date("2026-11-23T11:00:00Z"));
    await recordPunch(deps, f.uid, new Date("2026-11-23T20:00:00Z")); // 9h

    const r = await getAttendanceReport(deps, f.uid, "2026-11-23", "2026-11-24", new Date("2026-11-30T12:00:00Z"));
    expect(r.totals).toEqual({ workedMinutes: 540, expectedMinutes: 960, balanceMinutes: -420 });
  });
});
