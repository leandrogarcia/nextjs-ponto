import { LogoutButton } from "@/components/logout-button";
import { NavLinks } from "@/components/nav-links";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { requirePageRole } from "@/lib/server/session";

const NAV: Record<Role, { href: string; label: string }[]> = {
  root: [{ href: "/root", label: "Primeiro gerente" }],
  gerencia: [
    { href: "/admin/usuarios", label: "Usuários" },
    { href: "/admin/jornadas", label: "Jornadas" },
    { href: "/admin/relatorios", label: "Relatórios" },
  ],
  funcionario: [
    { href: "/ponto", label: "Ponto" },
    { href: "/meu-ponto", label: "Meu ponto" },
  ],
};

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requirePageRole();
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="font-semibold">Ponto</span>
          <NavLinks links={NAV[user.perfil]} />
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">{user.nome}</span>
            <Badge variant="secondary">{ROLE_LABELS[user.perfil]}</Badge>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4">{children}</main>
    </div>
  );
}
