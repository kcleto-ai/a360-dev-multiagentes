# AUTONOMOUS-MODE — o modo multi-agente real (`ai-team run`)

> Design e operação do modo autônomo. Antes dele, o ai-team era um protocolo de
> coordenação com despacho manual (humano abria terminal e colava prompt). O `run`
> fecha o gap: spawn, scheduling, supervisão e triage viram mecanismo. Roda 100% na
> conta Claude do próprio usuário (`claude -p` headless) — sem API key, sem servidor.

## Arquitetura

```
ai-team run --milestone=M1 --workers=2
     │
     ├─ SCHEDULER ─ slots prontos (DEPENDS-ON ok, waves) ──→ até N workers em paralelo
     │                       │
     │                 spawnWorker(): worktree + claim + pnpm install
     │                 + permissões geradas (TERRITORY → settings) + claude -p detached
     │                       │            logs em .ai-team/logs/<worker>.log
     │                       ▼
     ├─ WATCHDOG ─ pid vivo? branch commitando? log mexendo? idade?
     │     ├─ morto/estagnado/timeout → reap + re-despacho (máx maxRetries) → escalação
     │     └─ morte precoce repetida (≈rate limit) → backoff exponencial + 1 worker
     │
     ├─ done na branch ──→ ai-team reconcile (merge + zoning + barrels + smoke cruzado)
     │                       └─ smoke quebrou → PARA (slot de gap é trabalho humano/Arquiteto)
     │
     ├─ blocked na branch ──→ TRIAGE: Arquiteto one-shot (claude -p síncrono na main)
     │     ├─ ambiguidade de SPEC → ele corrige DESIGN-SPEC/shared, commita → re-despacho
     │     └─ decisão de PRODUTO → ESCALAR (branch preservada pro humano inspecionar)
     │
     └─ término: 0 ready + 0 claimed + 0 ativos → resumo + escalações +
        "review estrutural → HTC" (NUNCA declara entregue)
```

## O contrato do worker headless

Sem humano, o canal de saída do worker é o **estado do slot commitado na branch**:
`done:<w>` ou `blocked:<motivo>`. Processo que termina sem nenhum dos dois = falha
(watchdog reapa e re-despacha). Prompt: `cli/src/prompts/worker-headless.md`.

## Permissões (a inversão importante)

Segurança sai do prompt e vira mecanismo — `TERRITORY.txt` + `neutralZones` são
traduzidos em `--settings` do claude (gerador: `cli/src/core/permissions.ts`):

- **allow**: Edit/Write só nos globs do território + pasta do próprio slot; Bash
  mínimo do protocolo (pnpm install/test/typecheck, git add/commit/diff/stash).
- **deny** (vence allow): Edit/Write em toda zona neutra; `git push/checkout/merge/
  rebase/reset/worktree`; `rm -rf`; rede (WebFetch/WebSearch/curl/wget) salvo
  `allowNetwork: true`.

Defesa em 3 camadas: permissões do harness → pre-commit de zoning → validação do
reconcile (RECONCILE-REPORT.md). `git commit --no-verify` escapa da 2ª, nunca da 3ª.

## Configuração (`.ai-team.json → autonomous`)

| Campo | Default | Significado |
|---|---|---|
| `maxWorkers` | 4 | squad padrão: 2 front + 2 back; teto real = rate limit da conta (backoff automático) |
| `model` | null | null herda o default da conta; ou "sonnet"/"haiku"… |
| `command` | "claude" | binário do worker (trocável pra teste/CI) |
| `maxTurns` | 80 | anti-loop por worker |
| `slotTimeoutMin` | 45 | estourou = slot mal decomposto (sinal pro Arquiteto) |
| `stallTimeoutMin` | 20 | sem commit/log novo → kill + retry |
| `maxRetries` | 2 | re-despachos antes de escalar |
| `allowNetwork` | false | rede pros workers |
| `triage` | true | Arquiteto one-shot em blocked |

## Estado de runtime

`.ai-team/` (gitignored): `run/<worker>.json` (meta: pid, slot, branch, startedAt),
`run/<worker>.settings.json`, `run/_retries.json`, `run/_triages.json`,
`run/_escalated.json`, `logs/<worker>.log` (stream-json do claude).

**Crash-safety:** o estado de verdade mora no git (claim/done/blocked nas branches);
`.ai-team/` é só runtime. Ctrl+C, queda de energia, laptop dormindo — rodar
`ai-team run` de novo reconcilia pids mortos com as branches e continua.

## O que permanece humano (por design)

1. **HTC** — o `run` termina em "integrado, aguardando seu teste".
2. **Escalações** — blocked de produto/escopo, slot que falhou `maxRetries` vezes,
   smoke cruzado quebrado.
3. **Review estrutural** — zoning 🚨 no report não para o trem, mas o milestone não
   fecha sem o Integrador revisar.
4. **O start do `run`** — 1 decisão por milestone (quantos workers, qual milestone).

## Operação

```bash
ai-team run --dry-run                 # plano de despacho, sem spawnar
ai-team run --milestone=M1            # o loop completo, dashboard live
ai-team run --workers=3 --plain      # CI/log: eventos em linha, sem re-render
ai-team start --slot=X --worker=w --spawn   # 1 worker headless avulso
tail -f .ai-team/logs/<worker>.log    # acompanhar um worker de perto
```

## Limites conhecidos

- Rate limit da conta é o teto do paralelismo — não o custo.
- `--no-verify` no commit do worker escapa do pre-commit (camada 3 pega).
- Flags do `claude` CLI evoluem; `command` configurável + Modo A/B do
  `orquestrar-build` continuam como fallback universal.
- Triage roda síncrona (bloqueia o loop ~minutos) — de propósito: o Arquiteto
  commita na main e reconcile concorrente seria race.
