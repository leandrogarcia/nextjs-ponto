export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorCode(err: unknown): string | undefined {
  if (typeof err === "object" && err && "code" in err) {
    const code = (err as { code: unknown }).code;
    return typeof code === "string" ? code : typeof code === "number" ? String(code) : undefined;
  }
  return undefined;
}

/** Converte erros conhecidos do Firebase em AppError. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  const code = errorCode(err);
  if (code === "auth/email-already-exists") return new AppError(409, "Já existe um usuário com esse e-mail.");
  if (code === "auth/user-not-found") return new AppError(404, "Usuário não encontrado.");
  if (code === "auth/invalid-password") return new AppError(400, "Senha inválida.");
  if (code === "auth/invalid-email") return new AppError(400, "E-mail inválido.");
  console.error(err);
  return new AppError(500, "Erro interno.");
}
