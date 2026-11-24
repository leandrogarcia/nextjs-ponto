import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { isInstalled, runInstall } from "@/lib/server/install";
import { closeApps, resetEmulators, testDeps } from "./helpers";

const input = { secret: "s3gredo", nome: "Root", email: "root@empresa.com", senha: "123456" };

describe("runInstall", () => {
  beforeEach(resetEmulators);
  afterAll(closeApps);

  it("cria settings e o usuário root em base vazia", async () => {
    const deps = testDeps();
    expect(await isInstalled(deps)).toBe(false);
    const { uid } = await runInstall(deps, input, "s3gredo");

    expect(await isInstalled(deps)).toBe(true);
    const settings = await deps.db.doc("settings/app").get();
    expect(settings.get("fusoHorario")).toBe("America/Sao_Paulo");
    const user = await deps.db.doc(`users/${uid}`).get();
    expect(user.data()).toMatchObject({ uid, nome: "Root", email: "root@empresa.com", perfil: "root", ativo: true });
    expect((await deps.auth.getUser(uid)).customClaims).toEqual({ role: "root" });
  });

  it("recusa a segunda execução", async () => {
    const deps = testDeps();
    await runInstall(deps, input, "s3gredo");
    await expect(runInstall(deps, { ...input, email: "outro@empresa.com" }, "s3gredo")).rejects.toMatchObject({
      status: 409,
    });
  });

  it("aceita só uma de duas execuções concorrentes", async () => {
    const deps = testDeps();
    const results = await Promise.allSettled([
      runInstall(deps, input, "s3gredo"),
      runInstall(deps, { ...input, email: "b@empresa.com" }, "s3gredo"),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await deps.db.collection("users").get()).size).toBe(1);
  });

  it("recusa segredo inválido ou ausente", async () => {
    const deps = testDeps();
    await expect(runInstall(deps, input, "outro")).rejects.toMatchObject({ status: 401 });
    await expect(runInstall(deps, input, undefined)).rejects.toMatchObject({ status: 503 });
    expect(await isInstalled(deps)).toBe(false);
  });
});
