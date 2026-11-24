import { Badge } from "@/components/ui/badge";
import type { TimeEntry } from "@/lib/hours";
import { formatTime } from "@/lib/time";

export function EntriesBadges({ entries }: { entries: TimeEntry[] }) {
  if (!entries.length) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map((e) => (
        <Badge key={e.id} variant={e.tipo === "entrada" ? "secondary" : "outline"}>
          {e.tipo === "entrada" ? "Entrada" : "Saída"} {formatTime(e.timestamp)}
        </Badge>
      ))}
    </div>
  );
}
