import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { AppError } from "@/lib/errors";
import { homeFor } from "@/lib/roles";
import { sessionSchema } from "@/lib/schemas";
import { getUser } from "@/lib/server/users";
import { deps, errorResponse, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/server/session";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/** Troca o ID token do Firebase Auth por um cookie de sessão httpOnly. */
/** Bloqueia formulários de outros sites (login CSRF): exige JSON e Origin do próprio host. */
function assertSameOrigin(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new AppError(415, "Formato inválido.");
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && new URL(origin).host !== host) throw new AppError(403, "Origem não permitida.");
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const parsed = sessionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new AppError(400, "Token ausente.");
    const decoded = await adminAuth()
      .verifyIdToken(parsed.data.idToken, true)
      .catch(() => {
        throw new AppError(401, "Token inválido.");
      });
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) throw new AppError(401, "Login expirado, tente novamente.");

    const user = await getUser(deps(), decoded.uid);
    if (!user) throw new AppError(403, "Usuário não cadastrado no sistema.");
    if (!user.ativo) throw new AppError(403, "Usuário desativado.");

    const session = await adminAuth().createSessionCookie(parsed.data.idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });
    const res = NextResponse.json({ home: homeFor(user.perfil) });
    res.cookies.set(SESSION_COOKIE, session, { ...cookieOptions, maxAge: SESSION_MAX_AGE_SECONDS });
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
