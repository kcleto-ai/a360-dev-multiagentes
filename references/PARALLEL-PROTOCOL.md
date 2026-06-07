# Protocolo de Paralelismo — Worker + Reconciler (v2)

> Regras práticas pra rodar **vários Claudes em paralelo** sem pisar uns nos outros.
> Versão canônica que o `scaffold-monorepo` instala em `specs/PARALLEL-PROTOCOL.md`
> de todo projeto novo. v2 incorpora as lições de dois projetos reais de produção
> (um SDR multi-tenant; uma plataforma de 6 milestones, 40+ slots): TERRITORY/
> DEPENDS-ON executáveis, smoke territorial, SHARED-CONTRACT por milestone e
> zoning estrutural.

## TL;DR (5 regras de ouro)

1. **Cada worker em sua própria worktree.** `git worktree` — nunca working dir
   compartilhado (`git checkout` de A sobrescreve o de B). O `ai-team start` cria.
2. **Um slot, um worker, uma branch.** Branch `worker/<milestone>/<slot-id>`.
3. **Claim antes de tocar arquivo.** `STATUS.txt=claimed:<worker>` + `OWNER.txt`,
   commitado imediatamente (o `ai-team start` faz).
4. **Só edite arquivos do seu TERRITORY.txt.** Pre-commit bloqueia; reconcile re-valida.
5. **Smoke (territorial) antes de marcar `done`.** Sem smoke verde, slot fica `claimed`.

## Anatomia do slot

`specs/slots/<milestone>/<slot-id>/`:

| Arquivo | Quem escreve | O quê |
|---|---|---|
| `BRIEF.md` | Arquiteto | o quê + critérios de aceite |
| `DESIGN-SPEC.md` | Arquiteto | schemas Zod, signatures, nomes EXATOS + contratos da fundação consumidos (com paths) |
| `CONTRACT.md` | Arquiteto | I/O formal + comando de smoke |
| `TERRITORY.txt` | Arquiteto | globs que o slot PODE tocar (zoning executável) |
| `DEPENDS-ON.txt` | Arquiteto | slots-fundação que precisam estar `done` antes |
| `STATUS.txt` | Dev | `available → claimed:<w> → done:<w>` \| `blocked:<motivo>` |
| `ARTIFACTS.md` | Dev | arquivos, smoke, pendências, candidatos à fundação, divergências |

Por milestone: `SHARED-CONTRACT.md` — nomes/rotas reservados, DTOs compartilhados,
decisões transversais. Todo Dev lê antes do BRIEF.

Cada slot é **auto-suficiente**: RESUME + SHARED-CONTRACT + a pasta do slot bastam.

## Zoning estrutural

A arquitetura do monorepo scaffoldado define a malha de territórios — slot novo
encaixa numa célula, nunca atravessa:

| Tipo de slot | Território |
|---|---|
| Backend (1 domínio) | `apps/api/src/modules/<dominio>/**` + `apps/api/test/<dominio>*.ts` |
| Front dados (fissão) | `apps/web/lib/queries/<dominio>.ts` |
| Front UI (fissão) | `apps/web/app/<grupo>/<rota>/components/**` |
| Front junção (fissão) | `apps/web/app/<grupo>/<rota>/page.tsx` + `<rota>-client.tsx` |
| Frontend inteiro (sem fissão) | `apps/web/app/<grupo>/<rota>/**` + `lib/queries/<dominio>.ts` |
| Core (1 domínio) | `packages/core/src/<dominio>/**` |
| Adapter (1 integração) | `packages/<dominio>/src/**` (exceto barrel) |
| Fundação de dados (wave 0) | `packages/db/src/**` + migrations |

**Fissão (contract-first):** contrato na wave 0 (DTO + fixtures + ViewModel) → 3 pistas
paralelas (api ∥ web-data ∥ web-ui) → junção pequena (web-screen). Os 3 lados validam o
MESMO schema Zod; a UI renderiza fixtures tipadas pelo DTO. Ver `decompose-goal` §2.5.

**Zonas neutras** (só Integrador; lista executável em `.ai-team.json → neutralZones`):
composição da api (`index/app/config/plugins/lib`), frontend central (`layout.tsx`,
`globals.css`, `components/ui|shell`, `lib/providers|api|cn`, barrel de queries),
contrato (`packages/shared/**`, schema do db), barrels `packages/*/src/index.ts`,
e raiz (`package.json`, lockfile, `tsconfig.base.json`, `.ai-team.json`, `scripts/`).

**Zona neutra conceitual:** tipos de domínio compartilhados. Dev nunca alarga DTO/tipo
compartilhado — tipo que só a tela usa é local na tela (lição os-v2/1.14).

**Regra de ouro:** se 2 slots poderiam editar o mesmo arquivo, o arquivo é zona neutra
(ou o zoning está errado — Arquiteto refaz a decomposição).

## Waves (ordem de execução)

Fundação (schema/migration, DTO novo em shared, adapter novo) = **wave 0**: merge e
aplicada (db push em dev E test DB) ANTES dos consumidores — senão o smoke deles quebra
com "relation does not exist" (lição os-v2/1.19). Expresso no `DEPENDS-ON.txt`;
`ai-team plan/start` respeitam.

## Smoke territorial (lição os-v2/1.8 + 1.18)

Typecheck global acusa erro de OUTRO slot em paralelo. Protocolo do Dev:
erro com path no seu território = seu; path fora = confirmar pré-existência
(`git stash && pnpm typecheck:all; git stash pop`), documentar no ARTIFACTS e seguir.
O smoke CRUZADO do reconcile é global e bloqueante — é ele que protege a main.

## Lifecycle

```
[available] ─ ai-team start ─→ [claimed:<w>] ─ implementa + smoke ─→ [done:<w>]
                                     │                                   │
                                     ↘ [blocked:<motivo>]          ai-team reconcile
                                        (CTO/Arquiteto resolve)          │
                              merge --no-ff + zoning check + barrels + smoke cruzado
                                                   │
                                  RECONCILE-REPORT.md → review estrutural → HTC
```

## Papéis

- **Arquiteto** — decompõe em slots disjuntos, escreve BRIEF/DESIGN-SPEC/CONTRACT/
  TERRITORY/DEPENDS-ON + SHARED-CONTRACT. Resolve ambiguidade e slots blocked.
- **Dev/Worker** — 1 slot por vez, implementa a spec literalmente, smoke territorial, done.
- **Integrador/Reconciler** — `ai-team reconcile` + review estrutural + zonas neutras.
  Único a tocar a main. Lê ARTIFACTS (pendências + candidatos à fundação).

## Reversão

Se o paralelismo der mais trabalho que ganho: pare workers, reconcilie o que tem `done`,
continue serial. **Critério "vale a pena":** ≥3 slots ativos simultâneos por ≥1h sem
conflito em zona neutra.
