"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import type { EntryType } from "@/lib/hours";

export function PunchButton({ next, dateKey }: { next: EntryType; dateKey: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function punch() {
    start(async () => {
      try {
        const { entry } = await apiFetch<{ entry: { tipo: EntryType; timestamp: string } }>("/api/ponto", {
          method: "POST",
          json: { tipo: next, dateKey },
        });
        const hora = new Date(entry.timestamp).toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit",
        });
        toast.success(`${entry.tipo === "entrada" ? "Entrada" : "Saída"} registrada às ${hora}.`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao registrar.");
        router.refresh();
      }
    });
  }

  return (
    <Button size="lg" className="h-14 text-base" onClick={punch} disabled={pending}>
      {pending ? "Registrando..." : next === "entrada" ? "Marcar entrada" : "Marcar saída"}
    </Button>
  );
}
