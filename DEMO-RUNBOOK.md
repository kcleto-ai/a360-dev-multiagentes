# DEMO-RUNBOOK — multi-agente ao vivo

Roteiro pra mostrar pra galera "como fazemos desenvolvimento usando multi-agente". Tempo
alvo: **20-30 min**. A estrela é a **Fase 2** (vários Claudes construindo em paralelo em
worktrees). Ensaie a Fase 2 antes — é o momento "uau".

## Antes (setup — faça na véspera)

- [ ] Plugin instalado no Claude Code (comandos `/a360-*` aparecem).
- [ ] Máquina com Node 20+, pnpm 9+ (`corepack enable`), git, `gh auth status` logado.
- [ ] `docker` + `docker compose` instalados (pra Fase 3). Docker Desktop aberto.
- [ ] Um **export do OpenDesign** já pronto numa pasta (3-4 telas claras em PNG/PDF).
      Tenha à mão pra copiar pra `docs/design/raw/` na hora.
- [ ] (Opcional, recomendado) Um **VPS de teste** com IP + acesso SSH pra Fase 3 real.
      Se não tiver, faça a Fase 3 só local (containers em `localhost`) e narre o resto.
- [ ] Terminal com fonte grande. 3 abas/janelas prontas pra os workers (Fase 2, Modo A).
- [ ] Ensaiou a Fase 2 uma vez ponta a ponta (start → workers → reconcile verde).

## Roteiro

### Abertura (2 min)
"Vou mostrar um time de IA construindo um produto do zero ao ar — sem eu escrever código.
Quatro papéis: CTO, Arquiteto, Dev, Integrador. O pulo do gato é que vários Devs trabalham
**em paralelo**, cada um numa cópia isolada do projeto, e a gente junta no fim sem conflito."

### Fase 1 — Kickoff + Scaffold (5 min)
```
/a360-dev-multiagentes  quero um painel de gestão de leads com WhatsApp pra uma clínica
```
Mostre: ele faz 2-3 perguntas de negócio, propõe a stack em português, confirma os
invariantes, **monta o monorepo, roda `pnpm -r typecheck` verde, cria o repo no GitHub** e
pede o design. Aponte na tela: "olha — `docs/design/raw/` esperando o OpenDesign, e o motor
multi-agente já embutido em `tools/ai-team`".

### Intervalo de design (1 min)
Copie o export do OpenDesign pra `docs/design/raw/`:
```bash
cp ~/demo-design/*.png docs/design/raw/
```
"Pronto, coloquei o design que fizemos no OpenDesign."

### Fase 2 — Construir em paralelo ⭐ (10-12 min)
```
/a360-vamos
```
- Ele **lê o design** e te diz o que entendeu ("vi 4 telas: ..."). Confirme.
- O Arquiteto **quebra em slots** (frontend, backend, dados) com DESIGN-SPEC. Mostre um
  `specs/slots/M1/<slot>/DESIGN-SPEC.md` — "esse é o contrato que cada Dev segue à risca".
- **Escolha o Modo A (paralelo ao vivo).** Pra cada slot:
  ```bash
  pnpm ai-team start --slot=<id> --worker=worker-A --milestone=M1
  ```
  Abra um terminal por worker, `cd .worktrees/worker-A && claude`, cole o prompt. Faça 2-3
  workers em janelas lado a lado. **Esse é o money shot**: 3 Claudes construindo ao mesmo tempo.
- No meio, rode o dashboard ao vivo:
  ```bash
  pnpm ai-team status --milestone=M1
  ```
- Quando marcarem `done`, integre:
  ```bash
  git checkout main && pnpm ai-team reconcile
  ```
  Mostre: merge `--no-ff`, smoke verde, worktrees limpas. "Juntou tudo sem conflito porque
  cada um tinha seu território e seguiu a mesma spec."
- `pnpm dev` → mostre a tela rodando.

> Plano B se algo travar ao vivo: troque pro **Modo B (automático)** no `/a360-vamos` — o
> orquestrador faz os slots sozinho, um a um. Menos terminais, zero risco de palco.

### Fase 3 — Deploy (5 min)
```
/a360-deploy
```
- Mostre os checkpoints de confirmação ("ele pede OK antes de mexer no servidor").
- Containeriza, sobe local (`docker compose ps` healthy), e — se tiver VPS — sobe no
  servidor com HTTPS automático (Caddy). `curl -I https://<dominio>`.
- "Da ideia ao ar, e a pessoa não escreveu uma linha de código."

### Fechamento (2 min)
"Três comandos: `/a360-dev-multiagentes`, `/a360-vamos`, `/a360-deploy`. Por baixo, o mesmo
método que usamos de verdade — worktrees, zoning, spec-driven. Empacotado pra qualquer um rodar."

## Perguntas que vão fazer (respostas curtas)
- **"E se dois Devs mexem no mesmo arquivo?"** Não mexem — zoning rígido, território disjunto.
  Zona compartilhada (re-exports/config) só o Integrador toca.
- **"E se a IA inventa um nome diferente?"** A DESIGN-SPEC fixa os nomes/schemas. Quem diverge
  é pego no review (Tier 1) e o slot volta pra correção.
- **"Roda em qualquer projeto?"** Sim — o CLI detecta a raiz via git e o smoke é configurável
  (`.ai-team.json`).
- **"É o mesmo do Paperclip?"** Mesma metodologia; este é o alvo Claude Code local, o outro
  (`.a-nova-economia`) é o alvo Paperclip.
