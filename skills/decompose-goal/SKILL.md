---
name: decompose-goal
description: Quebra um goal/milestone em slots de trabalho com território não-sobreposto, prontos pro Arquiteto detalhar com DESIGN-SPEC. Usada pelo CTO+Arquiteto no início do /a360-vamos, depois de ler o design system. Garante zoning disjunto pra os Devs paralelos não conflitarem.
---

# decompose-goal

Transforma "o que o produto precisa fazer" em **slots executáveis em paralelo**. A regra que
faz tudo funcionar: **territórios disjuntos** — dois slots nunca tocam o mesmo arquivo.

## 1. Definir o milestone + escrever `docs/ROADMAP.md` (CTO)
Pegue o goal + o `docs/design/DESIGN-OVERVIEW.md`. Defina o **M1 = caminho feliz vendável
mínimo** (o fluxo principal funcionando ponta a ponta). Corte o resto pro M2. Não
over-decomponha: produto pequeno = poucos slots.

**Escreva `docs/ROADMAP.md`** (não pule — é o artefato de planejamento, vale mesmo solo):
```markdown
# ROADMAP — <produto>

## M1 — <nome do milestone>  (status: em andamento)
**Objetivo:** <o caminho feliz que o M1 entrega>
**Critérios de sucesso (HTC):** <lista observável — o que o usuário consegue fazer ao final>
**Slots:**
- `<slot-id>` — <uma linha> — território `<paths>`
- ...

## M2+ (esboço)
- <o que fica pra depois: persistência real, auth completa, colaboração, etc.>
```
Commit junto com os slots. O ROADMAP é a fonte da verdade do escopo do milestone.

## 2. Fatiar por território (Arquiteto)
Quebre o M1 em slots, cada um num território da matriz de zoning (ver
`references/PARALLEL-PROTOCOL.md`):

| Território | Path típico | Exemplos de slot |
|---|---|---|
| Backend | `apps/api/**` | endpoint de auth, endpoint de listar leads |
| Frontend | `apps/web/**` | tela de login, tela de painel, tela de lista |
| Dados | `packages/*/schema/**` | modelo Lead, migration inicial |
| Core/Tools | `packages/core/src/**` | tool de envio WhatsApp, store de leads |
| Integração | `packages/<dominio>/**` | adapter Z-API, adapter Anthropic |

**Cheque sobreposição:** liste os paths de cada slot e confirme que nenhum se repete. Se
dois slots precisam do mesmo arquivo, ou (a) junte num slot só, ou (b) extraia a parte
compartilhada pra um slot-base que roda antes (dependência), nunca em paralelo com seus consumidores.

## 3. Criar a estrutura de cada slot
Pra cada slot, em `specs/slots/M1/<slot-id>/`:
```
BRIEF.md       # o quê + por quê + critérios de aceite + TERRITÓRIO (paths permitidos) + zonas neutras proibidas
STATUS.txt     # available
```
O **DESIGN-SPEC.md** e o **CONTRACT.md** vêm logo em seguida pela skill `write-design-spec`
(o Arquiteto não despacha slot sem DESIGN-SPEC).

Template do BRIEF:
```markdown
# BRIEF — <slot-id>
**O quê:** <uma frase>
**Por quê:** <conexão com o M1 / fluxo do produto>
**Critérios de aceite:**
- <comportamento observável 1>
- <comportamento observável 2>
**Território (pode editar):**
- <path 1>
- <path 2>
**Zonas neutras (NÃO tocar — reconciler faz):**
- barrels/index.ts, pnpm-workspace.yaml, tsconfig.base.json, server.ts (registro de rota)
**Depende de:** <slot-base, se houver — senão "nada (paralelo)">
```

## 4. Ordenar
- Slots **sem dependência** → rodam em paralelo (a maioria).
- Slots-base (schema/tipos compartilhados) → rodam **antes**, mergeiam, e só então os consumidores partem.

## 5. Commitar na main
```bash
git add specs/slots/M1 && git commit -m "chore(specs): slots do M1"
```
**Crítico:** slots commitados antes de qualquer `ai-team start`/`reconcile` (senão o merge
quebra com arquivo untracked).

## Saída
- N slots em `specs/slots/M1/` com BRIEF + STATUS=available, territórios disjuntos, commitados.
- Pronto pro Arquiteto rodar `write-design-spec` em cada um, depois `orquestrar-build`.
