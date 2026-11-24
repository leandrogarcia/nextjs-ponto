"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export function MonthPicker({ value, max }: { value: string; max: string }) {
  const router = useRouter();
  return (
    <Input
      type="month"
      aria-label="Selecionar mês"
      className="w-40"
      value={value}
      max={max}
      onChange={(e) => e.target.value && router.push(`/meu-ponto?mes=${e.target.value}`)}
    />
  );
}
