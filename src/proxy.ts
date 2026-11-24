import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { canAccessPath, homeFor, isPublicPath, isRole } from "@/lib/roles";

const SESSION_COOKIE = "__session";

/**
 * Controle de acesso por perfil antes da renderização. Usa o perfil gravado
 * nas custom claims do cookie; páginas e APIs revalidam a sessão no Firestore.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const login = NextResponse.redirect(new URL("/login", request.url));
  if (!cookie) return login;

  try {
    const decoded = await adminAuth().verifySessionCookie(cookie);
    const role = decoded.role;
    if (!isRole(role)) return login;
    if (!canAccessPath(role, pathname)) return NextResponse.redirect(new URL(homeFor(role), request.url));
    return NextResponse.next();
  } catch {
    login.cookies.delete(SESSION_COOKIE);
    return login;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
