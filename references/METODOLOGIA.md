# Metodologia — time de IA multi-agente (alvo: Claude Code local)

Como um time de IA constrói software de verdade: papéis claros, território exclusivo,
biblioteca compartilhada, e cada entrega validada antes de virar mainline. Destilada do
projeto `growth-ai-agents` (Maio/2026), que entregou um SDR multi-tenant com painel em ~4
semanas usando vários Claudes em paralelo com **git worktrees + slots + zoning rígido**.

Este pacote é a encarnação **Claude Code local** dessa metodologia (a versão Paperclip vive
em `.a-nova-economia/`). Mesmos 4 papéis e filosofia; o alvo é o terminal, não uma API de issues.

## Os 4 pilares

1. **Filosofia (`EMPRESA.md`)** — 5-7 invariantes não-negociáveis. Todo agente lê antes de trabalhar.
2. **Biblioteca (`docs/`)** — system design (`docs/design/raw/` do OpenDesign), ADRs, referências
   externas (`docs/_references/`). Fonte da verdade local — zero alucinação.
3. **Organograma + zoning** — CTO (o quê) · Arquiteto (o como) · Dev (executa) · Integrador
   (qualidade). Cada papel com território exclusivo e não-sobreposto.
4. **Anatomia do slot** — BRIEF (o quê + critérios + território) + DESIGN-SPEC (schemas/nomes
   exatos) + CONTRACT (I/O + smoke) + ARTIFACTS (no fim: arquivos, smoke, pendências).

## Os 4 papéis (1 Company = 1 repo)

| Papel | Qtd | O que faz |
|---|---|---|
| **CTO** | 1 | Fala com o fundador. Dita a stack. Define milestones. Não toca código. |
| **Arquiteto** | 1 | Escreve BRIEF + DESIGN-SPEC por slot. Guardião do STACK-DEFAULT + ADRs. |
| **Dev** | 1..N | Pega 1 slot, implementa a spec literalmente na sua worktree, smoke, done. |
| **Integrador** | 1 | `reconcile` (merge na main) + review estrutural. Único a tocar a main/zonas neutras. |

Escala: projeto pequeno = 1 Dev. Grande = 3 Devs em paralelo, territórios disjuntos.
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

- **Zoning rígido** elimina conflito de merge — dois Devs nunca tocam o mesmo arquivo.
- **DESIGN-SPEC** elimina conflito semântico — todos usam os mesmos nomes/schemas.
- **Worktrees** dão isolamento real — `git checkout` de um não quebra o outro.
- **Smoke como gate** + **review estrutural** garantem que nada quebrado vira mainline.

## Antipadrões

- Dev sem DESIGN-SPEC inventa contrato → conflito no merge. (Arquiteto sempre escreve antes.)
- Slot tocando zona neutra → reconciler retrabalha. (Zona neutra só do Integrador.)
- Marcar `done` sem smoke → descoberto no reconcile, slot reaberto.
- Slots não commitados na main antes do reconcile → merge quebra com arquivo untracked.
- CTO perguntando escolha técnica ao fundador → ele não sabe; o CTO dita (STACK-DEFAULT).
- Fechar milestone sem HTC aprovado → "pronto" sem dono ter testado. HTC é gate, não etapa opcional.
- Consertar bug/slot e seguir sem registrar em `LEARNINGS.md` → o erro volta. O ciclo de aprendizado não pode romper.
