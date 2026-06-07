---
name: review-before-merge
description: Review estrutural que o Integrador roda depois do reconcile, antes de declarar um milestone pronto. 7 tiers, sendo o Tier 1 a fidelidade à DESIGN-SPEC. Pega o que o smoke não pega (segurança, race, semântica). Critical/Blocker reabre o slot blocked pro Dev.
---

# review-before-merge

Smoke prova que **compila**. Review prova que **está certo**. O Integrador roda isto depois
do `ai-team reconcile` (branches `done` já mergeadas na main), antes de dizer "milestone pronto".

Produza um comentário/nota `REVIEW` com achados por tier. Severidade: **Critical/Blocker**
(reabre slot `blocked:<motivo>` pro Dev correto, milestone NÃO fecha) · **Nit** (anota, não bloqueia).

## Os 7 tiers (ordem de prioridade)

1. **Fidelidade à DESIGN-SPEC** ⭐ — o código bate com a spec? Nomes (`searchLeads` é
   `searchLeads`?), schemas Zod, signatures, props. Divergência = Critical. Este é o tier
   que justifica todo o método: Devs paralelos só integram limpo se cada um seguiu a spec.
2. **Padrões de arquitetura** (STACK-DEFAULT) — adapter pattern (nenhum SDK de vendor
   importado direto), stores como interface, Zod nas fronteiras. Violação = Critical.
3. **Segurança baseline** — secrets fora do código, input validado, sem SQL/prompt injection,
   rate limit/CORS onde aplicável, RLS. Falha = Critical.
4. **Invariantes do `EMPRESA.md`** — releia e confronte com o diff. Multi-tenancy
   (`workspaceId` propagado?), e os invariantes específicos do produto.
5. **Correção & edge cases** — null/empty/erro tratados? Race entre operações concorrentes?
   Erros tipados, não engolidos.
6. **Integração cruzada** — o que um slot produz, o outro consome com o mesmo shape?
   (FE espera `Res` do BE; tool registrada no barrel pelo reconciler.)
7. **Nits** — nome de variável, comentário, formatação. Anota, nunca bloqueia.

## Passo extra obrigatório: zoning + candidatos à fundação

1. **Zoning:** abra `specs/RECONCILE-REPORT.md` (gerado pelo `ai-team reconcile`). Slot com
   🚨 (zona neutra tocada / fora do território) → avalie: mudança legítima que pertence a
   você (Integrador refaz no lugar certo) ou invasão (reverta + reabra o slot). Slot sem
   TERRITORY.txt → cobre o Arquiteto.
2. **Caça duplicação (lição do projeto-origem):** leia a seção "Candidatos à fundação" do
   ARTIFACTS.md de cada slot e compare os componentes/hooks locais entre os slots do
   milestone (`grep -r "export function" apps/web/app/*/components/`). Dois slots criaram
   coisas parecidas (StatusPill vs SaudeBar)? Unifique: promova UMA versão pra
   `components/ui` (zona neutra — você pode), atualize o barrel e refatore os usos.
   Promover é decisão sua; duplicação silenciosa atravessando milestones é dívida que
   ninguém mapeou.
3. **Pendências dos ARTIFACTS:** execute as integrações pedidas (registrar módulo no
   `app.ts`, export no barrel, env var no trio env.ts/.env.example/vitest.config.ts).

## Procedimento
```bash
git checkout main
git log --oneline -15            # veja os merges do milestone
git diff <antes-do-M1>..main     # o diff total integrado
cat specs/RECONCILE-REPORT.md    # zoning + smoke + barrels do reconcile
pnpm -r typecheck && pnpm -r --if-present build && pnpm -r --if-present test
```
Pra cada slot mergeado, abra a DESIGN-SPEC e compare com o código entregue (Tier 1) e
leia o ARTIFACTS.md (pendências, candidatos à fundação, divergências declaradas).

## Veredito
- **Critical/Blocker encontrado** → pra cada um, reabra o slot: `STATUS.txt =
  blocked:<motivo curto>` na branch/worktree do Dev (ou recrie a worktree), documente o
  achado, re-despache. Milestone fica aberto.
- **Só Nits** → review ✅. **Mas o milestone ainda NÃO está pronto** — falta o HTC.

## HTC — Human Test Checkpoint (gate obrigatório após o review)
Review verde ≠ milestone entregue. O review prova que o *time* acha que terminou; o **HTC**
é o dono confirmando. Depois do review passar:
1. Suba o app (`pnpm dev`) e monte um **checklist de teste concreto** a partir dos
   **critérios de sucesso do `docs/ROADMAP.md`** — no nível do **Perfil do fundador**
   (`EMPRESA.md`): leigo/curioso = o que clicar e o resultado esperado, em linguagem
   da pessoa; dev = pode incluir curl/console/queries além dos cliques.
2. Apresente e **espere a aprovação** (use `AskUserQuestion`).
   - **Aprovado** → milestone pronto. Atualize a biblioteca viva (`docs/SOLUTION-OVERVIEW.md`,
     `docs/ROADMAP.md` marcando M1 ✅, ADRs) antes de seguir.
   - **Reprovado** → crie slots `fix-<n>` com o que falhou e volte ao ciclo. Não feche.

Nunca declare "entregue" sem HTC aprovado. É o portão entre review e mainline real.

## Regra de ouro
Conflito **semântico** (dois slots assumiram contratos diferentes) não é seu pra resolver
no chute → devolva ao CTO/Arquiteto. Você integra e valida; não redesenha.
