# EMPRESA.md — invariantes do projeto

> Regras **não-negociáveis** deste projeto. Todo agente lê antes de trabalhar.
> O CTO preenche no kickoff. _(Substitua os `<...>` — não deixe placeholders.)_

## O que é

<1-2 frases: o que o produto faz e pra quem.>

## Invariantes (5-7, não-negociáveis)

1. **Multi-tenancy desde o dia 1** — toda entidade/query/log carrega `workspaceId` (se aplicável).
2. **Zod nas fronteiras** — todo input/output de HTTP, fila e LLM é validado por schema.
3. **Adapter pattern** pra dependências trocáveis (LLM, CRM, mensagem, pagamento) — consumidor nunca importa SDK do vendor direto.
4. **Stores como interface** — persistência atrás de interface (memory em dev, Supabase em prod).
5. **Segurança baseline** — 12 controles do STACK-DEFAULT (secrets fora do código, RLS, cookies seguros, rate limit, CORS whitelist, HTTPS only, `pnpm audit` no CI).
6. <invariante específico do produto — ex.: "respostas do agente sempre em PT-BR">
7. <invariante específico do produto>

## Stack (ditada pelo CTO, confirmada pelo fundador)

- **Linguagem/runtime:** TypeScript estrito + Node 22 + pnpm monorepo
- **Front:** Next.js 15 + Tailwind + shadcn/ui
- **Back:** Fastify + Better Auth + Zod
- **Banco:** PostgreSQL via Supabase + Drizzle ORM (RLS dia 1)
- **IA:** Anthropic Claude (`@anthropic-ai/sdk`)
- **Deploy:** Docker no VPS (via `/a360-deploy`)

Desvio da stack só com justificativa concreta (regulação, integração obrigatória, time legacy).
