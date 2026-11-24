import { AppError } from "@/lib/errors";
import { firstError, reportQuerySchema } from "@/lib/schemas";
import { getAttendanceReport } from "@/lib/server/reports";
import { deps, requireApiRole } from "@/lib/server/session";

export async function reportFromRequest(request: Request) {
  await requireApiRole("gerencia");
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = reportQuerySchema.safeParse(params);
  if (!parsed.success) throw new AppError(400, firstError(parsed.error));
  return getAttendanceReport(deps(), parsed.data.uid, parsed.data.inicio, parsed.data.fim);
}
