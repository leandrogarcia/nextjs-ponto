import { listSchedules } from "@/lib/server/schedules";
import { deps, requirePageRole } from "@/lib/server/session";
import { listUsers } from "@/lib/server/users";
import { SchedulesTable } from "./schedules-table";

export default async function SchedulesPage() {
  await requirePageRole("gerencia");
  const [users, schedules] = await Promise.all([listUsers(deps(), { perfil: "funcionario" }), listSchedules(deps())]);
  const rows = users.map((u) => ({
    uid: u.uid,
    nome: u.nome,
    email: u.email,
    ativo: u.ativo,
    horasSemanais: schedules.get(u.uid)?.horasSemanais ?? null,
    atualizadoEm: schedules.get(u.uid)?.atualizadoEm ?? null,
  }));
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Jornadas</h1>
        <p className="text-sm text-muted-foreground">
          Horas semanais de cada funcionário. As horas esperadas por dia são a jornada dividida por 5, de segunda a sexta.
        </p>
      </div>
      <SchedulesTable rows={rows} />
    </div>
  );
}
