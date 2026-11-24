import Link from "next/link";
import { connection } from "next/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isInstalled } from "@/lib/server/install";
import { deps } from "@/lib/server/session";
import { InstallForm } from "./install-form";

export default async function InstallPage() {
  await connection();
  const installed = await isInstalled(deps());
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Instalação</CardTitle>
          <CardDescription>
            {installed
              ? "O sistema já foi instalado. Esta rota está bloqueada."
              : "Cria a estrutura inicial do banco e o usuário root, que cadastra o primeiro gerente."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {installed ? (
            <Link href="/login" className="text-sm underline">
              Ir para o login
            </Link>
          ) : (
            <InstallForm />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
