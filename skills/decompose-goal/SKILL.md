---
name: decompose-goal
description: Quebra um goal/milestone em slots de trabalho com território não-sobreposto (TERRITORY.txt) e dependências explícitas (DEPENDS-ON.txt), prontos pro Arquiteto detalhar com DESIGN-SPEC. Usada pelo CTO+Arquiteto no início do /a360-vamos, depois de ler o design system. Garante zoning disjunto e ordem fundação→consumidores (waves).
---

# decompose-goal

Transforma "o que o produto precisa fazer" em **slots executáveis em paralelo**. Duas regras
fazem tudo funcionar: **territórios disjuntos** (dois slots nunca tocam o mesmo arquivo) e
**fundação antes dos consumidores** (waves — lição do projeto-origem: 4 slots travaram porque a
migration não tinha sido aplicada antes deles começarem).

## 1. Definir o milestone + escrever `docs/ROADMAP.md` (CTO)

Pegue o goal + o `docs/design/DESIGN-OVERVIEW.md`. Defina o **M1 = caminho feliz vendável
mínimo**. Corte o resto pro M2. Não over-decomponha: produto pequeno = poucos slots.

**Escreva `docs/ROADMAP.md`** (não pule — vale mesmo solo):
```markdown
# ROADMAP — <produto>

## M1 — <nome>  (status: em andamento)
**Objetivo:** <o caminho feliz que o M1 entrega>
**Critérios de sucesso (HTC):** <lista observável — o que o usuário consegue fazer ao final>

| Slot | Wave | Depende de | Território (resumo) |
|---|---|---|---|
| `db-fundacao` | 0 | — | packages/db |
| `api-<dominio>` | 1 | db-fundacao | modules/<dominio> |
| `web-<rota>` | 1 | db-fundacao | app/<rota> + queries/<dominio> |

**Dívida consciente:** <atalhos intencionais deste M + quando pagar ("refatorar quando tocado no M2")>

## M2+ (esboço)
- <persistência real, auth completa, etc.>
```
Commit junto com os slots. O ROADMAP é a fonte da verdade do escopo do milestone.

## 2. Fatiar pela malha estrutural (Arquiteto)

A fonte da fatia é o **mapa de domínios do DESIGN-OVERVIEW** (produzido pela
`ler-design-system` e confirmado pelo fundador): fluxo → domínios → contratos → slots.
A arquitetura do monorepo JÁ define as células de zoning — slot novo encaixa numa delas
(ver `specs/PARALLEL-PROTOCOL.md` §3):

| Tipo de slot | Território | Exemplos |
|---|---|---|
| Backend (1 domínio) | `apps/api/src/modules/<dominio>/**` + `apps/api/test/<dominio>*.ts` | módulo clients, módulo billing |
| Front dados (1 domínio) | `apps/web/lib/queries/<dominio>.ts` | hooks React Query de clients |
| Front UI (1 rota) | `apps/web/app/<grupo>/<rota>/components/**` | componentes presentacionais da tela |
| Front junção (1 rota) | `apps/web/app/<grupo>/<rota>/page.tsx` + `<rota>-client.tsx` | liga hooks ↔ componentes |
| Frontend inteiro (1 rota, sem fissão) | `apps/web/app/<grupo>/<rota>/**` + `lib/queries/<dominio>.ts` | tela CRUD simples |
| Fundação de dados (wave 0) | `packages/db/src/**` + migrations | tabelas do M1 |
| Core (1 domínio) | `packages/core/src/<dominio>/**` | regras de scoring, tools |
| Adapter (1 integração) | `packages/<dominio>/src/**` (barrel é neutro) | adapter Z-API, adapter Anthropic |

**Cheque sobreposição:** liste os territórios e confirme que nenhum glob colide. Se dois
slots precisam do mesmo arquivo: (a) junte num slot só, ou (b) extraia a parte compartilhada
pra um slot wave 0 que os outros declaram no DEPENDS-ON. Se o arquivo é central
(barrel/app.ts/layout/shared) — é zona neutra: a pendência vai pro ARTIFACTS e o
Integrador resolve no reconcile.

## 2.5 FISSÃO de feature (contract-first) — o padrão de velocidade máxima

O que cria espera entre devs não é código, é **decisão pendente** ("qual o shape?", "como
chama o campo?", "quais props?"). Se o contrato toma TODAS as decisões antes (wave 0), o
resto é execução pura — e execução pura paraleliza. Uma feature média vira 4 slots:

```
WAVE 0 — CONTRATO (você, Arquiteto, na main — NÃO é slot):
  packages/shared/src/dto/<dominio>.ts       schemas Zod (request/response/erros)
  packages/shared/src/fixtures/<dominio>.ts  dados canônicos TIPADOS pelo schema
  SHARED-CONTRACT: rotas + error codes + ViewModel/props por componente + 4 estados

WAVE 1 — três pistas paralelas (DEPENDS-ON: fundação de dados, se houver):
  api-<dominio>       modules/<dominio>/ — smoke valida output contra o schema
  web-data-<dominio>  lib/queries/<dominio>.ts — hooks validam com o MESMO schema;
                      fixture-fallback em dev (só com NEXT_PUBLIC_USE_FIXTURES=1)
  web-ui-<rota>       app/<rota>/components/ — presentacionais PUROS, props = ViewModel,
                      renderizando as fixtures (não esperam API nem hooks)

WAVE 2 — JUNÇÃO (slot pequeno; DEPENDS-ON: web-data + web-ui):
  web-screen-<rota>   page.tsx + <rota>-client.tsx — liga hooks ↔ componentes + mapper
                      DTO→ViewModel. Se este slot ficar GRANDE, a fissão falhou — refaça.
```

**Por que ninguém espera ninguém:** os 3 lados validam contra o MESMO objeto Zod — drift
quebra em typecheck/smoke, não na integração. A UI renderiza fixtures tipadas pelo DTO;
quando o dado real chega, encaixa por construção. E a junção da feature 1 roda em paralelo
com a wave 1 da feature 2 — o pipeline não seca.

**Quando (não) fissionar:**

| Situação | Decomposição |
|---|---|
| Tela CRUD simples, 1 consumidor | Slot único (fissão = overhead) |
| Feature média (tela rica + API própria) | **Fissão completa (4 slots)** |
| Domínio consumido por 2+ telas | Fissão; `web-data` vira fundação das telas |
| Tela pura de UI (sem dados novos) | `web-ui` + junção, sem pista de dados |

Heurística honesta: **fissione quando a spec do slot único passaria de ~1 página.** Spec
gorda = slot gordo = paralelismo perdido + worker headless com mais espaço pra errar.

**Dimensione pra SQUAD PADRÃO: 4 Devs (2 front + 2 back) além de CTO/Arquiteto.** Toda
wave deve, sempre que o produto permitir, oferecer ≥2 slots de front (`web-data`,
`web-ui` de rotas diferentes...) e ≥2 de back (`api-<dominio>`, fundação, core, adapter)
prontos simultaneamente — senão a squad fica ociosa e o `maxWorkers: 4` vira número de
enfeite. O scheduler só paraleliza o que a SUA decomposição tornou paralelo: squad
subocupada é sintoma de decomposição grossa, não de falta de worker. (Wave 0 de contrato
é a exceção natural: 1-2 slots de fundação enquanto você escreve os contratos da
próxima feature.)

⚠️ **Anti-pitfall (PITFALLS-LLM §3):** fixture-fallback é ferramenta de DEV — a
trava dupla (`NODE_ENV=development` + flag explícita) já vem no template
(`lib/api/fixtures.ts`). Nunca afrouxe; mock vazando pra produção é incidente clássico.

## 3. Escrever o SHARED-CONTRACT do milestone (Arquiteto)

`specs/slots/<M>/SHARED-CONTRACT.md` (template já existe no scaffold): rotas/nomes
reservados por slot, DTOs compartilhados (que VOCÊ cria em `packages/shared/src/dto/`
ANTES dos Devs começarem — shared é zona neutra), contratos da fundação com assinaturas.
Decisão transversal fora do SHARED-CONTRACT = conflito semântico no reconcile.

## 4. Criar a estrutura de cada slot

Pra cada slot, em `specs/slots/M1/<slot-id>/` (copie de `specs/slots/M1/_slot-template/`):
```
BRIEF.md        # o quê + por quê + critérios de aceite
TERRITORY.txt   # globs que o slot PODE tocar (1/linha) — pre-commit e reconcile validam
DEPENDS-ON.txt  # slots wave anterior (vazio = paralelo desde já)
STATUS.txt      # available
```
O **DESIGN-SPEC.md** e o **CONTRACT.md** vêm em seguida pela skill `write-design-spec`
(o Arquiteto não despacha slot sem DESIGN-SPEC).

## 5. Ordenar (waves)

- **Wave 0 — fundação:** schema/migrations (`packages/db`), DTOs novos em shared,
  adapter novo. Mergeia + `db:push` (dev E test) ANTES de qualquer consumidor.
- **Wave 1+ — consumidores:** declaram a fundação no `DEPENDS-ON.txt`. O `ai-team plan`
  só os lista como prontos quando a fundação está `done`; `ai-team start` recusa antes.
- A maioria dos slots da mesma wave roda em paralelo.

## 6. Commitar na main

```bash
git add specs/slots/M1 docs/ROADMAP.md packages/shared && git commit -m "chore(specs): slots do M1"
```
**Crítico:** slots commitados antes de qualquer `ai-team start`/`reconcile` (senão o merge
quebra com arquivo untracked).

## Saída

- N slots em `specs/slots/M1/` com BRIEF + TERRITORY + DEPENDS-ON + STATUS=available,
  territórios disjuntos, waves definidas, SHARED-CONTRACT escrito, DTOs de shared criados,
  tudo commitado. Pronto pro `write-design-spec` em cada um, depois `orquestrar-build`.
