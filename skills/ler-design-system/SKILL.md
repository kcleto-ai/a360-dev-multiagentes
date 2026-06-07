---
name: ler-design-system
description: Lê o export do OpenDesign em docs/design/raw/ (HTML, PNG, PDF, tokens) e produz docs/design/DESIGN-OVERVIEW.md em 3 camadas — OBJETIVOS do produto, FLUXOS (a história do usuário) e TELAS/TOKENS — confirmadas com o fundador em linguagem leiga ANTES de qualquer slot existir. É o raciocínio-fonte que alimenta a decomposição (decompose-goal) e os contratos (write-design-spec). Use no início do /a360-vamos.
---

# ler-design-system

Transforma o que a pessoa exportou do OpenDesign em **raciocínio compartilhado**: o que o
sistema faz, pra quem, em que ordem — e só então o mapa visual. A regra de ouro: **o design
em `docs/design/raw/` é a fonte de verdade visual** — nada de inventar layout. E a segunda
regra, igualmente de ouro: **entendimento errado do fluxo custa um milestone inteiro** —
por isso a confirmação com o fundador acontece AQUI, em linguagem de gente, antes de
qualquer contrato/slot ser escrito.

## 1. Inventariar o raw/
```bash
ls -la docs/design/raw/
```
Vazio → pare e instrua: "coloque o export do OpenDesign em `docs/design/raw/` e rode de novo".

Identifique os formatos presentes e leia cada um com a ferramenta certa:
- **PNG/JPG** — `Read` (visualiza a imagem). Uma por tela, normalmente.
- **PDF** — `Read` com `pages` (ler em blocos). Telas + specs costumam estar aqui.
- **HTML/CSS** — `Read`. Extraia classes, cores, fontes, estrutura.
- **JSON de tokens** — `Read`. Cores, espaçamento, tipografia nomeados.

## 2. Raciocinar de cima pra baixo (objetivos → fluxos → telas)

Não comece pelos pixels. Olhando o conjunto das telas, **deduza a intenção**:

1. **Objetivos** — o que esse sistema existe pra fazer? Quem usa, e que resultado a pessoa
   leva? (Ex.: "captar leads do WhatsApp e agendar reunião sem humano no meio".) Se as
   telas sugerem objetivos conflitantes, isso é PERGUNTA, não escolha sua.
2. **Fluxos como história** — pra cada jornada: "a pessoa entra em A, vê X, faz Y, e
   consegue Z". O fluxo principal (o caminho que gera valor) vem primeiro; os
   secundários (admin, configuração, erro) depois.
3. **Domínios de dados** — de cada fluxo, extraia os substantivos que se repetem
   (cliente, agendamento, conversa...). Eles são os futuros **domínios** → DTOs →
   módulos → slots. Esta é a ponte design → arquitetura: o `decompose-goal` fissiona
   por domínio, e os domínios nascem AQUI.
4. **Telas** — só agora o inventário visual: componentes, estados, ações.

Se algo estiver ambíguo, **anote como pergunta** — não preencha com chute.

## 3. Produzir `docs/design/DESIGN-OVERVIEW.md`
```markdown
# DESIGN-OVERVIEW

## Objetivos do produto (deduzidos do design — confirmados pelo fundador em §4)
- <objetivo 1: quem usa + resultado que leva>
- Fora de escopo aparente: <o que o design NÃO mostra>

## Fluxos (a história)
1. **<fluxo principal>**: a pessoa entra em <tela A>, vê <X>, faz <Y> → consegue <Z>
   (telas: A → B → C)
2. <fluxos secundários...>

## Domínios de dados (a ponte pro Arquiteto)
| Domínio | Aparece nos fluxos | Telas que consomem | Vira (estimativa) |
|---|---|---|---|
| <cliente> | 1, 2 | A, C | DTO + módulo api + queries |

## Tokens
- Cores: primária `#...`, fundo `#...`, texto `#...`, sucesso/erro `#...`
- Tipografia: `<família>`, escalas (h1 .. body .. caption)
- Espaçamento: base `<n>px`, escala (4/8/12/16/24/32...)
- Estilo: cantos `<r>`, sombras `<...>`, densidade `<compacta|confortável>`

## Telas
### <nome-da-tela>  (ref: raw/<arquivo>)
- Propósito: ... | Componentes: ... | Estados: vazio/carregando/erro/ok | Ações → leva a: ...

## Perguntas em aberto
- <ambiguidades que precisam de resposta do fundador>
```

## 4. Confirmar com o fundador (GATE — no nível da pessoa)

Este é um gate, não uma cortesia. Calibre pelo **Perfil do fundador** no `EMPRESA.md`:
**leigo/curioso** → apresente **a história, nunca a arquitetura** (formato abaixo);
**dev** → pode mostrar também a tabela de domínios e discutir fluxos tecnicamente —
mas a confirmação dos OBJETIVOS continua obrigatória (dev também erra intenção).

> "Pelo seu design, entendi que o sistema serve pra **<objetivo em 1 frase>**.
> O caminho principal é: **a pessoa <entra/vê/faz/consegue>...**
> Também vi <fluxos secundários em 1 linha cada>.
> Tem 3 coisas que ficaram ambíguas: <perguntas, uma por vez>.
> Entendi certo? Algo importante que o design não mostra?"

Proibido neste diálogo: "DTO", "endpoint", "componente", "slot", "schema". Se o fundador
corrigir o entendimento, **corrija o OVERVIEW antes de seguir** — é mil vezes mais barato
aqui do que no HTC.

## Saída
- `docs/design/DESIGN-OVERVIEW.md` commitado (`docs(design): overview a partir do OpenDesign`).
- Objetivos + fluxos + domínios **confirmados pelo fundador** (registre a confirmação no
  topo do arquivo: "Confirmado pelo fundador em <data>").
- Insumo pronto: o `decompose-goal` fissiona pelos **Domínios de dados** daqui; cada
  DESIGN-SPEC de tela referencia `docs/design/raw/<arquivo>`.
