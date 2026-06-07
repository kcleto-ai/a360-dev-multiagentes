---
name: scaffold-monorepo
description: Cria a base de um projeto novo — monorepo pnpm + TypeScript estrito com arquitetura REAL (Fastify modular + Next.js decomposto + packages shared/core/db/adapter), embute o ai-team CLI, prepara specs/ (slot template, SHARED-CONTRACT) e a pasta do design system, grava EMPRESA.md/.ai-team.json, ativa o hook de zoning e garante que compila e SOBE verde. Use no kickoff (/a360-dev-multiagentes), depois de definir stack, invariantes e tenancy.
---

# scaffold-monorepo

Cria o esqueleto **real e funcional** de um produto: `pnpm -r typecheck` verde E
`pnpm dev` sobe api (health-check) + web (página consumindo a api via React Query).
O time não inventa arquitetura no M1 — ela já vem de fábrica (8 ADRs decididos),
com a malha de zoning estrutural pros Devs paralelos. As features de verdade são
construídas depois (`/a360-vamos`).

> Os templates vivem em `${CLAUDE_PLUGIN_ROOT}/templates/monorepo/`. O CLI vive em
> `${CLAUDE_PLUGIN_ROOT}/cli/`. Copie de lá; não reescreva à mão.

## Entradas (vêm do comando que te chamou)

- `projectSlug` — nome/slug do projeto.
- `stack` — confirmada pelo fundador (default STACK-DEFAULT).
- `invariants` — 5-7 invariantes pro `EMPRESA.md`.
- `goalResumo` — 1-2 frases do que é o produto.
- `multiTenant` — **decisão do kickoff** (pergunta obrigatória do CTO): true/false.
- `perfilFundador` — **pergunta do kickoff** ("entende algo de programação?"):
  leigo | curioso | dev → preenche a seção "Perfil do fundador" do `EMPRESA.md`.

## O que o template traz (não recrie nada disso)

- **`apps/api`** — Fastify modular (ADR 004): `app.ts` + `config/env.ts` (Zod) +
  `plugins/` + `lib/{errors,http,guards}` (zonas neutras) + `modules/health/`
  (módulo-exemplo canônico) + smoke vitest com credenciais neutralizadas (ADR 005).
- **`apps/web`** — Next.js 15 App Router (ADR 006): rota raiz decomposta
  (`page.tsx` → `home-client.tsx` → `components/`), fundação `components/ui`
  (Button/Card/Tag + barrel), `lib/api/client.ts`, `lib/queries/health.ts`
  (React Query + query-key factory), design tokens em `globals.css`.
- **`packages/shared`** — DTOs front↔back (`dto/api.ts`, `dto/health.ts`) — zona neutra.
- **`packages/core`** — domínio puro (estrutura 1 domínio = 1 pasta).
- **`packages/db`** — Drizzle + schema-exemplo + scripts `db:push`/`db:push:test` (ADR 007).
- **`packages/email`** — adapter canônico (porta + dev + resend + factory; ADRs 002/008).
- **`docs/ADRs/001-008`** — as 8 decisões de fábrica. `docs/05-TROUBLESHOOTING.md` com
  receitas TS/React.
- **`specs/`** — PARALLEL-PROTOCOL v2, `slots/M1/_slot-template/` (BRIEF, DESIGN-SPEC,
  CONTRACT, TERRITORY, DEPENDS-ON, STATUS) e `slots/M1/SHARED-CONTRACT.md`.
- **Zoning executável** — `.ai-team.json` (v2, com `neutralZones`) + pre-commit hook
  (`.githooks/` + `scripts/check-zoning.mjs`, ativado pelo `prepare`).
- **`docker-compose.dev.yml`** — Postgres local com `app_dev` + `app_test`.

## Passos

### 1. Estrutura base (copie os templates)
```bash
ROOT="$(pwd)"   # já estamos na pasta do projeto (vazia ou quase)
cp -R "${CLAUDE_PLUGIN_ROOT}/templates/monorepo/." "$ROOT/"
```
> `cp -R src/.` (com o ponto) copia inclusive os ocultos (`.gitignore`, `.ai-team.json`,
> `.githooks/`, `.env.example`).

### 2. Embuta o ai-team CLI
```bash
mkdir -p "$ROOT/tools"
cp -R "${CLAUDE_PLUGIN_ROOT}/cli" "$ROOT/tools/ai-team"
rm -rf "$ROOT/tools/ai-team/node_modules"   # garante limpo
```
O CLI detecta a raiz via `git rev-parse`, então funciona em `tools/ai-team` sem ajuste.

### 3. Personalize os arquivos do projeto
- **`EMPRESA.md`** — preencha com `goalResumo`, a stack confirmada e os `invariants`
  (base: `${CLAUDE_PLUGIN_ROOT}/references/STACK-DEFAULT.md`). **Inclua o invariante de
  tenancy** (multi-tenant: "toda tabela/query/log carrega workspaceId" | single-tenant:
  "sistema da operação do fundador; multi-tenant depois = projeto novo"). Sem placeholders.
- **Tenancy no código** — multi-tenant? Descomente/ajuste o exemplo de `workspaceId` em
  `packages/db/src/schema.ts` e registre no `docs/ADRs/003` a decisão tomada. O slot de
  fundação do M1 cria as tabelas reais (workspace, user, membership) conforme ADR 003.
- **`README.md`** — título = projeto, 1 parágrafo do que é, e os comandos (`pnpm dev`,
  `pnpm typecheck:all`, `pnpm infra:up`, e os `/a360-*`).
- **`.ai-team.json`** — default já cobre o template (smoke, neutralZones, syncBarrels).
  Só ajuste se a stack confirmada divergir.
- **`package.json`** raiz — troque `name` pro slug.
- **`docs/SOLUTION-OVERVIEW.md`** — preencha "Visão geral" e "Arquitetura" com o que o
  CTO ditou. `docs/ROADMAP.md` fica como está até o `/a360-vamos` planejar o M1.
- **Doc set de onboarding** — preencha `docs/01-INTRODUCAO.md` e `docs/02-COMO-FUNCIONA.md`
  com o produto. Os outros são genéricos do método e já vêm prontos.

### 4. Pasta do design system (CRÍTICO)
Garanta que existe e tem o README explicando o OpenDesign:
```
docs/design/
├── README.md     # "Exporte do OpenDesign e coloque os arquivos em raw/"
└── raw/          # <- a pessoa joga o export aqui (vem com .gitkeep)
```

### 5. Instale e prove que compila E sobe
```bash
corepack enable
pnpm install          # roda o prepare → ativa o hook de zoning (.githooks)
pnpm typecheck:all    # TEM que passar verde
pnpm --filter @app/api test   # smoke do health (vitest, sem rede)
```
Depois prove que SOBE (rápido, mata em seguida):
```bash
pnpm dev &  sleep 12
curl -fsS http://localhost:3001/api/health   # {"ok":true,...}
kill %1
```
Se algo não compilar/subir, conserte (não desligue typecheck nem pule o curl).

### 6. Relatório
Diga ao fundador, em 3-4 bullets: o que foi criado, que compila e sobe (health ✓),
a decisão de tenancy registrada, e que falta o design system (`docs/design/raw/`).
O commit/push é responsabilidade do comando chamador (`/a360-dev-multiagentes` passo 5).

## Garantias ao terminar

- [ ] `pnpm typecheck:all` verde + smoke do health verde.
- [ ] `pnpm dev` sobe api+web; `curl localhost:3001/api/health` responde ok.
- [ ] Hook de zoning ativo (`git config core.hooksPath` → `.githooks`).
- [ ] `tools/ai-team` presente e funcional (`pnpm ai-team --help` ou `pnpm --filter @a360/ai-team cli --help`).
- [ ] `docs/design/raw/` existe com README do OpenDesign.
- [ ] `docs/ADRs/001-008` presentes; decisão de tenancy registrada (EMPRESA.md + ADR 003).
- [ ] `docs/SOLUTION-OVERVIEW.md` preenchido; doc set completo; `LEARNINGS.md` (diário, vazio).
- [ ] `specs/slots/M1/` com `_slot-template/` + `SHARED-CONTRACT.md` prontos.
- [ ] `EMPRESA.md` preenchido, sem placeholders.
- [ ] `.gitignore` cobre `node_modules`, `.worktrees`, `.env*`, `dist`, `.next`, `data`.
