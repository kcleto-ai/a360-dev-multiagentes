# Instalar o plugin a360-dev-multiagentes

> Funciona no **Claude Code local**: o **terminal** (`claude`) ou a **aba "Code" do app
> Claude em modo _Local_**. **Não** funciona no Cowork nem no `claude.ai/code` (nuvem) —
> o fluxo usa sua máquina (git worktrees, pnpm, Docker, VPS).

Marketplace público: **`github.com/kcleto-ai/a360-dev-multiagentes`**

---

## Opção A — 1 clique, sem digitar nada (recomendado pra time não-técnico)

Pra a pessoa só **abrir uma pasta e clicar em Instalar**, coloque um arquivo
`.claude/settings.json` no repositório do projeto dela com isto:

```json
{
  "extraKnownMarketplaces": {
    "a360": {
      "source": { "source": "github", "repo": "kcleto-ai/a360-dev-multiagentes" }
    }
  },
  "enabledPlugins": {
    "a360-dev-multiagentes@a360": true
  }
}
```

Aí, no **app Claude → aba Code (modo Local)**, a pessoa:
1. Abre essa pasta do projeto.
2. **Confia na pasta** quando perguntado.
3. Clica em **Instalar** no aviso do plugin que aparece.

Zero terminal, zero comando. _(Um exemplo pronto está em [`examples/projeto-base/`](./examples/projeto-base/).)_

---

## Opção B — instalar manualmente (visual, via `/plugin`)

No **terminal** ou na **aba Code (Local)**:

```
/plugin marketplace add kcleto-ai/a360-dev-multiagentes
/plugin
```
→ marketplace **a360** → **a360-dev-multiagentes** → **Install** → **Enable**.
(Atalho: `/plugin install a360-dev-multiagentes@a360`)

> Se o `/plugin` não existir no seu app, você está no **Cowork** ou numa sessão **remota**.
> Use a **aba Code em modo Local**, ou o **terminal**.

---

## Opção C — terminal, sem marketplace (dev/demo)

```bash
git clone https://github.com/kcleto-ai/a360-dev-multiagentes
cd ~/meu-projeto-novo
claude --plugin-dir /caminho/para/a360-dev-multiagentes
```

---

## Usar (depois de instalado)

Numa pasta **vazia** (o projeto do cliente), abra o Claude e digite:
```
/a360-dev-multiagentes
```
Depois: design em `docs/design/raw/` → `/a360-vamos` → `/a360-deploy`. O time roda tudo;
a pessoa só conversa e aprova (HTC).

## Pré-requisitos na máquina
Node 20+, pnpm 9+ (`corepack enable`), git, `gh` (GitHub CLI), Docker (pra deploy). O
`/a360-dev-multiagentes` detecta o que falta e guia.
