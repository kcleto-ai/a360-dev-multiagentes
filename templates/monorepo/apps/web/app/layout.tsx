// Layout raiz — providers globais. ZONA NEUTRA: só o Integrador altera.
// Provider novo (ex.: ToastProvider) entra AQUI via Integrador, nunca via slot.
// Tela standalone que precisa de provider próprio monta ele localmente
// (lição projeto-origem / LEARNINGS 1.6) — não mexe neste arquivo.

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '@/lib/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'App',
  description: 'Scaffold do a360-dev-multiagentes',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
