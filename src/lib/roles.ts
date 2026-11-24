export const ROLES = ["root", "gerencia", "funcionario"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  root: "Root",
  gerencia: "Gerência",
  funcionario: "Funcionário",
};

export const ROLE_HOME: Record<Role, string> = {
  root: "/root",
  gerencia: "/admin/usuarios",
  funcionario: "/ponto",
};

export const PUBLIC_PATHS = ["/login", "/install"];

const PROTECTED_PREFIXES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/root", roles: ["root"] },
  { prefix: "/admin", roles: ["gerencia"] },
  { prefix: "/ponto", roles: ["funcionario"] },
  { prefix: "/meu-ponto", roles: ["funcionario"] },
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => matchesPrefix(pathname, p));
}

export function canAccessPath(role: Role, pathname: string) {
  if (isPublicPath(pathname)) return true;
  const rule = PROTECTED_PREFIXES.find((r) => matchesPrefix(pathname, r.prefix));
  return rule ? rule.roles.includes(role) : true;
}

export function homeFor(role: Role) {
  return ROLE_HOME[role];
}

/** Perfis que um ator pode atribuir ao criar ou editar usuários. */
export function assignableRoles(actor: Role, hasManager: boolean): Role[] {
  if (actor === "gerencia") return ["funcionario", "gerencia"];
  if (actor === "root" && !hasManager) return ["gerencia"];
  return [];
}
