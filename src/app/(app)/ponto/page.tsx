import { EntriesBadges } from "@/components/entries-badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { nextEntryType, summarizeDay } from "@/lib/hours";
import { listDayEntries } from "@/lib/server/entries";
import { deps, requirePageRole } from "@/lib/server/session";
import { formatDateKey, formatMinutes, formatTime, toDateKey, weekdayLabel } from "@/lib/time";
import { PunchButton } from "./punch-button";

export default async function PontoPage() {
  const user = await requirePageRole("funcionario");
  const today = toDateKey(new Date());
  const entries = await listDayEntries(deps(), user.uid, today);
  const day = summarizeDay(today, entries);
  const last = entries.at(-1);
  const next = nextEntryType(last);

  return (
    <div className="mx-auto grid max-w-md gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Olá, {user.nome.split(" ")[0]}</CardTitle>
          <CardDescription>
            {weekdayLabel(today)}, {formatDateKey(today)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm">
            {last
              ? last.tipo === "entrada"
                ? `Trabalhando desde ${formatTime(last.timestamp)}.`
                : `Última saída às ${formatTime(last.timestamp)}.`
              : "Nenhuma marcação hoje."}
          </p>
          <PunchButton next={next} dateKey={today} />
          <p className="text-xs text-muted-foreground">
            O horário é registrado pelo servidor no momento do clique e não pode ser alterado.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Marcações de hoje</CardTitle>
          <CardDescription>Total trabalhado: {formatMinutes(day.workedMinutes)}</CardDescription>
        </CardHeader>
        <CardContent>
          <EntriesBadges entries={entries} />
        </CardContent>
      </Card>
    </div>
  );
}
