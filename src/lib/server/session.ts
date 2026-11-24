import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../firebase/admin";
import { AppError, toAppError } from "../errors";
import { homeFor, type Role } from "../roles";
import type { Deps } from "./deps";
import { getUser, type AppUser } from "./users";

export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export function deps(): Deps {
  return { db: adminDb(), auth: adminAuth() };
}

/** Usuário da sessão atual, validando revogação e se ainda está ativo. */
export async function getSessionUser(): Promise<AppUser | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    const user = await getUser(deps(), decoded.uid);
    return user?.ativo ? user : null;
  } catch {
    return null;
  }
}

/** Para páginas: redireciona para o login ou para a área do perfil. */
export async function requirePageRole(...roles: Role[]) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles.length && !roles.includes(user.perfil)) redirect(homeFor(user.perfil));
  return user;
}

/** Para Route Handlers: lança AppError 401/403. */
export async function requireApiRole(...roles: Role[]) {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "Sessão expirada. Faça login novamente.");
  if (roles.length && !roles.includes(user.perfil)) throw new AppError(403, "Sem permissão.");
  return user;
}

export function errorResponse(err: unknown) {
  const e = toAppError(err);
  return NextResponse.json({ error: e.message }, { status: e.status });
}
