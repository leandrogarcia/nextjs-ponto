import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { punchSchema } from "@/lib/schemas";
import { recordPunch } from "@/lib/server/entries";
import { deps, errorResponse, requireApiRole } from "@/lib/server/session";

/**
 * Marca entrada ou saída com o horário do servidor. O corpo opcional traz só o
 * que a tela exibia (dia e próxima ação), usado como pré-condição.
 */
export async function POST(request: Request) {
  try {
    const user = await requireApiRole("funcionario");
    const body = await request.json().catch(() => undefined);
    const parsed = body === undefined ? undefined : punchSchema.safeParse(body);
    if (parsed && !parsed.success) throw new AppError(400, "Dados inválidos.");
    const entry = await recordPunch(deps(), user.uid, new Date(), parsed?.data);
    return NextResponse.json({ entry: { ...entry, timestamp: entry.timestamp.toISOString() } }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
