"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { NativeSelect } from "@/components/native-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api-client";
import { ROLE_LABELS } from "@/lib/roles";
import type { AppUser } from "@/lib/server/users";

type Editing = { mode: "create" } | { mode: "edit"; user: AppUser } | null;

export function UsersManager({ users, currentUid }: { users: AppUser[]; currentUid: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [perfil, setPerfil] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!perfil || u.perfil === perfil) &&
        (!q || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    );
  }, [users, search, perfil]);

  function run(action: () => Promise<unknown>, success: string) {
    start(async () => {
      try {
        await action();
        toast.success(success);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro.");
      }
    });
  }

  function toggleActive(u: AppUser) {
    run(
      () => apiFetch(`/api/users/${u.uid}`, { method: "PATCH", json: { ativo: !u.ativo } }),
      u.ativo ? "Usuário desativado." : "Usuário reativado.",
    );
  }

  function remove(u: AppUser) {
    if (!confirm(`Excluir ${u.nome}? Esta ação não pode ser desfeita.`)) return;
    run(() => apiFetch(`/api/users/${u.uid}`, { method: "DELETE" }), "Usuário excluído.");
  }

  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar por nome ou e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
            aria-label="Buscar"
          />
          <NativeSelect value={perfil} onChange={(e) => setPerfil(e.target.value)} className="w-44" aria-label="Filtrar por perfil">
            <option value="">Todos os perfis</option>
            <option value="funcionario">Funcionários</option>
            <option value="gerencia">Gerência</option>
          </NativeSelect>
          <Button className="ml-auto" onClick={() => setEditing({ mode: "create" })}>
            Novo usuário
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.uid}>
                <TableCell className="font-medium">{u.nome}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{ROLE_LABELS[u.perfil]}</TableCell>
                <TableCell>
                  <Badge variant={u.ativo ? "secondary" : "outline"}>{u.ativo ? "Ativo" : "Inativo"}</Badge>
                </TableCell>
                <TableCell className="space-x-1 text-right">
                  <Button size="sm" variant="outline" onClick={() => setEditing({ mode: "edit", user: u })}>
                    Editar
                  </Button>
                  {u.uid !== currentUid && (
                    <>
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => toggleActive(u)}>
                        {u.ativo ? "Desativar" : "Reativar"}
                      </Button>
                      <Button size="sm" variant="destructive" disabled={pending} onClick={() => remove(u)}>
                        Excluir
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <UserDialog
        editing={editing}
        isSelf={editing?.mode === "edit" && editing.user.uid === currentUid}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </Card>
  );
}

function UserDialog({
  editing,
  isSelf,
  onClose,
  onSaved,
}: {
  editing: Editing;
  isSelf: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const user = editing?.mode === "edit" ? editing.user : null;

  function onSubmit(form: FormData) {
    setError(null);
    const data = Object.fromEntries(form) as Record<string, string>;
    start(async () => {
      try {
        if (user) {
          const changes: Record<string, string> = {};
          if (data.nome !== user.nome) changes.nome = data.nome;
          if (data.email !== user.email) changes.email = data.email;
          if (data.senha) changes.senha = data.senha;
          if (data.perfil && data.perfil !== user.perfil) changes.perfil = data.perfil;
          if (!Object.keys(changes).length) return onClose();
          await apiFetch(`/api/users/${user.uid}`, { method: "PATCH", json: changes });
          toast.success("Usuário atualizado.");
        } else {
          await apiFetch("/api/users", { method: "POST", json: data });
          toast.success("Usuário criado.");
        }
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <Dialog
      open={editing !== null}
      onOpenChange={(open) => {
        if (!open) {
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {user ? "Deixe a senha em branco para mantê-la." : "O usuário entra com este e-mail e senha."}
          </DialogDescription>
        </DialogHeader>
        <form key={user?.uid ?? "new"} action={onSubmit} className="grid gap-4">
          <FormField label="Nome" htmlFor="nome">
            <Input id="nome" name="nome" defaultValue={user?.nome} required />
          </FormField>
          <FormField label="E-mail" htmlFor="email">
            <Input id="email" name="email" type="email" defaultValue={user?.email} required />
          </FormField>
          <FormField label="Senha" htmlFor="senha">
            <Input id="senha" name="senha" type="password" minLength={6} autoComplete="new-password" required={!user} />
          </FormField>
          <FormField label="Perfil" htmlFor="perfil">
            <NativeSelect id="perfil" name="perfil" defaultValue={user?.perfil ?? "funcionario"} disabled={isSelf}>
              <option value="funcionario">Funcionário</option>
              <option value="gerencia">Gerência</option>
            </NativeSelect>
          </FormField>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
