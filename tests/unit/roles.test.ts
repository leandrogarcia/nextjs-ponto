import { describe, expect, it } from "vitest";
import { assignableRoles, canAccessPath, homeFor, isPublicPath, isRole } from "@/lib/roles";

describe("canAccessPath", () => {
  it("libera rotas públicas para qualquer perfil", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/install")).toBe(true);
    expect(isPublicPath("/admin")).toBe(false);
  });

  it("restringe /admin à gerência", () => {
    expect(canAccessPath("gerencia", "/admin/usuarios")).toBe(true);
    expect(canAccessPath("funcionario", "/admin/usuarios")).toBe(false);
    expect(canAccessPath("funcionario", "/admin")).toBe(false);
    expect(canAccessPath("root", "/admin/relatorios")).toBe(false);
  });

  it("restringe /root ao root", () => {
    expect(canAccessPath("root", "/root")).toBe(true);
    expect(canAccessPath("gerencia", "/root")).toBe(false);
  });

  it("restringe ponto ao funcionário", () => {
    expect(canAccessPath("funcionario", "/ponto")).toBe(true);
    expect(canAccessPath("funcionario", "/meu-ponto")).toBe(true);
    expect(canAccessPath("gerencia", "/meu-ponto")).toBe(false);
  });

  it("não confunde prefixos parecidos", () => {
    expect(canAccessPath("funcionario", "/administracao")).toBe(true);
    expect(canAccessPath("gerencia", "/pontos")).toBe(true);
  });
});

describe("homeFor", () => {
  it("leva cada perfil para a sua área", () => {
    expect(homeFor("root")).toBe("/root");
    expect(homeFor("gerencia")).toBe("/admin/usuarios");
    expect(homeFor("funcionario")).toBe("/ponto");
  });
});

describe("assignableRoles", () => {
  it("root só cria o primeiro gerente", () => {
    expect(assignableRoles("root", false)).toEqual(["gerencia"]);
    expect(assignableRoles("root", true)).toEqual([]);
  });
  it("gerência cria funcionários e gerentes", () => {
    expect(assignableRoles("gerencia", true)).toEqual(["funcionario", "gerencia"]);
  });
  it("funcionário não cria ninguém", () => {
    expect(assignableRoles("funcionario", true)).toEqual([]);
  });
});

describe("isRole", () => {
  it("valida perfis", () => {
    expect(isRole("gerencia")).toBe(true);
    expect(isRole("admin")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});
