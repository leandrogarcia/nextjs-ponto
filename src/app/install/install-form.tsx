"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";

export function InstallForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    start(async () => {
      try {
        await apiFetch("/api/install", { method: "POST", json: Object.fromEntries(form) });
        toast.success("Instalação concluída. Entre com o usuário root.");
        router.replace("/login");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha na instalação.");
      }
    });
  }

  return (
    <form method="post" onSubmit={onSubmit} className="grid gap-4">
      <FormField label="Segredo de instalação" htmlFor="secret">
        <Input id="secret" name="secret" type="password" required />
      </FormField>
      <FormField label="Nome do root" htmlFor="nome">
        <Input id="nome" name="nome" required />
      </FormField>
      <FormField label="E-mail do root" htmlFor="email">
        <Input id="email" name="email" type="email" required />
      </FormField>
      <FormField label="Senha do root" htmlFor="senha">
        <Input id="senha" name="senha" type="password" minLength={6} autoComplete="new-password" required />
      </FormField>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Instalando..." : "Instalar"}
      </Button>
    </form>
  );
}
