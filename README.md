# a360-dev-multiagentes — plugin Claude Code

Um **time de IA multi-agente** (CTO · Arquiteto · Dev · Integrador) que constrói software
de ponta a ponta pra um fundador que **não programa**: scaffolda o monorepo, lê o design
system do OpenDesign, desenvolve em paralelo com **git worktrees**, e faz o **deploy no
VPS** com Docker. Da ideia ao ar, em 3 comandos.

> Codifica a metodologia que entregou um SDR multi-tenant em ~4 semanas no projeto
> `growth-ai-agents`, agora como plugin reutilizável. Motor: o `ai-team` CLI (worktrees +
> slots + zoning), aqui generalizado pra rodar em qualquer projeto.

## Os 3 comandos (o fluxo do fundador)

| Comando | Fase | O que faz |
|---|---|---|
| `/a360-dev-multiagentes` | Kickoff + Scaffold | Entende a ideia, dita a stack, monta o monorepo (que compila), conecta o GitHub, e prepara a pasta do design (`docs/design/raw/`). |
| `/a360-vamos` | Construir | Lê o design system do OpenDesign e desenvolve a solução com os 4 papéis em worktrees paralelas. |
| `/a360-deploy` | Publicar | Instala Docker (local + VPS), pega os dados do servidor e sobe o app com HTTPS automático. |

## Estrutura do pacote

```
.multi-agents-package/
├── .claude-plugin/plugin.json     # manifesto do plugin
├── README.md                      # você está aqui
├── DEMO-RUNBOOK.md                # roteiro passo-a-passo pro demo ao vivo
├── commands/                      # /a360-dev-multiagentes · /a360-vamos · /a360-deploy
├── agents/                        # cto · arquiteto · dev · integrador (alvo Claude Code local)
├── skills/                        # scaffold-monorepo · ler-design-system · decompose-goal ·
│                                  #   write-design-spec · orquestrar-build · review-before-merge ·
│                                  #   registrar-aprendizado · deploy-vps
├── cli/                           # ai-team CLI (motor multi-agente) — generalizado, compila
├── templates/
│   ├── monorepo/                  # esqueleto scaffoldado (compila verde) + docs/ vivos:
│   │                              #   README · 01-INTRODUCAO..05-TROUBLESHOOTING · SOLUTION-OVERVIEW ·
│   │                              #   ROADMAP · LEARNINGS (ciclo de aprendizado)
│   └── docker/                    # Dockerfile.api/web · docker-compose · Caddyfile
└── references/                    # STACK-DEFAULT · METODOLOGIA · PARALLEL-PROTOCOL
```

## Instalar (Claude Code local)

Passo a passo completo em **[`INSTALL.md`](./INSTALL.md)**. Resumo do fluxo visual:

```
claude
/plugin marketplace add <caminho-absoluto-desta-pasta>
/plugin            # menu visual → instala a360-dev-multiagentes → Enable
```

Funciona no **terminal** ou no **Desktop em modo local** (não no `claude.ai/code` web).

> Pré-requisitos na máquina: Node 20+, pnpm 9+ (`corepack enable`), git, e `gh` (GitHub
> CLI) pro passo do repositório. O próprio `/a360-dev-multiagentes` detecta o que falta e
> guia a instalação.

## Como funciona por baixo (1 parágrafo)

Cada milestone vira **slots** (`specs/slots/<m>/<slot>/`) com território não-sobreposto.
O Arquiteto escreve BRIEF + DESIGN-SPEC. O `ai-team start` cria uma **git worktree** por
slot; cada Dev (um Claude) implementa o seu em isolamento, roda o smoke e marca `done`. O
`ai-team reconcile` faz merge `--no-ff` na main, sincroniza barrels, roda o smoke cruzado e
limpa as worktrees. Zoning rígido elimina conflito de arquivo; DESIGN-SPEC elimina conflito
semântico. Detalhe em [`references/METODOLOGIA.md`](./references/METODOLOGIA.md).

## Relação com `.a-nova-economia`

Mesma metodologia, alvo diferente. `.a-nova-economia` empacota os 4 papéis pro **Paperclip**
(API de issues). Este pacote é a versão **Claude Code local** (terminal + worktrees + ai-team
CLI). Os dois compartilham filosofia, STACK-DEFAULT e os 4 papéis.

## Licença

MIT — KCG Group / Accelera360.
