import { describe, expect, it } from "vitest";
import { createUserSchema, installSchema, reportQuerySchema, updateUserSchema, workScheduleSchema } from "@/lib/schemas";

describe("createUserSchema", () => {
  it("normaliza o e-mail", () => {
    const r = createUserSchema.parse({ nome: " Ana ", email: " ANA@Empresa.com ", senha: "123456", perfil: "funcionario" });
    expect(r).toEqual({ nome: "Ana", email: "ana@empresa.com", senha: "123456", perfil: "funcionario" });
  });
  it("recusa perfil root e senha curta", () => {
    expect(createUserSchema.safeParse({ nome: "Ana", email: "a@b.com", senha: "123456", perfil: "root" }).success).toBe(false);
    expect(createUserSchema.safeParse({ nome: "Ana", email: "a@b.com", senha: "123", perfil: "funcionario" }).success).toBe(false);
  });
});

describe("updateUserSchema", () => {
  it("exige pelo menos um campo", () => {
    expect(updateUserSchema.safeParse({}).success).toBe(false);
    expect(updateUserSchema.safeParse({ ativo: false }).success).toBe(true);
  });
});

describe("workScheduleSchema", () => {
  it("valida limites", () => {
    expect(workScheduleSchema.safeParse({ horasSemanais: 44 }).success).toBe(true);
    expect(workScheduleSchema.safeParse({ horasSemanais: -1 }).success).toBe(false);
    expect(workScheduleSchema.safeParse({ horasSemanais: 81 }).success).toBe(false);
    expect(workScheduleSchema.safeParse({ horasSemanais: "40" }).success).toBe(false);
  });
});

describe("reportQuerySchema", () => {
  it("valida o período", () => {
    expect(reportQuerySchema.safeParse({ uid: "x", inicio: "2026-11-01", fim: "2026-11-30" }).success).toBe(true);
    expect(reportQuerySchema.safeParse({ uid: "x", inicio: "2026-11-30", fim: "2026-11-01" }).success).toBe(false);
    expect(reportQuerySchema.safeParse({ uid: "x", inicio: "2025-01-01", fim: "2026-11-01" }).success).toBe(false);
    expect(reportQuerySchema.safeParse({ uid: "", inicio: "2026-11-01", fim: "2026-11-30" }).success).toBe(false);
  });
});

describe("installSchema", () => {
  it("exige segredo", () => {
    expect(installSchema.safeParse({ secret: "", nome: "Root", email: "r@x.com", senha: "123456" }).success).toBe(false);
  });
});
