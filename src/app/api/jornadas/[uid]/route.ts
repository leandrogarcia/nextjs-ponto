import { NextResponse } from "next/server";
import { firstError, workScheduleSchema } from "@/lib/schemas";
import { setSchedule } from "@/lib/server/schedules";
import { deps, errorResponse, requireApiRole } from "@/lib/server/session";

export async function PUT(request: Request, ctx: RouteContext<"/api/jornadas/[uid]">) {
  try {
    const actor = await requireApiRole("gerencia");
    const { uid } = await ctx.params;
    const parsed = workScheduleSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
    const schedule = await setSchedule(deps(), actor, uid, parsed.data.horasSemanais);
    return NextResponse.json({ schedule });
  } catch (err) {
    return errorResponse(err);
  }
}
