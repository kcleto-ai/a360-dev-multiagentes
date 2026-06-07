'use client';

// Orquestrador client da rota raiz — o exemplo canônico da decomposição (ADR 006).
// Teto: ~300 linhas. Cresceu além disso? Extraia componentes pra ./components/.
// Dados: SEMPRE via hooks de lib/queries/<dominio> (React Query) — nunca fetch solto,
// nunca server-state em useState.

import { Card } from '@/components/ui';
import { useHealth } from '@/lib/queries';
import { HealthCard } from './components/health-card';

export function HomeClient() {
  const health = useHealth();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Scaffold no ar 🚀</h1>
      <p className="text-center text-sm text-muted-foreground">
        Monorepo montado pelo time de IA (a360-dev-multiagentes). Este card consome a API
        Fastify via React Query — o fluxo front → back já funciona de ponta a ponta.
      </p>

      <HealthCard
        loading={health.isPending}
        error={health.isError ? 'API fora do ar — rode pnpm dev:api' : null}
        data={health.data ?? null}
      />

      <Card className="text-sm text-muted-foreground">
        Próximo passo: coloque o export do OpenDesign em <code>docs/design/raw/</code> e
        rode <strong>/a360-vamos</strong>.
      </Card>
    </main>
  );
}
