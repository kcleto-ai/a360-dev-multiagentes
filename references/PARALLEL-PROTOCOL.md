# Protocolo de Paralelismo — Worker + Reconciler

> Regras práticas pra rodar **até 4 Claudes em paralelo** sem pisar uns nos outros.
> Estréia em **M1**. Decisão arquitetural em [`MULTI-AGENT-MODEL.md`](./MULTI-AGENT-MODEL.md).

## TL;DR (5 regras de ouro)

1. **Cada worker em sua própria worktree.** Não compartilhe working dir — `git checkout` em terminal A sobrescreve o de B. Use `git worktree` (§1.5).
2. **Um slot, um worker, uma branch.** Branch nomeada `worker-<territory>/<slot-id>`.
3. **Claim antes de tocar arquivo.** Edita `STATUS.txt:claimed:<worker>` + `OWNER.txt`, commita imediatamente.
4. **Só edite arquivos do seu território.** Lista em §3 abaixo.
5. **Smoke antes de marcar `done`.** Sem smoke verde, slot fica `claimed` até ficar.

## 1.5 Worktree obrigatório (lição aprendida)

**Problema:** 3 terminais abertos na mesma pasta = working dir compartilhado. Quando A faz `git checkout`, B e C veem os arquivos de A. Quando alguém faz `git add . && commit`, puxa o trabalho dos outros 2 por engano. Caos.

**Solução:** **uma pasta física por worker** via `git worktree`:

```
growth-ai-agents/                          ← worktree principal (architect/reconciler)
└── .worktrees/                            ← gitignored
    ├── worker-tools-A/                    ← branch worker-tools/M1/tool-X
    ├── worker-tools-B/                    ← branch worker-tools/M1/tool-Y
    └── worker-tools-C/                    ← branch worker-tools/M1/tool-Z
```

**Setup (Architect prepara antes de chamar workers):**

```bash
# Cria worktree pra cada worker (já com branch nova baseada em main):
mkdir -p .worktrees
git worktree add -b worker-tools/M1/<slot-id-A> .worktrees/worker-tools-A
git worktree add -b worker-tools/M1/<slot-id-B> .worktrees/worker-tools-B
git worktree add -b worker-tools/M1/<slot-id-C> .worktrees/worker-tools-C
git worktree add -b worker-tools/M1/<slot-id-D> .worktrees/worker-tools-D
```

OU, se a branch já existe (ex: claim já foi feito):

```bash
git worktree add .worktrees/worker-tools-A worker-tools/M1/<slot-id-A>
```

**Worker abre Claude no diretório dedicado:**

```bash
cd .worktrees/worker-tools-A
claude
```

Cada `cd .worktrees/worker-tools-X` é uma cópia física do repo. `node_modules/` é compartilhado via symlinks do pnpm — só rode `pnpm install` uma vez no main worktree.

**Cleanup quando done:**

```bash
# Depois do reconcile merge, remove worktree
git worktree remove .worktrees/worker-tools-A
```

## 1. Papéis

| Papel | Quem | Faz |
|-------|------|-----|
| **Architect** | Conversa principal (você + 1 Claude) | Escreve slots em `specs/slots/`. Resolve ambiguidades. |
| **Worker-Frontend** | Claude no terminal #1 | Trabalha **só** em `apps/web/**` |
| **Worker-Backend** | Claude no terminal #2 | Trabalha **só** em `apps/api/**` |
| **Worker-Tools** | Claude no terminal #3 | Trabalha em `packages/core/src/tools/library/<slot>.ts` + `packages/ghl/src/<arquivo-novo>.ts` |
| **Worker-Agents** | Claude no terminal #4 | Trabalha em `packages/onboarding/**` + `apps/worker/**` |
| **Reconciler** | Claude separado (5º terminal) OU conversa principal | Merge branches, atualiza re-exports, smoke cruzado |

## 2. Anatomia de um slot

```
specs/slots/M1/<slot-id>/
├── BRIEF.md          ← spec auto-suficiente (Architect escreve)
├── CONTRACT.md       ← interface I/O esperada
├── STATUS.txt        ← available | claimed:<worker> | done | blocked
├── OWNER.txt         ← (criado no claim)
└── ARTIFACTS.md      ← worker preenche ao final: arquivos tocados + nota
```

Cada slot é **auto-suficiente**: o worker não precisa ler nada além do BRIEF+CONTRACT pra executar.

## 3. Zoning rígido

| Worker | **Pode** editar | **Não pode** editar |
|--------|-----------------|---------------------|
| **Frontend** | `apps/web/**`, `apps/web/package.json` | qualquer `packages/*`, `apps/api/*` |
| **Backend** | `apps/api/**`, `apps/api/package.json` | `apps/web/**`, `packages/core/types/**` |
| **Tools** | `packages/core/src/tools/library/<slot>.ts` (1 arquivo), `packages/ghl/src/<arquivo-novo>.ts` | `tools/library/index.ts`, `tools/registry.ts`, `tools/types.ts`, `core/types/**` |
| **Agents** | `packages/onboarding/**`, `apps/worker/**` | mesmo do Tools |

**Zona neutra** (só Architect/Reconciler editam):
- `packages/shared/**`
- `packages/core/src/types/**`, `core/src/store/**`, `core/src/prompts/base/**`
- `packages/*/src/index.ts` (re-exports)
- `pnpm-workspace.yaml`, root `package.json`, `tsconfig.base.json`
- `specs/STATUS.md`, `specs/DASHBOARD.md`
- `specs/slots/**/STATUS.txt`/`OWNER.txt` — **só do próprio slot**

**Regra de ouro:** se 2 workers podem editar o mesmo arquivo, o arquivo é zona neutra.

## 4. Lifecycle de um slot

```
[available] ── worker faz claim ─→ [claimed:worker-X]
                                          │
                                          ├─ worker executa
                                          ├─ smoke do slot passa
                                          ↓
                                       [done] ── Reconciler integra ─→ merged na main
                                          │
                                       [blocked] (se falhou; nota em ARTIFACTS.md)
```

### 4.1 Claim (worker)

```bash
# 1. Listar disponíveis no seu território
grep -l "available" specs/slots/M1/*/STATUS.txt

# 2. Escolher um. Suponhamos slot tool-parse-datetime.
SLOT=specs/slots/M1/tool-parse-datetime

# 3. Criar branch
git checkout -b worker-tools/M1/tool-parse-datetime

# 4. Claim atômico
echo "claimed:worker-tools-A" > $SLOT/STATUS.txt
echo "worker-tools-A" > $SLOT/OWNER.txt
git add $SLOT/STATUS.txt $SLOT/OWNER.txt
git commit -m "claim: M1/tool-parse-datetime by worker-tools-A"
```

Se 2 workers fizerem isso quase simultâneo, o segundo dá conflito no rebase quando tentar continuar. Aborta esse slot, escolhe outro.

### 4.2 Execução

Worker abre o `BRIEF.md`, executa exatamente o que está lá. Não inventa, não cresce escopo, não toca arquivos de zona neutra. Se precisar mudar algo na zona neutra, **PARA** e abre slot novo `gap-<id>` na pasta do slot original.

### 4.3 Smoke gate (obrigatório)

O `BRIEF.md` sempre traz `## Smoke test` com comando exato. Worker:
1. Roda o comando.
2. Se passar: escreve ARTIFACTS.md, commita.
3. Se falhar: investiga, corrige, repete. Se travar 30 min sem progresso → marca `blocked` em STATUS.txt + descreve em ARTIFACTS.md.

### 4.4 Marcar `done`

```bash
echo "done" > $SLOT/STATUS.txt
cat > $SLOT/ARTIFACTS.md <<'EOF'
## Files touched
- packages/core/src/tools/library/parse-datetime.ts

## Smoke result
✓ passed at 2026-MM-DDTHH:mm:ssZ

## Notes for Reconciler
- Adicionei import em index.ts? NÃO (zona neutra — Reconciler precisa adicionar).
- Nova dep adicionada? Não.
EOF
git add $SLOT/STATUS.txt $SLOT/ARTIFACTS.md
git commit -m "done: M1/tool-parse-datetime"
```

Pega o próximo slot e repete.

## 5. Reconciler

Disparado pelo humano (não automático) quando vê ≥2 slots `done`.

```bash
# 1. Listar branches done
git branch | grep worker-

# 2. Criar branch de integração
git checkout main
git checkout -b reconcile/$(date +%Y%m%d-%H%M)

# 3. Merge na ordem cronológica
git merge --no-ff worker-tools/M1/tool-parse-datetime
git merge --no-ff worker-tools/M1/tool-smart-schedule
# ...

# 4. Resolver conflitos esperados:
#    packages/core/src/tools/library/index.ts → adicionar imports dos novos slots
#    Reconciler edita à mão e commita.

# 5. Smoke cruzado
pnpm -r --if-present typecheck
pnpm --filter @agents/cli exec tsx src/smoke-m0.ts

# 6. Se tudo verde:
git checkout main
git merge --ff-only reconcile/<timestamp>

# 7. Atualizar STATUS.md global (marcar slots como 🟢)
# 8. Deletar branches workers integradas
```

## 6. Quando humano dispara qual worker

Mensagem padrão pra abrir um terminal Claude como worker:

```
Você é Worker-<TERRITORY> (frontend|backend|tools|agents).

1. Leia specs/00-COMO-USAR.md
2. Leia specs/PARALLEL-PROTOCOL.md (este arquivo)
3. Liste slots `available` no seu território:
   grep -l "available" specs/slots/M1/*/STATUS.txt
4. Escolha um. Faça o claim conforme §4.1.
5. Leia BRIEF.md + CONTRACT.md.
6. Execute. Smoke gate obrigatório.
7. Marque done. Pega próximo.
8. Se travar em algo de zona neutra → marque `blocked` e me avise.

NUNCA toque em zona neutra. NUNCA edite slots de outro território.
```

## 7. Pronto pra M1?

Slots a serem criados pelo Architect (próximo passo):

| Slot | Worker | Territory |
|------|--------|-----------|
| `tool-parse-datetime` | Tools | `packages/core/src/tools/library/parse-datetime.ts` |
| `tool-smart-schedule` | Tools | `packages/core/src/tools/library/smart-schedule.ts` |
| `tool-cancel-appointment` | Tools | `packages/core/src/tools/library/cancel-appointment.ts` |
| `tool-reschedule-appointment` | Tools | `packages/core/src/tools/library/reschedule-appointment.ts` |
| `tool-check-appointment` | Tools | `packages/core/src/tools/library/check-appointment.ts` (+ `packages/ghl/src/contacts.ts:listAppointmentsForContact`) |
| `tool-add-tags` | Tools | `packages/core/src/tools/library/add-tags.ts` (+ `packages/ghl/src/contacts.ts:addTagsToContact`) |
| `tool-qualify-lead` | Tools | `packages/core/src/tools/library/qualify-lead.ts` (+ `packages/ghl/src/notes.ts:createContactNote`) |
| `tool-lead-score` | Tools | `packages/core/src/tools/library/lead-score.ts` (+ `packages/ghl/src/opportunities.ts`) |
| `tool-handoff-human` | Tools | `packages/core/src/tools/library/handoff-human.ts` |
| `tool-set-meeting-type` | Tools | `packages/core/src/tools/library/set-meeting-type.ts` |

Todos do mesmo território (Tools). Logo, **os 4 Claudes serão Worker-Tools-A/B/C/D**. Cada um pega 2-3 slots.

Após M1 fechar, M2/M3 trazem trabalho de territórios diferentes (Backend, Frontend).

## 8. Reversão

Se o modelo der mais trabalho que ganho:
- Pare workers.
- Reconciler faz merge final do que tem `done`.
- Continue serial.

**Critério "vale a pena":** ≥3 slots ativos simultâneos por ≥1h sem conflito em zona neutra. Se passar 30 min sem mover, é serial disfarçado.
