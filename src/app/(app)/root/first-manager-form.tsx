"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";

export function FirstManagerForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(form: FormData) {
    setError(null);
    start(async () => {
      try {
        await apiFetch("/api/users", { method: "POST", json: { ...Object.fromEntries(form), perfil: "gerencia" } });
        toast.success("Gerente cadastrado.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao cadastrar.");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      <FormField label="Nome" htmlFor="nome">
        <Input id="nome" name="nome" required />
      </FormField>
      <FormField label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" required />
      </FormField>
      <FormField label="Senha" htmlFor="senha">
        <Input id="senha" name="senha" type="password" minLength={6} autoComplete="new-password" required />
      </FormField>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Cadastrar gerente"}
      </Button>
    </form>
  );
}
