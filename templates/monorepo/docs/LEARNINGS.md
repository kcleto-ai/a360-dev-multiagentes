# LEARNINGS — o que aprendemos com cada erro

> **Diário append-only.** Toda vez que algo quebra e a gente conserta, registra aqui — pra
> não repetir. A estrutura do time depende disso: **erro corrigido sem aprendizado registrado
> é meio-trabalho.** Não edite entradas antigas; só adicione novas no topo.

## Quando registrar (gatilhos — não pule nenhum)

- Um **smoke/teste falhou** e você consertou.
- Um **slot foi `blocked`** e foi desbloqueado.
- O **HTC foi reprovado** pela pessoa.
- Um **bug apareceu** (local ou em produção).
- O **reconcile deu conflito** que exigiu intervenção.

## Formato de cada entrada

```
## AAAA-MM-DD — <título curto>
- **Gatilho:** smoke falhou | slot blocked | HTC reprovado | bug | conflito
- **O que aconteceu:** <o sintoma, em 1-2 linhas>
- **Causa raiz:** <por que aconteceu de verdade — não o sintoma>
- **Correção:** <o que foi feito>
- **Regra pra não repetir:** <a mudança que impede recorrência> → onde virou regra:
  EMPRESA.md / CONTRACT do slot / DESIGN-SPEC / skill / este doc / TROUBLESHOOTING.md
```

> Se um aprendizado é **recorrente ou geral**, ele não pode ficar só aqui: promova pra uma
> **regra executável** (invariante no `EMPRESA.md`, um item no CONTRACT/DESIGN-SPEC, uma nota
> no `05-TROUBLESHOOTING.md`). Aqui é o diário; a regra é o que evita o erro de novo.

---

<!-- entradas novas vão aqui, mais recente no topo -->
