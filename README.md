<div align="center">

# a360-dev-multiagentes

### Um time de IA completo que constrói e publica software de verdade, no **seu** Claude.

**CTO · Arquiteto · 4 Devs em paralelo · Integrador**. Da ideia ao deploy, em 3 comandos.

[![Claude Code Plugin](https://img.shields.io/badge/Claude%20Code-Plugin-d97757)](https://docs.claude.com/en/docs/claude-code)
[![Versão](https://img.shields.io/badge/vers%C3%A3o-2.0.0-blue)](.claude-plugin/plugin.json)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-green)](LICENSE)
[![PT--BR](https://img.shields.io/badge/idioma-PT--BR-yellow)]()

</div>

---

Você descreve o produto. O **CTO** entende e dita a stack. O **Arquiteto** desenha os
contratos. **Quatro Devs trabalham em paralelo**, cada um num território cercado, em git
worktrees isoladas. O **Integrador** faz o merge, valida e te entrega pra testar. Tudo
rodando como processos `claude` headless **na sua própria conta**: sem API key, sem
servidor, sem você colar prompt em terminal nenhum.

E o melhor: funciona tanto pra quem **nunca programou** quanto pra **devs**. A primeira
pergunta do time é o seu nível técnico, e toda a comunicação se calibra por ele.

## Da ideia ao ar, em 3 comandos

| Comando | O que acontece |
|---|---|
| **`/a360-dev-multiagentes`** | O CTO entende sua ideia, propõe a stack, monta um monorepo **real e funcional** (API Fastify + Next.js já sobem com `pnpm dev`), conecta no seu GitHub e prepara a pasta do design. |
| **`/a360-vamos`** | O time lê seu design (export do OpenDesign), confirma **os objetivos e fluxos com você em linguagem humana**, quebra tudo em contratos + slots paralelos, e **constrói sozinho**. Você acompanha pelo dashboard ao vivo. |
| **`/a360-deploy`** | Docker local, depois seu VPS, com HTTPS automático (Caddy). No ar. |

```
você ──▶ /a360-vamos
            │
            ├─ lê o design → "entendi que o sistema serve pra X. Confere?"  ← você confirma
            ├─ Arquiteto escreve os CONTRATOS (wave 0)
            │
            ├─ ai-team run ──── 4 workers headless em paralelo ──────┐
            │     api-clientes   web-data-clientes   web-ui-tela     │  watchdog vigia,
            │     (Dev back)     (Dev front)         (Dev front)     │  reconcile integra,
            │                                                        │  triage desbloqueia
            ├─ merge na main + smoke cruzado + relatório  ◀──────────┘
            │
            └─ HTC: VOCÊ testa e aprova. Sem seu OK, nada é "entregue".
```

## Por que é rápido: fissão contract-first

A maioria dos "times de IA" trabalha em série. Aqui, o segredo é que **o contrato vem
antes do código**: o Arquiteto crava schemas (Zod), fixtures tipadas e props de componente
na wave 0. A partir daí, **ninguém espera ninguém**:

- o Dev de **backend** implementa o módulo validando contra o schema;
- o Dev de **dados do front** escreve os hooks validando contra o *mesmo* schema
  (com fixture-fallback: a tela funciona antes da API existir);
- o Dev de **UI** constrói componentes puros renderizando as fixturas do contrato;
- um slot de **junção** pequeno liga tudo no final.

Drift entre front e back **quebra em typecheck**, não na integração. Squad padrão:
**2 front + 2 back simultâneos**, fora CTO e Arquiteto.

## Multi-agente de verdade (não é teatro de prompts)

O motor `ai-team` é um orquestrador real, testado de ponta a ponta:

| Capacidade | Como |
|---|---|
| **Spawn autônomo** | `ai-team run` sobe workers `claude -p` headless por slot, na sua conta |
| **Scheduler com waves** | dependências explícitas (`DEPENDS-ON`): fundação merge antes dos consumidores |
| **Watchdog** | worker morto/estagnado/em timeout é morto, re-despachado (com limite) e escalado pra você |
| **Triage automática** | Dev travou por spec ambígua? Um **Arquiteto one-shot** corrige a spec e re-despacha. Decisão de produto? **Escala pra você**, nunca inventa |
| **Integração contínua** | slot `done` vira merge `--no-ff` + validação de zoning + smoke cruzado + relatório, sozinho |
| **Crash-safe** | o estado vive no git; `Ctrl+C`, queda de energia, laptop dormindo: rode de novo e continua |
| **Anti-concorrência** | lockfile impede dois orquestradores no mesmo repo |

```bash
ai-team run --milestone=M1 --workers=4    # o loop inteiro, com dashboard ao vivo
ai-team run --dry-run                     # só o plano de despacho
```

## Segurança em 3 camadas (mecanismo, não promessa)

Cada worker headless roda **cercado**. A segurança não mora no prompt, mora no harness:

1. **Permissões geradas por slot**: o território declarado (`TERRITORY.txt`) vira
   allowlist do Claude Code. Editar fora dele **nem executa**. `git push`, `checkout`,
   `rm -rf` e rede: negados.
2. **Pre-commit de zoning**: commit fora do território é bloqueado na máquina.
3. **Validação no reconcile**: o diff de cada slot é re-auditado no merge e registrado
   em relatório pro review estrutural.

E os dois pontos que **nunca** são autônomos, por princípio: o **HTC** (você testa e
aprova cada milestone) e **decisões de produto** (o time pergunta, não chuta).

## Envie isso para o seu Claude e ele executa tudo

Abra o Claude Code numa **pasta vazia** (onde o projeto vai nascer), copie o bloco abaixo
e cole na conversa. O Claude prepara a máquina, instala o plugin e te entrega pronto
pra começar:

```text
Quero usar o plugin a360-dev-multiagentes (um time de IA que constrói software
de ponta a ponta). Faça o seguinte por mim, nesta ordem:

1. Confira os pré-requisitos e conserte o que faltar (me pedindo OK antes de
   instalar qualquer coisa): node 20+, corepack enable + pnpm 9+, git e gh
   (GitHub CLI). Confira também se git user.name/user.email estão configurados.

2. Instale o plugin rodando no terminal:
     claude plugin marketplace add kcleto-ai/a360-dev-multiagentes
     claude plugin install a360-dev-multiagentes@a360
   Se esses comandos não existirem na minha versão, me oriente a rodar
   /plugin marketplace add kcleto-ai/a360-dev-multiagentes e depois /plugin
   (menu visual) pra instalar e habilitar.

3. Quando estiver instalado, me diga exatamente isto: que eu digite
   /a360-dev-multiagentes pra começar, e que o CTO do time vai me guiar
   a partir dali (ele pergunta meu nível técnico e fala na minha língua).

Não crie nenhum arquivo de projeto agora. Só prepare o ambiente e o plugin.
```

## Instalação manual

No Claude Code (terminal ou app em modo Local):

```
/plugin marketplace add kcleto-ai/a360-dev-multiagentes
/plugin install a360-dev-multiagentes@a360
```

Depois, numa pasta vazia: **`/a360-dev-multiagentes`**. Deixa o CTO te guiar.

> Outras formas (1-clique pra não-técnicos, `--plugin-dir` pra dev) em
> **[INSTALL.md](./INSTALL.md)**. Pré-requisitos: Node 20+, pnpm 9+, git, `gh`. O
> próprio kickoff detecta o que falta e instala com você.

## Configuração (`.ai-team.json` do projeto)

```jsonc
{
  "version": 3,
  "smoke": ["pnpm", "-r", "--if-present", "typecheck"],  // gate de merge
  "neutralZones": ["packages/shared/**", "..."],          // só o Integrador toca
  "autonomous": {
    "maxWorkers": 4,        // squad: 2 front + 2 back (backoff automático p/ rate limit)
    "model": null,          // null = modelo default da sua conta
    "slotTimeoutMin": 45,   // estourou = slot mal decomposto
    "maxRetries": 2,        // re-despachos antes de escalar pra você
    "triage": true          // Arquiteto one-shot em slots bloqueados
  }
}
```

## O que vem dentro

```
agents/        cto · arquiteto · dev · integrador (os 4 papéis)
commands/      /a360-dev-multiagentes · /a360-vamos · /a360-deploy
skills/        ler-design-system · decompose-goal · write-design-spec ·
               orquestrar-build · review-before-merge · registrar-aprendizado ·
               scaffold-monorepo · deploy-vps
cli/           ai-team: o motor (scheduler, watchdog, triage, reconcile, zoning)
templates/
  monorepo/    arquitetura REAL de fábrica: Fastify modular + Next.js decomposto +
               packages (shared/core/db/adapter) + 8 ADRs + docs vivos. Compila e SOBE.
  docker/      Dockerfile.api/web · compose · Caddyfile (deploy)
references/    METODOLOGIA · STACK-DEFAULT · PARALLEL-PROTOCOL · AUTONOMOUS-MODE ·
               PITFALLS-LLM (pra produtos com agentes de IA)
```

## A metodologia em 60 segundos

1. **Slot** é a unidade de trabalho: BRIEF + DESIGN-SPEC (nomes/schemas exatos) +
   CONTRACT (smoke) + TERRITORY (zoning executável) + DEPENDS-ON (waves).
2. **Zoning rígido**: dois Devs nunca tocam o mesmo arquivo. Zona neutra (barrels,
   composição, contratos) é exclusiva do Integrador.
3. **Smoke é gate**: territorial pro Dev, cruzado e bloqueante no merge.
4. **HTC**: review verde não é "entregue". O dono testa e aprova, sempre.
5. **Ciclo de aprendizado**: todo erro corrigido vira regra registrada
   (`docs/LEARNINGS.md`). O time melhora a cada milestone, em vez de só não piorar.

Destilada de projetos reais: um SDR multi-tenant entregue em ~4 semanas e uma plataforma
com 6 milestones / 40+ slots, cujas lições (20 documentadas + 20 pitfalls de LLM) estão
embutidas como ADRs, receitas e guardas deste plugin.

## Provado, não prometido

O modo autônomo foi validado com E2E real: workers em paralelo, dependências respeitadas,
worker sabotado sendo re-despachado e escalado pelo watchdog, slot bloqueado por spec
ambígua sendo desbloqueado pela triage, merges automáticos com smoke verde e término
limpo. Os 3 bugs que o E2E encontrou foram corrigidos *antes* deste README existir.

## Licença

MIT. [KCG Group / Accelera360](https://github.com/Accelera360).

<div align="center">

**Feito para quem tem uma ideia, e um Claude.**

</div>
