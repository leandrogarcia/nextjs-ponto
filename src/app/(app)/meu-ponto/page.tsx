import Link from "next/link";
import { EntriesBadges } from "@/components/entries-badges";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { summarizePeriod, totalWorked } from "@/lib/hours";
import { listEntries } from "@/lib/server/entries";
import { deps, requirePageRole } from "@/lib/server/session";
import {
  formatDateKey,
  formatMinutes,
  formatMonthKey,
  isMonthKey,
  monthRange,
  shiftMonth,
  toDateKey,
  toMonthKey,
  weekdayLabel,
} from "@/lib/time";
import { MonthPicker } from "./month-picker";

export default async function MeuPontoPage(props: PageProps<"/meu-ponto">) {
  const user = await requirePageRole("funcionario");
  const params = await props.searchParams;
  const now = new Date();
  const current = toMonthKey(now);
  const requested = typeof params.mes === "string" && isMonthKey(params.mes) ? params.mes : current;
  const month = requested > current ? current : requested;
  const { start, end } = monthRange(month);
  const today = toDateKey(now);
  const lastDay = end > today ? today : end;

  const entries = await listEntries(deps(), user.uid, start, end);
  const days = summarizePeriod(entries, start, lastDay).reverse();
  const total = totalWorked(days);

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Meu ponto</CardTitle>
          <CardDescription>{formatMonthKey(month)}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/meu-ponto?mes=${shiftMonth(month, -1)}`}>
            ← Anterior
          </Link>
          <MonthPicker value={month} max={current} />
          {month < current && (
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/meu-ponto?mes=${shiftMonth(month, 1)}`}>
              Próximo →
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Marcações</TableHead>
              <TableHead className="text-right">Horas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map((d) => (
              <TableRow key={d.dateKey} className={d.entries.length ? "" : "text-muted-foreground"}>
                <TableCell className="whitespace-nowrap">
                  {weekdayLabel(d.dateKey)} {formatDateKey(d.dateKey)}
                </TableCell>
                <TableCell>
                  <EntriesBadges entries={d.entries} />
                  {d.open && d.dateKey !== today && (
                    <span className="text-xs text-destructive">Entrada sem saída</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatMinutes(d.workedMinutes)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total no mês</TableCell>
              <TableCell className="text-right tabular-nums">{formatMinutes(total)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
