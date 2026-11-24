import { EntriesBadges } from "@/components/entries-badges";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppError } from "@/lib/errors";
import { firstError, reportQuerySchema } from "@/lib/schemas";
import { getAttendanceReport, type AttendanceReport } from "@/lib/server/reports";
import { deps, requirePageRole } from "@/lib/server/session";
import { listUsers } from "@/lib/server/users";
import { formatDateKey, formatMinutes, monthRange, toMonthKey, weekdayLabel } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ReportFilters } from "./report-filters";

export default async function ReportsPage(props: PageProps<"/admin/relatorios">) {
  await requirePageRole("gerencia");
  const params = await props.searchParams;
  const employees = await listUsers(deps(), { perfil: "funcionario" });
  const { start, end } = monthRange(toMonthKey(new Date()));
  const query = {
    uid: typeof params.uid === "string" ? params.uid : "",
    inicio: typeof params.inicio === "string" ? params.inicio : start,
    fim: typeof params.fim === "string" ? params.fim : end,
  };

  let report: AttendanceReport | null = null;
  let error: string | null = null;
  if (query.uid) {
    const parsed = reportQuerySchema.safeParse(query);
    if (!parsed.success) error = firstError(parsed.error);
    else {
      try {
        report = await getAttendanceReport(deps(), parsed.data.uid, parsed.data.inicio, parsed.data.fim);
      } catch (err) {
        error = err instanceof AppError ? err.message : "Erro ao gerar o relatório.";
      }
    }
  }
  const qs = new URLSearchParams(query).toString();

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">Relatórios de frequência</h1>
      <ReportFilters employees={employees.map((e) => ({ uid: e.uid, nome: e.nome }))} initial={query} />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {report && (
        <Card>
          <CardHeader className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>{report.user.nome}</CardTitle>
              <CardDescription>
                {formatDateKey(report.inicio)} a {formatDateKey(report.fim)} · jornada de {report.horasSemanais} h semanais
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <a className="text-sm underline" href={`/api/relatorios/csv?${qs}`}>
                Exportar CSV
              </a>
              <a className="text-sm underline" href={`/api/relatorios/pdf?${qs}`}>
                Exportar PDF
              </a>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Trabalhadas" value={formatMinutes(report.totals.workedMinutes)} />
              <Stat label="Esperadas" value={formatMinutes(report.totals.expectedMinutes)} />
              <Stat
                label="Saldo"
                value={formatMinutes(report.totals.balanceMinutes, true)}
                tone={report.totals.balanceMinutes < 0 ? "neg" : "pos"}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Marcações</TableHead>
                  <TableHead className="text-right">Trabalhadas</TableHead>
                  <TableHead className="text-right">Esperadas</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.map((r) => (
                  <TableRow key={r.dateKey}>
                    <TableCell className="whitespace-nowrap">
                      {weekdayLabel(r.dateKey)} {formatDateKey(r.dateKey)}
                    </TableCell>
                    <TableCell>
                      <EntriesBadges entries={r.entries} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMinutes(r.workedMinutes)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMinutes(r.expectedMinutes)}</TableCell>
                    <TableCell className={cn("text-right tabular-nums", r.balanceMinutes < 0 && "text-destructive")}>
                      {formatMinutes(r.balanceMinutes, true)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMinutes(report.totals.workedMinutes)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMinutes(report.totals.expectedMinutes)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMinutes(report.totals.balanceMinutes, true)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-xl font-semibold tabular-nums", tone === "neg" && "text-destructive")}>{value}</div>
    </div>
  );
}
