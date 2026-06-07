# Metodologia — time de IA multi-agente (alvo: Claude Code local)

Como um time de IA constrói software de verdade: papéis claros, território exclusivo,
biblioteca compartilhada, e cada entrega validada antes de virar mainline. Destilada de
dois projetos reais de produção: um SDR multi-tenant com painel entregue em ~4 semanas e
uma plataforma de 6 milestones / 40+ slots, ambos construídos com vários Claudes em
paralelo usando **git worktrees + slots + zoning rígido**.

## Os 4 pilares

1. **Filosofia (`EMPRESA.md`)** — 5-7 invariantes não-negociáveis. Todo agente lê antes de trabalhar.
2. **Biblioteca (`docs/`)** — system design (`docs/design/raw/` do OpenDesign), ADRs, referências
   externas (`docs/_references/`). Fonte da verdade local — zero alucinação.
3. **Organograma + zoning** — CTO (o quê) · Arquiteto (o como) · Dev (executa) · Integrador
   (qualidade). Cada papel com território exclusivo e não-sobreposto.
4. **Anatomia do slot** — BRIEF (o quê + critérios + território) + DESIGN-SPEC (schemas/nomes
   exatos) + CONTRACT (I/O + smoke) + ARTIFACTS (no fim: arquivos, smoke, pendências).

## Os 4 papéis (1 time = 1 repo)

| Papel | Qtd | O que faz |
|---|---|---|
| **CTO** | 1 | Fala com o fundador. Dita a stack. Define milestones. Não toca código. |
| **Arquiteto** | 1 | Escreve BRIEF + DESIGN-SPEC por slot. Guardião do STACK-DEFAULT + ADRs. |
| **Dev** | **4 (squad padrão: 2 front + 2 back)** | Pega 1 slot, implementa a spec literalmente na sua worktree, smoke, done. |
| **Integrador** | 1 | `reconcile` (merge na main) + review estrutural. Único a tocar a main/zonas neutras. |

Escala: squad padrão = **4 Devs (2 front + 2 back)**, sustentada pela fissão de feature
(contract-first — `decompose-goal` §2.5): cada feature média vira `api` ∥ `web-data` ∥
`web-ui` + junção. Projeto muito pequeno pode rodar com menos; o gargalo desejável é o
Arquiteto escrevendo contratos, nunca Dev ocioso por decomposição grossa.
CTO/Arquiteto/Integrador continuam 1 cada.

## Os fluxos canônicos

1. **Kickoff + Scaffold** (`/a360-dev-multiagentes`) — CTO entende o goal, dita stack +
   invariantes (`EMPRESA.md`), scaffolda o monorepo, conecta GitHub, prepara `docs/design/raw/`.
2. **Especificar** (Arquiteto) — quebra o milestone em slots disjuntos com BRIEF + DESIGN-SPEC
   + CONTRACT. Commita na main.
3. **Executar em paralelo** (`/a360-vamos` → Devs) — `ai-team start` cria worktree por slot;
   cada Dev implementa, roda smoke, marca `done`.
4. **Integrar** (Integrador) — `ai-team reconcile` faz merge `--no-ff` + smoke cruzado; review
   estrutural (Tier 1 = fidelidade à spec). Critical → slot `blocked`.
   **HTC: a pessoa testa e aprova** (gate obrigatório). Aprovado → atualizar `docs/`.
5. **Deploy** (`/a360-deploy`) — Docker local → VPS com Caddy/HTTPS.

## Ciclo de aprendizado (a estrutura NUNCA rompe)

Todo erro corrigido vira aprendizado — senão o mesmo erro volta no próximo slot/projeto. É
um pilar do método, não um extra. **Gatilhos:** smoke falhou · slot `blocked` resolvido ·
HTC reprovado · bug · conflito de reconcile. **Ação:** registrar em `docs/LEARNINGS.md`
(causa raiz, correção, regra pra não repetir) e, se for geral, **promover a regra
executável** (invariante no `EMPRESA.md`, item no CONTRACT/DESIGN-SPEC, receita no
`05-TROUBLESHOOTING.md`). Skill `registrar-aprendizado`. "Erro corrigido sem aprendizado
registrado é meio-trabalho."

## Por que funciona

- **Arquitetura de fábrica** (v2, lições do projeto-origem): o monorepo nasce com a malha
  de territórios pronta (1 módulo/rota/domínio = 1 slot) e 8 ADRs decididos — o time não
  re-inventa arquitetura no M1 nem paga 7 refactors no M3.
- **Zoning executável** elimina conflito de merge — TERRITORY.txt por slot + neutralZones
  no `.ai-team.json`, validados por pre-commit e pelo reconcile (RECONCILE-REPORT.md).
- **DESIGN-SPEC** elimina conflito semântico — nomes/schemas exatos + contratos da fundação
  com path/assinatura + SHARED-CONTRACT por milestone.
- **Waves (DEPENDS-ON)** eliminam o falso-blocked — fundação (schema/DTO/adapter) mergeia
  antes dos consumidores; `ai-team plan/start` respeitam.
- **Worktrees** dão isolamento real — `git checkout` de um não quebra o outro.
- **Smoke como gate** (territorial pro Dev, cruzado e bloqueante no reconcile) + **review
  estrutural** garantem que nada quebrado vira mainline.

## Antipadrões

- Dev sem DESIGN-SPEC inventa contrato → conflito no merge. (Arquiteto sempre escreve antes.)
- Slot tocando zona neutra → reconciler retrabalha. (Zona neutra só do Integrador.)
- Marcar `done` sem smoke → descoberto no reconcile, slot reaberto.
- Slots não commitados na main antes do reconcile → merge quebra com arquivo untracked.
- CTO perguntando escolha técnica ao fundador → ele não sabe; o CTO dita (STACK-DEFAULT).
- Fechar milestone sem HTC aprovado → "pronto" sem dono ter testado. HTC é gate, não etapa opcional.
- Consertar bug/slot e seguir sem registrar em `LEARNINGS.md` → o erro volta. O ciclo de aprendizado não pode romper.
