# PARALLEL-PROTOCOL — desenvolvimento multi-agente em worktrees

Como vários Devs (Claudes) trabalham em paralelo sem merge hell. 5 regras de ouro.

## 1. Worktree por worker
Cada Dev trabalha numa cópia isolada do repo em `.worktrees/<worker>/`, na sua própria
branch (`worker/<milestone>/<slot>`). Criada pelo `ai-team start`. `node_modules` é
compartilhado via pnpm — instala uma vez na main.

## 2. Slot é a unidade de trabalho
`specs/slots/<milestone>/<slot-id>/` com `BRIEF.md` + `DESIGN-SPEC.md` + `CONTRACT.md` +
`STATUS.txt` + (no fim) `ARTIFACTS.md`. Ciclo:
```
available → claimed:<worker> → done → (reconcile) → main
                              ↘ blocked:<motivo> → CTO/Arquiteto resolve
```

## 3. Zoning rígido (territórios não-sobrepostos)
| Território | Pode editar | Não pode |
|---|---|---|
| Frontend | `apps/web/**` | `apps/api/**`, `packages/*` |
| Backend | `apps/api/**` | `apps/web/**`, barrels |
| Core/Tools | `packages/core/src/<área>/**` | barrels `index.ts`, types compartilhados |
| Dados | `packages/*/schema/**`, migrations | re-exports |

**Zonas neutras** (só o reconciler toca): `packages/*/index.ts` (barrels),
`tsconfig.base.json`, `package.json` raiz, `pnpm-workspace.yaml`, `specs/RESUME.md`.

## 4. Claim atômico
O worker escreve `STATUS.txt=claimed:<worker>` + `OWNER.txt` e commita na sua branch. Dois
workers no mesmo slot → o segundo pega conflito e escolhe outro. (O `ai-team start` faz isso.)

## 5. Done exige smoke verde
Antes de `done`: o smoke do CONTRACT passa. Escreve `ARTIFACTS.md` (arquivos, smoke,
pendências). O reconciler (`ai-team reconcile`) faz merge `--no-ff` na main, sincroniza
barrels, roda o smoke cruzado e limpa a worktree.

## Papéis
- **Arquiteto** — escreve BRIEF + DESIGN-SPEC dos slots (antes dos Devs).
- **Dev/Worker** — pega 1 slot, implementa, smoke, done. Vários em paralelo.
- **Integrador/Reconciler** — merge + review + zonas neutras. Único a tocar a main.
