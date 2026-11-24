import { NextResponse } from "next/server";
import { createUserSchema, firstError } from "@/lib/schemas";
import { deps, errorResponse, requireApiRole } from "@/lib/server/session";
import { createUser, listUsers } from "@/lib/server/users";

export async function GET() {
  try {
    await requireApiRole("gerencia");
    const users = (await listUsers(deps())).filter((u) => u.perfil !== "root");
    return NextResponse.json({ users });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireApiRole("gerencia", "root");
    const parsed = createUserSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
    const user = await createUser(deps(), actor, parsed.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
