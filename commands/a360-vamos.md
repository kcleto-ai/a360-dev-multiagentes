---
description: Lê o design system (export do OpenDesign em docs/design/raw/), PLANEJA o milestone e os slots por escrito, constrói com o time multi-agente em worktrees, e fecha com HTC (Human Test Checkpoint). Use depois do /a360-dev-multiagentes.
argument-hint: "[opcional: o que priorizar primeiro]"
---

# /a360-vamos — Ler o design → planejar → construir → HTC

O scaffold já existe (via `/a360-dev-multiagentes`) e a pessoa colocou o design em
`docs/design/raw/`. Agora o time **constrói**. Você orquestra os 4 papéis e o **ai-team
CLI** (worktrees + slots). A pessoa continua não-técnica — conduza, mostre progresso.

> **Mesmo executando tudo sozinho (1 agente), você NÃO pula etapa.** O valor do método
> está nos artefatos: ROADMAP escrito, slots especificados, docs vivos, e HTC aprovado.
> Fonte de verdade: `references/PARALLEL-PROTOCOL.md`, `references/STACK-DEFAULT.md`,
> `references/METODOLOGIA.md`, `EMPRESA.md`. Motor: `pnpm --filter @a360/ai-team cli <cmd>`.

## 0. Pré-checagem
```bash
ls docs/design/raw/             # tem que ter o export do OpenDesign
git rev-parse --show-toplevel   # raiz do projeto
pnpm -r typecheck               # baseline verde
```
`docs/design/raw/` vazio → pare e peça o export.

## 1. Ler o design — skill `ler-design-system`
Produz `docs/design/DESIGN-OVERVIEW.md` (telas, tokens, fluxos). Mostre o que entendeu, em
linguagem da pessoa, e confirme. Se o design divergir do `EMPRESA.md` (produto diferente do
assumido no kickoff), **alinhe o EMPRESA.md ao design** e avise a pessoa — o design manda.

## 2. PLANEJAR — escrever ROADMAP + slots (OBRIGATÓRIO, antes de qualquer código)

> 🚧 **Gate:** não escreva nenhuma linha de código de feature antes deste passo estar
> commitado. Vale mesmo em modo automático/solo.

**a) Como CTO, escreva `docs/ROADMAP.md`** — define o **M1** (caminho feliz vendável),
seus **critérios de sucesso** (o que o usuário consegue fazer ao final, observável), a
lista de slots, e um esboço do M2+. Use a skill `decompose-goal`.

**b) Como Arquiteto, escreva os slots** com território **não-sobreposto**. Pra cada slot,
`specs/slots/M1/<slot-id>/`:
```
BRIEF.md         # o quê + critérios de aceite + território permitido + zonas neutras
DESIGN-SPEC.md   # como: schemas Zod, signatures, props, nomes EXATOS (skill write-design-spec)
CONTRACT.md      # I/O + comando de smoke + pendências pro reconciler
STATUS.txt       # available
```
Telas referenciam `docs/design/raw/<arquivo>`. Padrões saem do STACK-DEFAULT.

**c) Commit + plan:**
```bash
git add docs/ROADMAP.md specs/slots/M1
git commit -m "chore(plan): ROADMAP do M1 + slots especificados"
pnpm --filter @a360/ai-team cli plan --milestone=M1
```

## 3. Construir — skill `orquestrar-build`
Loop multi-agente em worktrees. **Modo A (paralelo ao vivo, ⭐ demo)** ou **Modo B
(automático)** — ver a skill. Cada slot: implementa a DESIGN-SPEC literalmente, `pnpm install`
na worktree, smoke verde, `ARTIFACTS.md`, `STATUS=done`.

## 4. Integrar — papel Integrador
```bash
git checkout main
pnpm --filter @a360/ai-team cli reconcile     # merge --no-ff + barrels + smoke + cleanup
```
Depois, **review estrutural** (skill `review-before-merge`, Tier 1 = fidelidade à
DESIGN-SPEC). Critical → reabre slot `blocked`. Conflito semântico → CTO decide.

## 5. HTC — Human Test Checkpoint (GATE OBRIGATÓRIO) 🛑

> O milestone **NÃO está pronto** até a pessoa testar e aprovar. Nunca declare "entregue"
> antes disso. É o portão intencional entre "o time acha que terminou" e "o dono confirmou".

1. Suba o app: `pnpm dev` (api + web).
2. Apresente um **checklist de teste concreto** — o que clicar e o resultado esperado,
   em linguagem da pessoa. Ex.:
   > **Teste o M1 (abra http://localhost:3000):**
   > 1. Entrar com e-mail válido + senha 6+ → cai no quadro.
   > 2. Criar um cartão na coluna "A fazer".
   > 3. Arrastar o cartão pra "Fazendo".
   > 4. Abrir o cartão, mudar prioridade e etiqueta, salvar.
   > 5. Buscar/filtrar; sair (logout).
3. **Espere a resposta.** (Use `AskUserQuestion`: "Aprova o M1?" — Aprovar / Reprovar com ajustes.)
   - **Aprovado** → vá pro passo 6.
   - **Reprovado** → crie slots `M1/fix-<n>` com o que falhou, volte ao passo 3. Não feche.

## 6. Fechar o milestone — atualizar a biblioteca viva (docs/)
Só após HTC aprovado:
- **`docs/SOLUTION-OVERVIEW.md`** — atualize com o que o M1 entregou (arquitetura real, módulos, decisões).
- **`docs/ROADMAP.md`** — marque M1 como ✅ entregue (com data) e detalhe o M2.
- **`docs/ADRs/NNN-*.md`** — registre decisões arquiteturais que emergiram (se houver).
- **`specs/RESUME.md`** — snapshot atual.
- Commit: `docs: fecha M1 (HTC aprovado) + atualiza biblioteca`.

Mostre o resultado e pergunte se quer **publicar** → `/a360-deploy`.

## Regras invioláveis
1. **Não builda sem o passo 2 commitado** (ROADMAP + slots escritos). Vale solo/automático.
2. Nada de implementar sem DESIGN-SPEC. Território não-sobreposto; zona neutra só o reconciler.
3. Smoke verde é gate pra `done` e pra reconcile. "Não testei" não existe.
4. **Não declara milestone pronto sem HTC aprovado pela pessoa** (passo 5). Sem exceção.
5. **Fechou milestone → atualizou `docs/`** (SOLUTION-OVERVIEW + ROADMAP + ADRs). Biblioteca viva é pilar.
6. Replique o design fielmente; BRIEF prevalece se divergir (aponte a divergência).
7. **Ciclo de aprendizado não rompe:** smoke que falhou, slot `blocked`, HTC reprovado, bug
   ou conflito → registre em `docs/LEARNINGS.md` (causa raiz + regra), skill `registrar-aprendizado`.
8. Commits atômicos; nunca force-push na main. Linguagem de negócio com a pessoa.
