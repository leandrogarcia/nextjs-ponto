import { NextResponse } from "next/server";
import { firstError, updateUserSchema } from "@/lib/schemas";
import { deps, errorResponse, requireApiRole } from "@/lib/server/session";
import { deleteUser, updateUser } from "@/lib/server/users";

export async function PATCH(request: Request, ctx: RouteContext<"/api/users/[uid]">) {
  try {
    const actor = await requireApiRole("gerencia");
    const { uid } = await ctx.params;
    const parsed = updateUserSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
    const user = await updateUser(deps(), actor, uid, parsed.data);
    return NextResponse.json({ user });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/users/[uid]">) {
  try {
    const actor = await requireApiRole("gerencia");
    const { uid } = await ctx.params;
    await deleteUser(deps(), actor, uid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
