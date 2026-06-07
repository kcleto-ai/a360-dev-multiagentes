---
name: orquestrar-build
description: Roda o loop de desenvolvimento multi-agente — cria worktrees por slot via ai-team CLI, despacha workers (paralelo ao vivo ou automático), monitora pelo dashboard e integra com reconcile. Use no /a360-vamos depois que os slots do milestone estão escritos e commitados.
---

# orquestrar-build

Conduz o time construindo um milestone em **git worktrees paralelas**. Pré-requisito:
os slots de M1 já existem com BRIEF + DESIGN-SPEC + CONTRACT + STATUS=available, **e estão
commitados na main** (senão o reconcile quebra com arquivo untracked).

> Motor: `pnpm --filter @a360/ai-team cli <cmd>`. Protocolo: `references/PARALLEL-PROTOCOL.md`.

## 0. Conferir prontidão
```bash
git checkout main && git status --porcelain   # limpo
pnpm --filter @a360/ai-team cli plan --milestone=M1   # lista os slots available
```
Slots não commitados → commite primeiro (`chore(specs): slots do M1`).

## Escolher modo (pergunte ao fundador — default: C)

### Modo C — Autônomo (multi-agente real) ⭐ default

O orquestrador despacha, vigia e integra sozinho. Workers são processos `claude -p`
headless rodando na conta do próprio usuário — 1 comando e o milestone se constrói:

```bash
pnpm --filter @a360/ai-team cli run --milestone=M1 --workers=4
```

Squad padrão: **4 Devs (2 front + 2 back)** além de CTO/Arquiteto — já é o default do
`.ai-team.json` (`autonomous.maxWorkers: 4`). A decomposição (decompose-goal §2.5) é quem
garante slots prontos pra ocupar as 4 vagas; o backoff reduz sozinho se o rate limit apertar.

O `run` faz em loop: despacha slots prontos (waves via DEPENDS-ON) → cada worker
headless implementa a DESIGN-SPEC na sua worktree com **permissões gerenciadas**
(Edit só dentro do TERRITORY.txt; zona neutra negada por mecanismo) → watchdog mata
e re-despacha worker morto/estagnado/timeout (máx. 2 retries) → `done` dispara o
reconcile automaticamente → `blocked` dispara **triage com Arquiteto one-shot**
(ambiguidade de spec ele corrige e re-despacha; decisão de produto ele ESCALA pra
pessoa) → dashboard live com tail dos logs. Termina quando o milestone integra,
listando escalações pendentes.

Útil saber:
- `--dry-run` mostra o plano de despacho sem spawnar nada.
- `--workers=N` — teto real é o rate limit da conta; o scheduler faz backoff sozinho.
- Ctrl+C é seguro: o estado vive no git (claims nas branches) — rodar de novo continua.
- O que NUNCA é autônomo: **HTC** e escalações de produto. `run` termina em
  "integrado, aguardando review + seu teste" — nunca em "entregue".

Depois do `run`: review estrutural (skill `review-before-merge`) → HTC.

### Modo A — Demo paralelo (vários Claudes ao vivo, despacho manual)
Pra cada slot, crie a worktree e pegue o prompt:
```bash
pnpm --filter @a360/ai-team cli start --slot=<id> --worker=<nome> --milestone=M1
```
Isso cria `.worktrees/<nome>/` (branch `worker/M1/<id>`), faz o claim e **imprime um
prompt**. Pra cada worker, abra um terminal:
```bash
cd .worktrees/<nome> && claude   # cole o prompt impresso
```
Cada Claude lê o slot, implementa a DESIGN-SPEC, roda o smoke e marca `done`. Acompanhe:
```bash
pnpm --filter @a360/ai-team cli status --milestone=M1
```
> Pra plateia: 3 terminais lado a lado, cada um um Claude construindo um pedaço em
> paralelo, + o dashboard atualizando. É o momento "uau" do demo.

### Modo B — Serial (fallback: 1 Claude trocando de chapéu)
Sem `claude` CLI disponível pra spawn, você (o orquestrador) atua como os workers,
**um slot por vez**:
1. `ai-team start --slot=<id> --worker=<nome>` (cria a worktree + claim).
2. Trabalhe **dentro da worktree**: `cd .worktrees/<nome>` e rode `pnpm install` (a
   worktree não herda o `node_modules` da main — sem isso o smoke não roda; é rápido).
   Leia o slot, implemente a DESIGN-SPEC literalmente, dentro do território. Não toque zona neutra.
3. Rode o smoke do CONTRACT. Verde → escreva `ARTIFACTS.md`, `STATUS.txt=done:<nome>`,
   commite atômico. Trava → `STATUS.txt=blocked:<motivo>`, avise o CTO.
4. Volte pra raiz (`cd` de volta) e repita pro próximo slot.

> Dica: respeite o território como se fosse outro agente — é o que mantém o reconcile limpo.

## Integrar (papel Integrador)
Quando ≥1 slot está `done`:
```bash
git checkout main
pnpm --filter @a360/ai-team cli reconcile
```
O reconciler faz merge `--no-ff`, auto-resolve conflito de STATUS.txt, sincroniza barrels
(`.ai-team.json` → syncBarrels), roda o smoke cruzado e limpa as worktrees. Falha de smoke
→ ele para e reporta; abra um slot de gap e conserte.

Depois: review estrutural (skill `review-before-merge`, Tier 1 = fidelidade à DESIGN-SPEC).

## Loop até o milestone fechar
Repita despacho → done → reconcile até `plan` não listar mais slots e `status` mostrar
0 claimed. Então rode `pnpm dev` e mostre o resultado.

## Regras
1. Slots commitados na main antes do reconcile (evita merge com untracked).
2. Território não-sobreposto. Zona neutra só o reconcile toca.
3. Smoke verde é gate pra done e pra reconcile.
4. Conflito semântico → CTO decide. Bug → slot blocked pro worker.
5. Nunca force-push na main.
