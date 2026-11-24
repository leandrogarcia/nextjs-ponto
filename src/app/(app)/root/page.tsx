import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageRole, deps } from "@/lib/server/session";
import { listUsers } from "@/lib/server/users";
import { FirstManagerForm } from "./first-manager-form";

export default async function RootPage() {
  await requirePageRole("root");
  const managers = await listUsers(deps(), { perfil: "gerencia" });
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Primeiro gerente</CardTitle>
        <CardDescription>
          {managers.length
            ? "O primeiro gerente já foi cadastrado. A gerência administra os demais usuários."
            : "O usuário root serve apenas para cadastrar o primeiro gerente."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {managers.length ? (
          <ul className="text-sm">
            {managers.map((m) => (
              <li key={m.uid}>
                {m.nome} ({m.email})
              </li>
            ))}
          </ul>
        ) : (
          <FirstManagerForm />
        )}
      </CardContent>
    </Card>
  );
}
