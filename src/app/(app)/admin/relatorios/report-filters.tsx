"use client";

import { useRouter } from "next/navigation";
import { FormField } from "@/components/form-field";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ReportFilters({
  employees,
  initial,
}: {
  employees: { uid: string; nome: string }[];
  initial: { uid: string; inicio: string; fim: string };
}) {
  const router = useRouter();
  return (
    <Card>
      <CardContent>
        <form
          className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto_auto]"
          action={(form) => router.push(`/admin/relatorios?${new URLSearchParams(form as unknown as Record<string, string>)}`)}
        >
          <FormField label="Funcionário" htmlFor="uid">
            <NativeSelect id="uid" name="uid" defaultValue={initial.uid} required>
              <option value="" disabled>
                Selecione
              </option>
              {employees.map((e) => (
                <option key={e.uid} value={e.uid}>
                  {e.nome}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Início" htmlFor="inicio">
            <Input id="inicio" name="inicio" type="date" defaultValue={initial.inicio} required />
          </FormField>
          <FormField label="Fim" htmlFor="fim">
            <Input id="fim" name="fim" type="date" defaultValue={initial.fim} required />
          </FormField>
          <Button type="submit">Gerar</Button>
        </form>
      </CardContent>
    </Card>
  );
}
