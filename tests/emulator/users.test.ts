import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { runInstall } from "@/lib/server/install";
import { getSchedule, setSchedule } from "@/lib/server/schedules";
import { createUser, deleteUser, listUsers, updateUser, type Actor } from "@/lib/server/users";
import { closeApps, resetEmulators, testDeps } from "./helpers";

async function setup() {
  const deps = testDeps();
  const { uid } = await runInstall(deps, { secret: "s", nome: "Root", email: "root@x.com", senha: "123456" }, "s");
  const root: Actor = { uid, perfil: "root" };
  return { deps, root };
}

describe("usuários", () => {
  beforeEach(resetEmulators);
  afterAll(closeApps);

  it("root cadastra só o primeiro gerente", async () => {
    const { deps, root } = await setup();
    await expect(
      createUser(deps, root, { nome: "Func", email: "f@x.com", senha: "123456", perfil: "funcionario" }),
    ).rejects.toMatchObject({ status: 403 });

    const g = await createUser(deps, root, { nome: "Gerente", email: "g@x.com", senha: "123456", perfil: "gerencia" });
    expect(g.perfil).toBe("gerencia");
    expect((await deps.auth.getUser(g.uid)).customClaims).toEqual({ role: "gerencia" });

    await expect(
      createUser(deps, root, { nome: "G2", email: "g2@x.com", senha: "123456", perfil: "gerencia" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("root cria só um gerente mesmo com requisições simultâneas", async () => {
    const { deps, root } = await setup();
    const results = await Promise.allSettled(
      ["a", "b", "c"].map((n) =>
        createUser(deps, root, { nome: n, email: `${n}@x.com`, senha: "123456", perfil: "gerencia" }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await listUsers(deps, { perfil: "gerencia" })).toHaveLength(1);
  });

  it("root pode tentar de novo se o cadastro do gerente falhar", async () => {
    const { deps, root } = await setup();
    await deps.auth.createUser({ email: "dup@x.com", password: "123456" });
    await expect(
      createUser(deps, root, { nome: "G", email: "dup@x.com", senha: "123456", perfil: "gerencia" }),
    ).rejects.toMatchObject({ status: 409 });
    const g = await createUser(deps, root, { nome: "G", email: "g@x.com", senha: "123456", perfil: "gerencia" });
    expect(g.perfil).toBe("gerencia");
  });

  it("root retoma uma trava antiga deixada por cadastro interrompido", async () => {
    const { deps, root } = await setup();
    const { Timestamp } = await import("firebase-admin/firestore");
    const lock = deps.db.doc("settings/first-manager-lock");
    await lock.set({ criadoEm: Timestamp.now() });
    await expect(
      createUser(deps, root, { nome: "G", email: "g@x.com", senha: "123456", perfil: "gerencia" }),
    ).rejects.toMatchObject({ status: 403 });
    await lock.set({ criadoEm: Timestamp.fromMillis(Date.now() - 5 * 60 * 1000) });
    const g = await createUser(deps, root, { nome: "G", email: "g@x.com", senha: "123456", perfil: "gerencia" });
    expect(g.perfil).toBe("gerencia");
  });

  it("gerente cria, edita, desativa e exclui funcionários", async () => {
    const { deps, root } = await setup();
    const g = await createUser(deps, root, { nome: "Gerente", email: "g@x.com", senha: "123456", perfil: "gerencia" });
    const gerente: Actor = { uid: g.uid, perfil: "gerencia" };

    const f = await createUser(deps, gerente, { nome: "Func", email: "f@x.com", senha: "123456", perfil: "funcionario" });
    await expect(
      createUser(deps, gerente, { nome: "Dup", email: "f@x.com", senha: "123456", perfil: "funcionario" }),
    ).rejects.toMatchObject({ status: 409 });

    const edited = await updateUser(deps, gerente, f.uid, { nome: "Func Editado", email: "f2@x.com", perfil: "gerencia" });
    expect(edited).toMatchObject({ nome: "Func Editado", email: "f2@x.com", perfil: "gerencia" });
    const authUser = await deps.auth.getUser(f.uid);
    expect(authUser.email).toBe("f2@x.com");
    expect(authUser.customClaims).toEqual({ role: "gerencia" });

    const off = await updateUser(deps, gerente, f.uid, { ativo: false });
    expect(off.ativo).toBe(false);
    expect((await deps.auth.getUser(f.uid)).disabled).toBe(true);

    await deleteUser(deps, gerente, f.uid);
    await expect(deps.auth.getUser(f.uid)).rejects.toBeTruthy();
    expect((await listUsers(deps)).map((u) => u.uid)).not.toContain(f.uid);
  });

  it("protege o root e o próprio gerente", async () => {
    const { deps, root } = await setup();
    const g = await createUser(deps, root, { nome: "Gerente", email: "g@x.com", senha: "123456", perfil: "gerencia" });
    const gerente: Actor = { uid: g.uid, perfil: "gerencia" };
    await expect(updateUser(deps, gerente, root.uid, { nome: "X" })).rejects.toMatchObject({ status: 403 });
    await expect(deleteUser(deps, gerente, root.uid)).rejects.toMatchObject({ status: 403 });
    await expect(updateUser(deps, gerente, g.uid, { perfil: "funcionario" })).rejects.toMatchObject({ status: 400 });
    await expect(updateUser(deps, gerente, g.uid, { ativo: false })).rejects.toMatchObject({ status: 400 });
    await expect(deleteUser(deps, gerente, g.uid)).rejects.toMatchObject({ status: 400 });
    await expect(updateUser(deps, root, g.uid, { nome: "X" })).rejects.toMatchObject({ status: 403 });
  });

  it("salva a jornada semanal só de funcionários", async () => {
    const { deps, root } = await setup();
    const g = await createUser(deps, root, { nome: "Gerente", email: "g@x.com", senha: "123456", perfil: "gerencia" });
    const gerente: Actor = { uid: g.uid, perfil: "gerencia" };
    const f = await createUser(deps, gerente, { nome: "Func", email: "f@x.com", senha: "123456", perfil: "funcionario" });

    await setSchedule(deps, gerente, f.uid, 44);
    expect((await getSchedule(deps, f.uid))?.horasSemanais).toBe(44);
    await expect(setSchedule(deps, gerente, g.uid, 40)).rejects.toMatchObject({ status: 400 });
    await expect(setSchedule(deps, { uid: f.uid, perfil: "funcionario" }, f.uid, 10)).rejects.toMatchObject({ status: 403 });
  });
});
