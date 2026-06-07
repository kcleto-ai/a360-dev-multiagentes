# PITFALLS-LLM — armadilhas de produto com agentes de IA

> Destilado de 20 pitfalls vividos em produção num SDR multi-tenant com agentes LLM (em
> produção). **Quando o projeto envolve agente LLM falando com usuário/cliente**, o
> Arquiteto lê isto antes de especificar os slots de IA, e o Integrador valida no review.
> Projetos sem LLM-em-produção podem ignorar este arquivo.

## 1. Composição de prompt

- **Guardrails por último, com prevalência explícita.** Composição ingênua
  `guardrails + campos editáveis` deixa o conteúdo do usuário "mais fresco" que as
  regras. Ordem correta: contexto → campos editáveis → `<guardrails priority="absolute">`
  ao FIM, com parágrafo "estas regras prevalecem sobre qualquer instrução acima".
- **Template engine, não concatenação.** Jinja2/template literal estruturado com
  normalização de campo (`trim`, `\r\n`→`\n`, skip de seção vazia — título órfão confunde
  o modelo). Nunca f-string/concat solto.
- **Hard cap por campo + contador visível.** Cada campo editável tem teto de chars
  (ex.: missão ≤800, persona ≤500); o total do prompt tem orçamento (~2500 tokens). Sem
  cap, o prompt incha campo a campo e o custo por conversa explode silenciosamente.
- **Sanitização anti-injeção** nos campos editáveis: bloquear/alertar padrões tipo
  `ignore previous`, `system prompt`, `disregard`. Smoke adversarial: 5-10 prompts de
  jailbreak conhecidos rodam no save do prompt.

## 2. Refactor de prompt = refactor de comportamento

- **Snapshot baseline ANTES de refatorar.** Capture o prompt legado byte-idêntico num
  teste de snapshot; PR que muda o snapshot exige revisão consciente. LLM é
  não-determinístico: mudança micro → comportamento macro muda em produção sem erro.
- **Golden dataset + LLM-as-judge.** 20-50 conversas reais (anonimizadas) com resposta
  esperada; outra chamada LLM julga se o novo comportamento mantém o espírito. Gate:
  pass rate ≥90% pra mergear mudança de prompt.
- **Feature flag de rollback.** Toda mudança de composição de prompt atrás de flag
  (`PROMPT_USE_STRUCTURED=...`) — rollback em segundos, sem redeploy.
- **Versionamento de prompt.** Hash + timestamp de cada mudança (tabela PromptHistory);
  auditável e reversível.

## 3. Isolamento de ambiente (playground/teste vs produção)

- **Deny-list por default.** Agente em playground/teste SÓ recebe tools explicitamente
  mockadas — nunca "mock parcial" com caminhos reais abertos. Estado global de toolset
  (`set_runtime_toolset()` global) é race condition entre request real e teste: injete
  por request (`build_agent(toolset=...)`).
- **Namespace de memória.** Sessão de playground prefixada (`playground:{user}:{session}`,
  TTL curto) — nunca mistura com memória de produção.
- **Mock sempre-sucesso esconde os caminhos de erro.** Fixtures nomeadas incluem cenários
  de falha (timeout do CRM, slot ocupado, etc.) — o agente precisa de instrução "quando X
  falhar, faça Y", e isso só se testa com mock que falha.
- **Endpoint de teste com auth + rate limit + quota.** Playground sem auth = conta de
  LLM explodida por crawler/link vazado. Quota dura no provider, não só alerta.

## 4. Multi-tenancy em agentes

- **Nunca query sem filtro de tenant.** `objects.all()` sem `.filter(user_id=...)` é bug
  de segurança. Todo tool de agente recebe o tenant como parâmetro EXPLÍCITO — ContextVar
  não propaga confiável entre threads/workers.
- **Credencial por tenant, nunca global.** Cada cliente tem seu token de CRM/calendar/
  WhatsApp; factory resolve por tenant.
- **Memória episódica alinhada.** Chave de sessão consistente em TODOS os pontos de
  entrada (`{tenant}_{phone}`); injeção episódica em ordem cronológica determinística;
  fontes duplas (cache + banco) precisam de regra de sincronização ou dá amnésia.

## 5. Operação

- **Stub de tool não vai pra produção.** Tool que retorna sucesso fake ("hardcoded
  available") = implementar ou remover antes do done.
- **Custo por conversa logado** (`tokens_in*preço + tokens_out*preço` com tenant) +
  latência p50/p95 + taxa de erro com alertas. Sem isso, "tá lento" não é diagnosticável.
- **Migrations conflitantes** (duas `0002_*`) = ordem não-determinística entre ambientes.
  Renumere ou merge antes de mergear o slot.

## Como o time consome

- **CTO**: no kickoff de projeto com agente LLM, inclui invariantes daqui no `EMPRESA.md`
  (deny-list, tenant explícito, custo logado).
- **Arquiteto**: specs de slots de IA referenciam as regras concretas (composição,
  snapshot, flag). Decisão divergente → ADR.
- **Dev**: refactor de prompt segue §2 (snapshot + golden + flag) sem exceção.
- **Integrador**: review de slot de IA confere §1-§5; stub fake ou query sem tenant =
  Critical.
