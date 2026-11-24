import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { homeFor } from "@/lib/roles";
import { getSessionUser } from "@/lib/server/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(homeFor(user.perfil));
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sistema de Ponto</CardTitle>
          <CardDescription>Entre com seu e-mail e senha.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
