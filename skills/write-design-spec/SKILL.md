---
name: write-design-spec
description: Redige a DESIGN-SPEC formal de um slot (schemas Zod, signatures, props, queries, nomes exatos, contratos da fundação com paths) por tipo de trabalho — módulo backend, rota frontend, core, fundação de dados, adapter. Usada pelo Arquiteto antes dos Devs pegarem o slot. Valida contra o STACK-DEFAULT e os ADRs de fábrica.
---

# write-design-spec

A DESIGN-SPEC é o **contrato** que o Dev implementa literalmente. Spec boa = zero conflito
semântico no merge. Lição projeto-origem: spec que dizia só "card de métrica" gerou 2
implementações divergentes (altura/padding/fonte) — **especificidade é obrigação, não zelo**.
Toda spec valida contra `references/STACK-DEFAULT.md` + `docs/ADRs/` (adapter pattern,
modular por domínio, decomposição page/client/components, Zod nas fronteiras, segurança
baseline) e referencia o design real (`docs/design/DESIGN-OVERVIEW.md`) quando for UI.

Grave em `specs/slots/<m>/<slot>/DESIGN-SPEC.md`. **Nomes são determinísticos** — o que você
escrever aqui é exatamente o que o código terá.

## Princípios

- Zod **completo**, nunca `z.any()`. Tipos derivam do schema via `z.infer`.
- **DTO compartilhado nasce ANTES do slot:** você (Arquiteto) cria
  `packages/shared/src/dto/<dominio>.ts` e commita na main — shared é zona neutra;
  o Dev só consome de `@app/shared`.
- **Contratos da fundação com assinatura REAL:** toda spec lista os hooks/componentes/
  helpers da fundação que o slot consome, com PATH do arquivo e assinatura exata
  (lição os-v2/1.5: Dev desestruturou `{ toast }` de um hook que retorna função direta —
  a spec deve cravar o uso correto).
- **UI com valores exatos:** tokens (`var(--token)`, nunca hex), px/rem do DESIGN-OVERVIEW,
  e os 4 estados (loading/empty/error/sucesso) especificados.
- Mínima viável: não introduza abstração que o BRIEF não pede.
- Junto com a spec, preencha `TERRITORY.txt` (globs) e `DEPENDS-ON.txt` (fundação) do slot.
- Adapter pra dependência externa trocável. Nunca SDK direto no consumidor (ADR 002/008).

## Templates por tipo

### Módulo backend (`apps/api/src/modules/<dominio>/**`) — ADR 004
```markdown
## DESIGN-SPEC — módulo <dominio>
- Arquivos: modules/<dominio>/{<dominio>.routes.ts, <dominio>.service.ts, <dominio>.schema.ts}
- Rotas: <METHOD> /api/<...> (prefixo registrado pelo Integrador no app.ts — pendência no ARTIFACTS)
- DTO (já criado em shared): packages/shared/src/dto/<dominio>.ts → <Nome>Schema / <Nome>Dto
- Input (Zod): const <Nome>BodySchema = z.object({ ... })   // no <dominio>.schema.ts
- Auth: <pública | requireSession | requireRole(X)> — autorização é AQUI, não na UI
- Multi-tenant: <toda query filtra workspaceId | n/a>
- Erros: lançar <NotFoundError|ValidationError|...> (lib/errors.ts) — handler global converte
- Smoke: apps/api/test/<dominio>.smoke.test.ts — caminho feliz + autorização + validação (ADR 005)
- Replicar padrão: apps/api/src/modules/health/
- Fundação consumida: ok() de lib/http.ts · erros de lib/errors.ts · env de config/env.ts
- Env var nova? declarar: env.ts + .env.example + vitest.config.ts (zerada) — pendência pro Integrador
```

### Fissão de feature (decompose-goal §2.5) — os 3 slots de front + contrato

Quando a feature é fissionada, VOCÊ escreve na wave 0 (na main, antes dos slots):
DTO em `shared/src/dto/<dominio>.ts`, **fixtures** em `shared/src/fixtures/<dominio>.ts`
(tipadas pelo DTO — são a "verdade de mentira" que UI renderiza e hooks servem em dev),
e o **ViewModel** de cada componente no SHARED-CONTRACT. ViewModel ≠ DTO: é o shape que
o componente recebe por props; o mapper DTO→ViewModel mora na junção (default) ou no
web-data — a spec crava onde, nunca no componente.

#### web-data-<dominio> (`lib/queries/<dominio>.ts`)
```markdown
## DESIGN-SPEC — dados <dominio>
- Arquivo único: lib/queries/<dominio>.ts
- Keys: export const <dominio>Keys = { all, byId(id), ... } (factory exata)
- Hooks: use<X>() / use<X>Mutation() — assinaturas exatas; validam com <Nome>Schema (@app/shared)
- Fixture-fallback: withFixture(apiFetch(...), <nome>Fixture) — replicar lib/queries/health.ts
- Pendência pro Integrador: export no barrel lib/queries/index.ts
```

#### web-ui-<rota> (`app/<grupo>/<rota>/components/**`)
```markdown
## DESIGN-SPEC — UI <rota>
- Ref design: docs/design/DESIGN-OVERVIEW.md §<tela> (tokens/px EXATOS)
- Componentes (1 arquivo cada): <Nome> — props = interface <Nome>Props { ...ViewModel exato }
- PUROS: zero hooks de dados, zero fetch, zero import de lib/queries — só props
- Estados: cada componente especifica loading | empty | error | ok (renderizáveis via props)
- Desenvolvimento: renderize as fixtures de @app/shared (fixtures/<dominio>) pra validar visual
- Fundação consumida: <Button|Card|Tag...> de components/ui (path + assinatura)
```

#### web-screen-<rota> (junção — `page.tsx` + `<rota>-client.tsx`)
```markdown
## DESIGN-SPEC — junção <rota>
- DEPENDS-ON: web-data-<dominio>, web-ui-<rota>
- page.tsx server thin → <rota>-client.tsx ('use client', teto ~150 linhas — junção é PEQUENA)
- Liga: use<X>() (lib/queries) → mapper toViewModel() (definido AQUI) → componentes (./components)
- Estados da tela: mapeamento exato hook.isPending/isError/data → props dos componentes
- Se passar de ~150 linhas: PARE e devolva ao Arquiteto — a fissão foi mal feita
```

### Rota frontend SEM fissão (`apps/web/app/<grupo>/<rota>/**` + `lib/queries/<dominio>.ts`) — ADR 006
```markdown
## DESIGN-SPEC — tela <rota>
- Ref design: docs/design/DESIGN-OVERVIEW.md §<tela> (tokens/px EXATOS aqui)
- Arquivos: app/<grupo>/<rota>/{page.tsx (server thin), <rota>-client.tsx ('use client',
  teto ~300 linhas), components/<...>.tsx (presentacionais, props-only)}
- Data layer: lib/queries/<dominio>.ts — export const <dominio>Keys = {...} (query-key factory)
  + hooks use<X>() validando com <Nome>Schema de @app/shared
- Rota reservada no SHARED-CONTRACT? conferir colisão de grupos (rota transparente na URL)
- Estados visuais: loading | empty | error | sucesso — TODOS especificados
- Fundação consumida (path + assinatura REAL — confira o arquivo):
  - apiFetch<T>(path, init?) — apps/web/lib/api/client.ts (lança ApiError)
  - <Button|Card|Tag|...> — apps/web/components/ui/index.ts
- Variante/componente que a fundação NÃO cobre: implementar LOCAL em components/ da rota
  com var(--token) e registrar em ARTIFACTS como candidato à fundação. NÃO editar components/ui.
- Pendência pro Integrador: export de lib/queries/<dominio>.ts no barrel lib/queries/index.ts
```

### Fundação de dados (`packages/db/**`) — wave 0, ADR 007
```markdown
## DESIGN-SPEC — fundação <M>
- Tabelas Drizzle (schema.ts): <colunas, tipos, FKs, índices; workspaceId NOT NULL se multi-tenant>
- RLS: <política, se Supabase>
- Migration: drizzle-kit generate; aplicar dev (db:push) E test (db:push:test) ANTES do done
- Consumidores (DEPENDS-ON deles aponta pra cá): <slots>
- Campo novo em tabela/DTO existente: OPCIONAL + fallback no serializer (zero regressão)
```

### Core (`packages/core/src/<dominio>/**`)
```markdown
## DESIGN-SPEC — core <dominio>
- Arquivos: packages/core/src/<dominio>/<...>.ts (1 domínio = 1 pasta; barrel é neutro)
- Input (Zod) / Output (Zod) / signatures exatas
- Pureza: zero framework/HTTP/React — só lógica de domínio
```

### Adapter de integração (`packages/<dominio>/**`) — ADR 002 + 008
```markdown
## DESIGN-SPEC — adapter <dominio>/<vendor>
- Replicar padrão canônico: packages/email/
- Porta: packages/<dominio>/src/types.ts → <Dominio>Provider — NUNCA importa @app/shared
- Adapters: src/adapters/{dev.ts (obrigatório — console/memória), <vendor>.ts}
- Factory: src/index.ts → create<Dominio>(opts) — sem credencial → adapter dev
- Credencial: env.ts + .env.example + vitest.config.ts (zerada — teste nunca bate em serviço real)
```

## Antes de finalizar (checklist)

- [ ] Schemas Zod completos, sem `z.any()`; DTO compartilhado já commitado em shared.
- [ ] Nomes exatos (função, tipo, campo, componente, rota) — nada "a critério do Dev".
- [ ] Contratos da fundação listados com path + assinatura conferida no arquivo.
- [ ] UI: tokens/px exatos + 4 estados. Rota conferida no SHARED-CONTRACT.
- [ ] `TERRITORY.txt` e `DEPENDS-ON.txt` do slot preenchidos.
- [ ] Padrões STACK-DEFAULT + ADRs respeitados (adapter/modular/decomposição/Zod/segurança).
- [ ] Smoke definido no CONTRACT (comando que prova o slot pronto).
- [ ] Erros pré-existentes conhecidos (de slots paralelos) listados na spec.

Decisão arquitetural nova fora do default? Crie `docs/ADRs/NNN-<slug>.md` e cite na spec.
Depois, `STATUS.txt = available` e commite o slot na main.
