// Tipos compartilhados front + back. O time preenche durante o M1.

/** Branded IDs — evita misturar identificadores de entidades diferentes. */
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type WorkspaceId = Brand<string, 'WorkspaceId'>;
export type UserId = Brand<string, 'UserId'>;

/** Resultado padrão de operações que podem falhar sem exceção. */
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
