"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api-client";

interface Row {
  uid: string;
  nome: string;
  email: string;
  ativo: boolean;
  horasSemanais: number | null;
  atualizadoEm: string | null;
}

export function SchedulesTable({ rows }: { rows: Row[] }) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Horas semanais</TableHead>
              <TableHead>Por dia útil</TableHead>
              <TableHead>Atualizado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <ScheduleRow key={r.uid} row={r} />
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum funcionário cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ScheduleRow({ row }: { row: Row }) {
  const router = useRouter();
  const [value, setValue] = useState(row.horasSemanais?.toString() ?? "");
  const [pending, start] = useTransition();
  const hours = Number(value.replace(",", "."));
  const dirty = value !== (row.horasSemanais?.toString() ?? "");

  function save() {
    start(async () => {
      try {
        await apiFetch(`/api/jornadas/${row.uid}`, { method: "PUT", json: { horasSemanais: hours } });
        toast.success(`Jornada de ${row.nome} salva.`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{row.nome}</div>
        <div className="text-xs text-muted-foreground">
          {row.email}
          {!row.ativo && " · inativo"}
        </div>
      </TableCell>
      <TableCell>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Input
            aria-label={`Horas semanais de ${row.nome}`}
            inputMode="decimal"
            className="w-24"
            value={value}
            placeholder="—"
            onChange={(e) => setValue(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={!dirty || value === "" || Number.isNaN(hours) || pending}>
            Salvar
          </Button>
        </form>
      </TableCell>
      <TableCell>{row.horasSemanais !== null ? `${(row.horasSemanais / 5).toLocaleString("pt-BR")} h` : "—"}</TableCell>
      <TableCell>{row.atualizadoEm ? new Date(row.atualizadoEm).toLocaleString("pt-BR") : "—"}</TableCell>
    </TableRow>
  );
}
