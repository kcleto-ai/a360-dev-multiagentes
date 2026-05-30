# 5. Troubleshooting

> Quando algo dá errado, comece aqui. E todo problema novo que resolvermos vira uma entrada
> em [`LEARNINGS.md`](./LEARNINGS.md) (e, se for recorrente, uma receita aqui).

## Receita geral

1. **Não entre em pânico.** O Claude reverte quase tudo.
2. **Cole o erro inteiro pro Claude** (não resuma — ele precisa do texto).
3. Frase: *"Antes de consertar, diagnostique a causa raiz e me mostre."*
4. Se Claude propuser algo agressivo (apagar arquivo, `git reset`), diga *"vamos discutir antes"*.
5. Resolveu? **Registre em `docs/LEARNINGS.md`.**

## Problemas comuns (já vividos)

### Porta ocupada (`EADDRINUSE`)
A API (3001) ou o web (3000) não sobem porque a porta já está em uso por outro serviço.
**Solução:** libere a porta — `kill $(lsof -ti tcp:3001)` — ou rode em outra porta
(`API_PORT=4001 pnpm --filter @app/api start`, e o web com `API_URL=http://localhost:4001`).

### Worktree não roda o smoke (`tsc: command not found`)
Cada worktree é uma pasta separada e **não herda o `node_modules`**.
**Solução:** dentro da worktree, rode `pnpm install` antes do smoke (é rápido — usa o cache).

### `pnpm install` falha
```
rm -rf node_modules pnpm-lock.yaml && pnpm install
```
Persistiu? Peça: *"confira se Node ≥20 e pnpm ≥9 batem com o projeto."*

### `pnpm -r typecheck` falha
Cole o erro completo. Causa comum: contrato entre pacotes quebrou (um slot mudou um
nome/formato que outro espera). Frase: *"esse erro veio depois do slot <X>; reverta e explique."*
(Dica: com `exactOptionalPropertyTypes`, campos opcionais que aceitam `undefined` precisam
ser tipados como `T | undefined`.)

### `next start` não acha as rotas `/api/*` (404)
O `next start` **não honra os rewrites** com `output: standalone`.
**Solução:** em dev use `pnpm dev` (`next dev`); em produção o Docker usa `node server.js`
(standalone). Não use `next start`.

### Reconcile quebra: "untracked working tree files would be overwritten"
Os slots não foram **commitados na main** antes do reconcile.
**Solução:** `git add specs/slots && git commit -m "chore(specs): slots"` antes de reconciliar.

### `/a360-vamos` reclama que o design está vazio
Coloque o export do OpenDesign em `docs/design/raw/` (PNG/PDF/HTML) e rode de novo.

### Login não entra / cartões não carregam
- A API está no ar? `curl -fsS http://localhost:3001/health` deve responder `{"ok":true}`.
- O web aponta pra API certa? (`API_URL` no `next.config`/ambiente.)
- Cookie de sessão: use o mesmo host (o proxy `/api/*` do Next resolve isso).

## Quando nada acima resolve

Frase pro Claude:
```
Estou travado: <descreva>. Cole abaixo o que tentei.
Investigue a causa raiz, proponha 2 caminhos, e espere meu OK.
Depois de resolver, registre em docs/LEARNINGS.md.
```
