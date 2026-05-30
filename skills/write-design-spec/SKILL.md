---
name: write-design-spec
description: Redige a DESIGN-SPEC formal de um slot (schemas Zod, signatures, props, queries, nomes exatos) por tipo de trabalho — backend endpoint, frontend component, tool/lib, data model, adapter de integração, migration. Usada pelo Arquiteto antes dos Devs pegarem o slot. Valida contra o STACK-DEFAULT.
---

# write-design-spec

A DESIGN-SPEC é o **contrato** que o Dev implementa literalmente. Spec boa = zero conflito
semântico no merge. Toda spec valida contra `references/STACK-DEFAULT.md` (adapter pattern,
stores como interface, Zod nas fronteiras, segurança baseline) e referencia o design real
(`docs/design/raw/` + `docs/design/DESIGN-OVERVIEW.md`) quando for UI.

Grave em `specs/slots/<m>/<slot>/DESIGN-SPEC.md`. **Nomes são determinísticos** — o que você
escrever aqui é exatamente o que o código terá.

## Princípios
- Zod **completo**, nunca `z.any()`. Tipos derivam do schema via `z.infer`.
- Mínima viável: não introduza abstração que o BRIEF não pede.
- Território explícito: liste os paths exatos que o slot pode tocar + as zonas neutras proibidas.
- Adapter pra dependência externa trocável (LLM/CRM/mensagem/pagamento). Nunca SDK direto no consumidor.

## Templates por tipo

### Backend endpoint (`apps/api/**`)
```markdown
## DESIGN-SPEC — endpoint <METHOD> <rota>
- Arquivo: apps/api/src/routes/<arquivo>.ts
- Input (Zod):  const Body = z.object({ ... })   // params/query/body
- Output (Zod): const Res = z.object({ ... })
- Handler: async (req, reply) => Res
- Auth: <pública | sessão Better Auth | role X>
- Erros: <400/401/404/409 + corpo tipado>
- Smoke: apps/api/src/routes/<arquivo>.test-smoke.ts (descreva o caso)
- Território: apps/api/src/routes/<arquivo>.ts  |  Neutro proibido: server.ts (reconciler registra)
```

### Frontend component/page (`apps/web/**`)
```markdown
## DESIGN-SPEC — <Componente|Página>
- Ref design: docs/design/raw/<arquivo>  (replicar fielmente)
- Arquivo: apps/web/src/<...>.tsx
- Props (tipo): interface <Nome>Props { ... }
- Estado: <zustand store | react-query key | local>
- Dados: consome <endpoint> via react-query (key, shape = Res do backend)
- Estados visuais: vazio | carregando | erro | sucesso
- Território: apps/web/src/<...>  |  Neutro proibido: barrels/layout compartilhado
```

### Tool/lib (`packages/core/src/<área>/**`)
```markdown
## DESIGN-SPEC — tool <nome>
- Arquivo: packages/core/src/tools/library/<nome>.ts
- Input (Zod) / Output (Zod) / signature: export const <nome>: Tool = { ... }
- Território: o arquivo da tool  |  Neutro proibido: registry/barrel index.ts (reconciler sincroniza)
```

### Data model / migration (`packages/*/schema/**`)
```markdown
## DESIGN-SPEC — modelo <Entidade>
- Tabela Drizzle: <colunas, tipos, FKs, índices, workspaceId se multi-tenant>
- RLS: <política>
- Store: interface <Entidade>Store + adapters memory/supabase
- Migration: drizzle-kit (descreva)
```

### Adapter de integração (`packages/<dominio>/**`)
```markdown
## DESIGN-SPEC — adapter <dominio>/<vendor>
- Interface: packages/<dominio>/src/types.ts  →  <Dominio>Provider
- Adapter: packages/<dominio>/src/adapters/<vendor>.ts  implements <Dominio>Provider
- Factory: index.ts  create<Dominio>({ provider, ...opts })
- Erros tipados: errors.ts
```

## Antes de finalizar (checklist)
- [ ] Schemas Zod completos, sem `z.any()`.
- [ ] Nomes exatos (função, tipo, campo, componente).
- [ ] Território + zonas neutras explícitos.
- [ ] Padrões STACK-DEFAULT respeitados (adapter/stores/Zod/segurança).
- [ ] Smoke definido no CONTRACT (comando que prova o slot pronto).
- [ ] UI referencia `docs/design/raw/<arquivo>`.

Decisão arquitetural nova fora do default? Crie `docs/ADRs/NNN-<slug>.md` e cite na spec.
Depois, `STATUS.txt = available` e commite o slot na main.
