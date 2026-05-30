---
name: ler-design-system
description: Lê o export do OpenDesign em docs/design/raw/ (HTML, PNG, PDF, tokens), extrai telas/componentes/paleta/tipografia/fluxos e produz docs/design/DESIGN-OVERVIEW.md — o mapa que o Arquiteto usa pra escrever DESIGN-SPECs fiéis. Use no início do /a360-vamos.
---

# ler-design-system

Transforma o que a pessoa exportou do OpenDesign numa **referência navegável** que o time
usa pra construir telas fiéis. A regra de ouro: **o design em `docs/design/raw/` é a fonte
de verdade visual** — nada de inventar layout.

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

## 2. Extrair (sem inventar)
Pra cada tela: nome, propósito, hierarquia visual, componentes, estados (vazio, carregando,
erro), e ações. Pro sistema: paleta (hex), tipografia (família, escalas), espaçamento
(grid/escala), tom (cantos, sombras, densidade), e os fluxos de usuário (qual tela leva a qual).

Se algo estiver ambíguo no design, **anote como pergunta** — não preencha com chute.

## 3. Produzir `docs/design/DESIGN-OVERVIEW.md`
```markdown
# DESIGN-OVERVIEW

## Tokens
- Cores: primária `#...`, fundo `#...`, texto `#...`, sucesso/erro `#...`
- Tipografia: `<família>`, escalas (h1 .. body .. caption)
- Espaçamento: base `<n>px`, escala (4/8/12/16/24/32...)
- Estilo: cantos `<r>`, sombras `<...>`, densidade `<compacta|confortável>`

## Telas
### <nome-da-tela>  (ref: raw/<arquivo>)
- Propósito: ...
- Componentes: ...
- Estados: ...
- Ações → leva a: <outra tela>

## Fluxos
1. <fluxo principal>: tela A → B → C

## Perguntas em aberto
- <ambiguidades que precisam de resposta do fundador>
```

## 4. Confirmar com o fundador (linguagem dele)
Resuma: "Vi N telas: <lista>. O fluxo principal é <...>. Vou construir nesta ordem: <...>.
Confere?" Ajuste conforme a resposta. As **Perguntas em aberto** são resolvidas aqui.

## Saída
- `docs/design/DESIGN-OVERVIEW.md` commitado (`docs(design): overview a partir do OpenDesign`).
- Entendimento confirmado com o fundador.
- Insumo pronto pro Arquiteto: cada DESIGN-SPEC de tela referencia `docs/design/raw/<arquivo>`.
