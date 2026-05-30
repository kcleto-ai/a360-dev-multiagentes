---
name: scaffold-monorepo
description: Cria a base de um projeto novo — monorepo pnpm + TypeScript estrito, embute o ai-team CLI (motor multi-agente), prepara specs/ e a pasta do design system (docs/design/raw/), grava EMPRESA.md e .ai-team.json, e garante que compila verde. Use no kickoff (/a360-dev-multiagentes), depois de definir stack e invariantes.
---

# scaffold-monorepo

Cria o esqueleto **mínimo mas real** de um produto: compila verde com `pnpm -r typecheck`
e já vem com o motor multi-agente embutido. As features de verdade são construídas depois
(`/a360-vamos`) — aqui você só monta a fundação.

> Os templates vivem em `${CLAUDE_PLUGIN_ROOT}/templates/monorepo/`. O CLI vive em
> `${CLAUDE_PLUGIN_ROOT}/cli/`. Copie de lá; não reescreva à mão.

## Entradas (vêm do comando que te chamou)

- `projectSlug` — nome/slug do projeto.
- `stack` — confirmada pelo fundador (default STACK-DEFAULT).
- `invariants` — 5-7 invariantes pro `EMPRESA.md`.
- `goalResumo` — 1-2 frases do que é o produto.

## Passos

### 1. Estrutura base (copie os templates)
```bash
ROOT="$(pwd)"   # já estamos na pasta do projeto (vazia ou quase)
cp -R "${CLAUDE_PLUGIN_ROOT}/templates/monorepo/." "$ROOT/"
```
Isso traz: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`,
`.env.example`, `.ai-team.json`, `README.md`, e os stubs de `apps/api`, `apps/web`,
`packages/shared`, `packages/core`, mais `specs/` e `docs/`.

> `cp -R src/.` (com o ponto) copia inclusive os arquivos ocultos (`.gitignore`, `.ai-team.json`).

### 2. Embuta o ai-team CLI
```bash
mkdir -p "$ROOT/tools"
cp -R "${CLAUDE_PLUGIN_ROOT}/cli" "$ROOT/tools/ai-team"
rm -rf "$ROOT/tools/ai-team/node_modules"   # garante limpo
```
O CLI detecta a raiz via `git rev-parse`, então funciona em `tools/ai-team` sem ajuste.

### 3. Personalize os arquivos do projeto
- **`EMPRESA.md`** — preencha com `goalResumo`, a stack confirmada e os `invariants`
  (use `${CLAUDE_PLUGIN_ROOT}/references/STACK-DEFAULT.md` como base dos padrões +
  segurança baseline). Não deixe placeholders `<...>`.
- **`README.md`** — título = projeto, 1 parágrafo do que é, e os comandos (`pnpm dev`,
  `pnpm -r typecheck`, e os `/a360-*`).
- **`.ai-team.json`** — ajuste `smoke` se o projeto tiver build além de typecheck.
  Default já é `["pnpm","-r","--if-present","typecheck"]`.
- **`package.json`** raiz — troque `name` pro slug.
- **`docs/SOLUTION-OVERVIEW.md`** — preencha a "Visão geral" e a "Arquitetura" com o que
  o CTO ditou (mesmo que ainda em alto nível). É a biblioteca viva — não deixe só o skeleton.
  `docs/ROADMAP.md` fica como está até o `/a360-vamos` planejar o M1.
- **Doc set de onboarding** (vem do template) — preencha `docs/01-INTRODUCAO.md` e
  `docs/02-COMO-FUNCIONA.md` com o produto (substitua os `<...>`). Os outros já vêm prontos
  e são genéricos do método: `03-COMO-USAR-O-CLAUDE.md`, `04-GLOSSARIO.md`,
  `05-TROUBLESHOOTING.md`, `README.md` (índice "pra galera") e `LEARNINGS.md` (diário, vazio).

### 4. Pasta do design system (CRÍTICO)
Garanta que existe e tem o README explicando o OpenDesign:
```
docs/design/
├── README.md     # "Exporte do OpenDesign e coloque os arquivos em raw/"
└── raw/          # <- a pessoa joga o export aqui (vem com .gitkeep)
```
(Já vem do template — só confirme que `docs/design/README.md` existe e está claro.)

### 5. Instale e prove que compila
```bash
corepack enable
pnpm install
pnpm -r typecheck
```
**Tem que passar verde.** Se algum stub não compilar, conserte o stub (não desligue o
typecheck). Os stubs não têm deps externas de propósito — `pnpm install` é rápido.

### 6. Relatório
Diga ao fundador, em 3 bullets: o que foi criado, que compila, e que falta o design system.
O commit/push é responsabilidade do comando chamador (`/a360-dev-multiagentes` passo 5).

## Garantias ao terminar

- [ ] `pnpm -r typecheck` verde.
- [ ] `tools/ai-team` presente e funcional (`pnpm --filter @a360/ai-team cli --help`).
- [ ] `docs/design/raw/` existe com README do OpenDesign.
- [ ] `docs/SOLUTION-OVERVIEW.md` preenchido (visão + arquitetura); `docs/ROADMAP.md` presente.
- [ ] Doc set presente: `README.md`, `01-INTRODUCAO`, `02-COMO-FUNCIONA`, `03-COMO-USAR-O-CLAUDE`, `04-GLOSSARIO`, `05-TROUBLESHOOTING`, `LEARNINGS.md` (01/02 preenchidos com o produto).
- [ ] `specs/slots/M1/` existe (vazio, pronto pros slots).
- [ ] `EMPRESA.md` preenchido, sem placeholders.
- [ ] `.gitignore` cobre `node_modules`, `.worktrees`, `.env*`, `dist`, `data`.
