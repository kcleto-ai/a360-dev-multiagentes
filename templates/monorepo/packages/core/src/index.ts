// Lógica de domínio do produto. O time preenche durante o M1, seguindo os padrões do
// STACK-DEFAULT (adapter pattern, stores como interface, tools registry, Zod nas fronteiras).

export const CORE_VERSION = '0.0.0' as const;

/** Marca o ponto onde os adapters/stores/tools entram (ver references/STACK-DEFAULT.md). */
export interface DomainPlaceholder {
  readonly ready: boolean;
}

export const domain: DomainPlaceholder = { ready: false };
