---
name: registrar-aprendizado
description: Captura um aprendizado em docs/LEARNINGS.md sempre que algo quebra e é corrigido (smoke falhou, slot blocked, HTC reprovado, bug, conflito de reconcile) — e promove o aprendizado a regra executável quando for recorrente/geral. É o ciclo de aprendizado que a estrutura do time NUNCA rompe.
---

# registrar-aprendizado

A regra de ouro do time: **erro corrigido sem aprendizado registrado é meio-trabalho.** Este
é o passo que fecha o ciclo — e ele **não é opcional**. Roda toda vez que um gatilho dispara,
mesmo que um único agente esteja executando tudo.

## Gatilhos (obrigatório registrar)
- Smoke/teste falhou e foi consertado.
- Slot `blocked` desbloqueado (qualquer papel).
- HTC reprovado pela pessoa.
- Bug encontrado (local ou produção).
- Reconcile com conflito que exigiu intervenção.

## Como registrar
1. Abra `docs/LEARNINGS.md`. Adicione uma entrada **no topo** (append-only — não edite as antigas):
   ```
   ## AAAA-MM-DD — <título curto>
   - **Gatilho:** <um dos acima>
   - **O que aconteceu:** <sintoma>
   - **Causa raiz:** <o porquê real, não o sintoma>
   - **Correção:** <o que foi feito>
   - **Regra pra não repetir:** <mudança que impede recorrência> → onde virou regra
   ```
2. **Causa raiz, não sintoma.** "typecheck falhou" é sintoma; "store aceitava `undefined` mas
   o tipo não previa (exactOptionalPropertyTypes)" é causa.
3. **Promova quando for geral/recorrente.** Se o aprendizado vale pra futuros slots/projetos,
   transforme numa **regra executável** e diga onde:
   - vira invariante no `EMPRESA.md` (regra de produto/arquitetura),
   - vira item no `CONTRACT.md`/`DESIGN-SPEC.md` do tipo de slot,
   - vira receita no `docs/05-TROUBLESHOOTING.md`,
   - vira ajuste numa skill do time.
4. Commit junto com a correção: `docs(learn): <título>`.

## Onde isto se encaixa no fluxo
- **Dev**, ao desbloquear um slot → registra antes de marcar `done`.
- **Integrador**, ao resolver conflito de reconcile ou achar Critical no review → registra.
- **CTO/Integrador**, quando o HTC é reprovado → registra o gap + abre os `fix-<n>`.
- **Ao fechar o milestone** → reveja o `LEARNINGS.md`: algum aprendizado deveria ter virado
  regra e ainda não virou? Promova agora.

## Por que a estrutura nunca rompe
O método se degrada quando o time conserta e segue sem aprender — o mesmo erro volta no
próximo slot/projeto. Registrar + promover a regra é o que faz o time **melhorar** a cada
ciclo, em vez de só não-piorar. Sem este passo, perdemos o composto do aprendizado.
