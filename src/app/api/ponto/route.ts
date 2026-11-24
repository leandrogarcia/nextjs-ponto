import { NextResponse } from "next/server";
import { recordPunch } from "@/lib/server/entries";
import { deps, errorResponse, requireApiRole } from "@/lib/server/session";

/** Marca entrada ou saída. Não aceita corpo: horário e tipo são definidos pelo servidor. */
export async function POST() {
  try {
    const user = await requireApiRole("funcionario");
    const entry = await recordPunch(deps(), user.uid);
    return NextResponse.json({ entry: { ...entry, timestamp: entry.timestamp.toISOString() } }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
