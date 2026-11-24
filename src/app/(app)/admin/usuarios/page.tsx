import { deps, requirePageRole } from "@/lib/server/session";
import { listUsers } from "@/lib/server/users";
import { UsersManager } from "./users-manager";

export default async function UsersPage() {
  const me = await requirePageRole("gerencia");
  const users = (await listUsers(deps())).filter((u) => u.perfil !== "root");
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">Usuários</h1>
      <UsersManager users={users} currentUid={me.uid} />
    </div>
  );
}
