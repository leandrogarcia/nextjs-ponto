import { NextResponse } from "next/server";
import { firstError, installSchema } from "@/lib/schemas";
import { runInstall } from "@/lib/server/install";
import { deps, errorResponse } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const parsed = installSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
    await runInstall(deps(), parsed.data, process.env.INSTALL_SECRET);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
