# Stack Default v1

> **Fonte de verdade da stack opinionada que o CTO propõe automaticamente em todo projeto novo.**
> Board não decide tecnicamente — o CTO dita. Esse documento codifica o que ele dita.
>
> Atualizar este doc = mudar o que o time propõe pra todo novo projeto. Mudança aqui é decisão arquitetural com peso.

---

## Princípio

Time enxuto + público empresarial → CTO **não delega escolha técnica** pro Board. Propõe stack opinionada, justificada, pronta pra começar. Board confirma ou pede ajuste **com justificativa concreta** (regulação, integração obrigatória, time humano que vai manter).

"Eu prefiro Prisma" não é justificativa. "Nosso time atual já mantém um sistema em Prisma e vamos consolidar" é.

---

## Stack base (v1)

### Linguagem & Runtime

| Item | Default | Por quê |
|---|---|---|
| Linguagem | TypeScript estrito (`strict: true`, `noImplicitAny`) | Tipo é documentação + safety, obrigatório em equipe de IA |
| Runtime | Node.js 22 LTS | Última LTS, suporte longo |
| Package manager | pnpm 9+ | Mais rápido que npm/yarn, workspaces nativo |
| Estrutura | Monorepo (`apps/`, `packages/`) | Permite zoning natural pros Devs do time |
| Build orchestration | Sem Turborepo no MVP | Adicionar quando build > 30s ou pipeline crescer |

### Frontend

| Item | Default | Por quê |
|---|---|---|
| Framework | Next.js 15 App Router | App Router é o padrão; RSC reduz client bundle |
| CSS | Tailwind CSS 4 | Padrão da indústria, casa com shadcn |
| Componentes | shadcn/ui (Radix + Tailwind) | Copy-paste, sem lock-in de design system |
| Forms | react-hook-form + zodResolver | Performance + validação compartilhada com backend |
| State client | zustand | Mais simples que Redux, mais robusto que Context |
| State server | @tanstack/react-query | Cache + invalidation padrão da indústria |
| Icons | lucide-react | Casa com shadcn |
| Datas | date-fns + date-fns-tz | Mais leve que moment, tree-shakeable |

### Backend

| Item | Default | Por quê |
|---|---|---|
| Framework | Fastify | Mais leve que Express, melhor TS, plugin ecosystem |
| Auth | **Better Auth** | Mais flexível que NextAuth/Clerk, self-hostable, multi-tenant friendly |
| Validação | Zod everywhere | Schemas compartilhados front+back |
| Logs | pino (structured + redaction) | Performance, JSON nativo, redaction de dados sensíveis |
| Rate limit | @fastify/rate-limit | Plugin oficial, configura por rota |

### Banco & ORM

| Item | Default | Por quê |
|---|---|---|
| Banco | **PostgreSQL via Supabase** (managed) | Sem auto-host, RLS pronto, realtime opcional, auth integrado se quiser |
| ORM | Drizzle ORM | Mais leve que Prisma, sem codegen, melhor TS, queries SQL-like |
| Migrations | drizzle-kit | Casa com ORM, snapshot-based, sem schema separado |
| RLS | Ativado desde dia 1 | Multi-tenancy seguro, defense in depth |

### Comunicação externa

| Item | Default | Por quê |
|---|---|---|
| WhatsApp (Brasil) | Z-API | Decisão Brasil; rápido de integrar |
| WhatsApp (fora) | Twilio | Padrão internacional |
| SMS | Twilio | Mesmo provider |
| Email transacional | Resend | DX moderno, React Email native |
| Orquestração de integrações | Composio (opcional) | Quando há 5+ integrações de terceiros |

### AI / LLM

| Item | Default | Por quê |
|---|---|---|
| LLM provider | Anthropic Claude | SDK estável, prompt caching maduro |
| Modelo prod | Claude Sonnet 4.6+ | Custo/qualidade balanceado |
| Modelo dev | Claude Haiku 4.5+ | Rápido + barato pra iteração |
| Embeddings | OpenAI text-embedding-3-small | Anthropic não tem, mais barato que -large |
| SDK | `@anthropic-ai/sdk` direto | Sem necessidade de abstração (Vercel AI SDK) no MVP |

### Dev tooling

| Item | Default | Por quê |
|---|---|---|
| Lint + Format | Biome | Único tool, mais rápido que ESLint+Prettier |
| Testes unit/integration | Vitest | Mais rápido que Jest, melhor TS |
| Testes E2E | Playwright (opcional) | Quando há UI crítica; via QA Engineer extension |
| Pre-commit | husky + lint-staged | Padrão da indústria |
| CI | GitHub Actions | Padrão hosted |

### Deploy (v1 — Infra Agent decide a partir de v2)

| Camada | Default v1 | Por quê |
|---|---|---|
| Frontend | **Vercel** | Padrão Next.js, deploy automático, CDN global |
| Backend | **Railway** (default) ou **Fly.io** | Roda Fastify direito; Vercel serverless tem tradeoffs ruins pra long-running |
| Banco | Supabase (já managed) | Sem deploy próprio |
| Storage | Supabase Storage | Casa com banco |
| Secrets | Paperclip Secrets (prod) + `.env.local` (dev) | Source de verdade no Paperclip |

> **Futuro (Hostinger skill em desenvolvimento + Infra Agent extension):** quando a skill estiver pronta, o Infra Agent (extensão opcional) avalia caso-a-caso entre Vercel / Railway / Fly.io / Hostinger / outros. Pra v1, default acima.

---

## Padrões de arquitetura (obrigatórios)

> Estes padrões previnem código lixo conforme o projeto cresce. Não são opcionais — todo projeto adota desde dia 1.

### 1. Adapter pattern pra dependências externas trocáveis

**Quando aplicar:** toda dependência externa que tem >1 vendor real ou onde você pode querer trocar no futuro:

- **LLM** (Anthropic, OpenAI, futuro local)
- **CRM** (GoHighLevel, HubSpot, Pipedrive)
- **Message** (Z-API, Twilio, futuro Telegram)
- **Payment** (Stripe, MercadoPago, Pagar.me)
- **Calendar** (Google Calendar, Cal.com)
- **Storage** (Supabase Storage, S3, R2)
- **Email** (Resend, SendGrid, AWS SES)

**Estrutura canônica:**

```
packages/<dominio>/
├── src/
│   ├── types.ts                # interface <Dominio>Provider
│   ├── adapters/
│   │   ├── <vendor-a>.ts       # implementa o interface via SDK do vendor A
│   │   └── <vendor-b>.ts       # implementa o interface via SDK do vendor B
│   ├── errors.ts               # erros tipados do domínio
│   └── index.ts                # factory: create<Dominio>({ provider, ...opts })
```

**Exemplo (LLM):**

```typescript
// packages/llm/src/types.ts
export interface LLMProvider {
  generate(opts: GenerateOpts): Promise<GenerateResult>
  embed(opts: EmbedOpts): Promise<EmbedResult>
}

// packages/llm/src/adapters/anthropic.ts
export class AnthropicAdapter implements LLMProvider { /* ... */ }

// packages/llm/src/index.ts
export function createLLM(opts: { provider: 'anthropic' | 'openai', apiKey: string }): LLMProvider {
  switch (opts.provider) {
    case 'anthropic': return new AnthropicAdapter(opts)
    case 'openai': return new OpenAIAdapter(opts)
  }
}
```

**Regra:** código consumidor **NUNCA** importa SDK do vendor diretamente. Só importa o interface. Adicionar novo vendor = novo arquivo de adapter + 1 case no factory.

**NÃO faça adapter pra:**
- Logger (pino direto)
- Banco (Drizzle direto — schema mudaria pra trocar)
- Framework (Fastify direto)
- Coisas que você não vai trocar realmente

### 2. Stores como interface (persistência)

**Quando aplicar:** toda entidade persistível.

```
packages/<entidade>/
├── src/
│   ├── types.ts                # tipo do dado
│   ├── stores/
│   │   ├── memory.ts           # implementação em memória (dev/test)
│   │   └── supabase.ts         # implementação Supabase
│   └── index.ts                # factory: create<Entidade>Store({ kind })
```

**Por quê:** começa em memória (rápido de prototipar), migra pra Supabase sem mudar código consumidor. Testes rodam em memória sem mock.

### 3. Tools registry (pra agentes de IA)

**Quando aplicar:** projetos com agentes que executam tools.

```
packages/core/tools/
├── library/
│   ├── parse-datetime.ts       # 1 arquivo por tool
│   ├── smart-schedule.ts
│   └── ...
├── registry.ts                 # central export
└── types.ts                    # interface Tool
```

**Regra:** adicionar tool = criar arquivo + 1 linha no registry. Sem editar nada mais. Schema de input/output via Zod em cada tool.

### 4. Schemas Zod nas fronteiras

**Quando aplicar:** TODA fronteira do sistema.

- HTTP request body / query / params → `z.object(...)` antes do handler
- HTTP response → schema validado antes de retornar
- Message queue payload → schema na produção e consumo
- Prompt input/output do LLM → schema (especialmente output estruturado)
- Env vars → schema na boot do app

**Tipos derivam de schemas** via `z.infer<typeof Schema>`. Nunca o contrário.

### 5. Multi-tenancy desde dia 1 (se aplicável)

Toda entidade, query, evento e log carrega `workspaceId` + `clientId`. Sem exceção, mesmo em prototipo. Não existe "depois eu adapto pra multi-tenant" — adaptação é refactor enorme.

---

## Segurança baseline (startup, não enterprise)

12 controles obrigatórios. Não é a lista do CISO de banco — é o mínimo pra não tomar bola fora público.

### Dados & Secrets

1. **Secrets nunca em código.** `.env.local` em dev (gitignored), Paperclip Secrets em prod. Validar via Zod na boot.
2. **LGPD-aware logs.** Pino com `redact: ['*.cpf', '*.email', '*.phone', '*.password']` em produção. Logs em dev podem ser verbosos.
3. **RLS no Supabase ativado dia 1.** Mesmo em MVP. Defense in depth — não confie só no backend.

### Auth

4. **Better Auth com refresh tokens** (sessions assinadas, rotation configurada).
5. **Cookies seguros:** `httpOnly: true`, `secure: true` (prod), `sameSite: 'lax'` ou `'strict'`.
6. **CSRF tokens** em forms críticos (Better Auth tem suporte).

### Input & Boundary

7. **Validação Zod em TODA fronteira** (já no padrão de arquitetura — repetindo aqui porque é security-critical).
8. **LLM trust boundary:** input do usuário NUNCA vai direto em prompt sem escape. Use templates parametrizados, valide output do LLM via Zod.
9. **Rate limiting** em endpoints públicos (`@fastify/rate-limit`). Default 100 req/min/IP, ajustável por rota.

### Network & Deps

10. **HTTPS only** em produção (Vercel/Railway/Hostinger fazem por padrão).
11. **CORS whitelist explícita.** Sem `Access-Control-Allow-Origin: *` em prod. Apenas origens conhecidas.
12. **`pnpm audit` no CI.** Vulnerabilidades alta/crítica bloqueiam merge. Atualizar deps em ≤ 7 dias.

### O que NÃO está nessa lista (e está ok pra v1)

- WAF gerenciado
- DDoS protection custom (Vercel/Cloudflare já fazem)
- Pen test
- SOC2 / ISO 27001
- Encryption at rest customizado (Supabase já encrypta)
- HSM

Esses vêm quando o projeto crescer. Pra MVP, os 12 acima são o teto.

---

## Quando o CTO desvia do default

Board pode pedir outra stack. **CTO valida a justificativa** antes de aceitar:

| Justificativa | Aceitar? |
|---|---|
| "Time humano atual mantém X" | ✅ Sim — consistência com manutenção pós-AI |
| "Regulação exige Y" (ex: dados financeiros em provider auditado) | ✅ Sim — compliance é hard constraint |
| "Cliente já tem contrato com vendor Z" | ✅ Sim — economia real |
| "Integração obrigatória com sistema legacy em W" | ✅ Sim — escopo do projeto |
| "Eu prefiro Prisma" | ❌ Não — sem justificativa concreta |
| "Vi um tweet recomendando Bun" | ❌ Não — hype, não dado |
| "Vercel é mais fácil pra backend" | ❌ Não — incorreto pra Fastify long-running |

Se Board insiste sem justificativa concreta, CTO escala via `request_confirmation`:
> "Mudança proposta de [X] pra [Y]. Trade-offs: [lista]. Recomendação: manter [X]. Confirma override?"

Board confirma → CTO ajusta `EMPRESA.md` do projeto + procede. Não confirma → mantém default.

---

## Como o time consome esse documento

- **CTO** lê na `kickoff-project` quando vai propor invariantes iniciais. Stack proposta vem daqui.
- **Arquiteto** (guardião principal) lê na `write-design-spec` SEMPRE — toda DESIGN-SPEC valida contra este doc antes de finalizar (adapter pattern aplicado? Zod completo? Segurança baseline?). Quando uma decisão arquitetural emerge fora do que está aqui, Arquiteto cria ADR em `docs/ADRs/`.
- **Dev** consulta quando tem dúvida ("posso usar lodash?" → não, use Array nativo; "qual lib de form?" → react-hook-form).
- **Integrador** valida no review estrutural (Tier 1 — Architecture + Tier 7 — Dependencies) que mudanças respeitam os padrões e não introduziram dep fora.
- **Board** lê pra entender o que o CTO vai propor antes de aceitar.

Modificações neste doc são raras e requerem aprovação do **CTO + Arquiteto**. Quando acontecerem, registre o motivo em commit message (`docs(stack): change ORM from Drizzle to <X> — reason: ...`) e crie ADR correspondente em `docs/ADRs/`.
