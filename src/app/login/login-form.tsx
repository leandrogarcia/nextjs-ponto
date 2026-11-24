"use client";

import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { errorCode } from "@/lib/errors";
import { clientAuth } from "@/lib/firebase/client";

const AUTH_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/user-disabled": "Usuário desativado.",
  "auth/too-many-requests": "Muitas tentativas. Tente novamente em alguns minutos.",
};

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    start(async () => {
      const auth = clientAuth();
      try {
        const cred = await signInWithEmailAndPassword(auth, String(form.get("email")), String(form.get("senha")));
        const idToken = await cred.user.getIdToken();
        const { home } = await apiFetch<{ home: string }>("/api/auth/session", { method: "POST", json: { idToken } });
        router.replace(home);
        router.refresh();
      } catch (err) {
        const code = errorCode(err);
        setError((code && AUTH_ERRORS[code]) || (err instanceof Error && !code ? err.message : "Não foi possível entrar."));
      } finally {
        await signOut(auth).catch(() => undefined);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <FormField label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </FormField>
      <FormField label="Senha" htmlFor="senha">
        <Input id="senha" name="senha" type="password" autoComplete="current-password" required />
      </FormField>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
