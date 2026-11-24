import { z } from "zod";
import { isDateKey, isMonthKey } from "./time";

const nome = z.string().trim().min(2, { error: "Informe o nome (mínimo 2 caracteres)." }).max(120);
const email = z.string().trim().toLowerCase().pipe(z.email({ error: "E-mail inválido." }));
const senha = z.string().min(6, { error: "A senha deve ter pelo menos 6 caracteres." }).max(128);
const perfilEditavel = z.enum(["gerencia", "funcionario"], { error: "Perfil inválido." });

export const installSchema = z.object({
  secret: z.string().min(1, { error: "Informe o segredo de instalação." }),
  nome,
  email,
  senha,
});

export const createUserSchema = z.object({ nome, email, senha, perfil: perfilEditavel });

export const updateUserSchema = z
  .object({
    nome: nome.optional(),
    email: email.optional(),
    senha: senha.optional(),
    perfil: perfilEditavel.optional(),
    ativo: z.boolean().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    error: "Nenhuma alteração informada.",
  });

export const workScheduleSchema = z.object({
  horasSemanais: z
    .number({ error: "Informe as horas semanais." })
    .min(0, { error: "As horas semanais não podem ser negativas." })
    .max(80, { error: "Máximo de 80 horas semanais." }),
});

export const sessionSchema = z.object({ idToken: z.string().min(1) });

export const dateKeySchema = z.string().refine(isDateKey, { error: "Data inválida (AAAA-MM-DD)." });
export const monthKeySchema = z.string().refine(isMonthKey, { error: "Mês inválido (AAAA-MM)." });

export const MAX_REPORT_DAYS = 366;

export const reportQuerySchema = z
  .object({ uid: z.string().min(1, { error: "Selecione o funcionário." }), inicio: dateKeySchema, fim: dateKeySchema })
  .refine((v) => v.inicio <= v.fim, { error: "A data inicial deve ser anterior à final.", path: ["fim"] })
  .refine(
    (v) => (Date.parse(v.fim) - Date.parse(v.inicio)) / 86400000 < MAX_REPORT_DAYS,
    { error: `O período máximo é de ${MAX_REPORT_DAYS} dias.`, path: ["fim"] },
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type InstallInput = z.infer<typeof installSchema>;

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Dados inválidos.";
}
