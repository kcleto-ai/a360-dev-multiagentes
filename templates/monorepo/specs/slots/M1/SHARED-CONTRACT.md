# SHARED-CONTRACT — M1

> Contrato COMUM a todos os slots deste milestone. O Arquiteto escreve antes dos Devs
> começarem; todo Dev lê DEPOIS do RESUME e ANTES do BRIEF do seu slot.
> Lição (projeto-origem): decisão transversal que ficou só na cabeça de um slot vira
> conflito semântico no reconcile — rota duplicada, nome divergente, tipo redeclarado.

## Nomes e rotas reservados neste milestone

| Slot | Rota/Módulo/Domínio | Observação |
|---|---|---|
| _(exemplo)_ `web-clientes` | `/clientes` + `lib/queries/clients.ts` | — |
| _(exemplo)_ `api-clients` | `modules/clients/` + prefixo `/api/clients` | — |

⚠️ App Router: grupos de rota `(grupo)` são TRANSPARENTES na URL — dois grupos com a
mesma pasta filha colidem silenciosamente. Antes de reservar rota nova, confira a
coluna acima E `ls apps/web/app/**/`.

## Tipos/DTOs compartilhados deste milestone

Definidos pelo Arquiteto em `packages/shared/src/dto/<dominio>.ts` (zona neutra) ANTES
dos slots começarem. Slots consumidores importam de `@app/shared` — nunca redeclaram.

| DTO | Arquivo | Slots que consomem |
|---|---|---|
| _(exemplo)_ `ClientDto` | `dto/clients.ts` | `api-clients`, `web-clientes` |

## Contratos da fundação (assinaturas REAIS — confira o arquivo antes de usar)

| Contrato | Path | Assinatura |
|---|---|---|
| fetch base | `apps/web/lib/api/client.ts` | `apiFetch<T>(path, init?) → Promise<T>` (lança `ApiError`) |
| envelope HTTP | `packages/shared/src/dto/api.ts` | `ApiResult<T> = ApiOk<T> \| ApiErr` |
| helper de resposta | `apps/api/src/lib/http.ts` | `ok<T>(data) → ApiOk<T>` |
| erros da api | `apps/api/src/lib/errors.ts` | `throw new NotFoundError(...)` etc. |
| primitivos UI | `apps/web/components/ui/index.ts` | `Button`, `Card`, `Tag` |

## Decisões transversais do milestone

- _(preencher: convenções de validação, formato de datas, i18n, etc.)_
