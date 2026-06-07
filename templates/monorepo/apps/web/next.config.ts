import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pacotes do workspace consumidos como fonte TS (sem build step)
  transpilePackages: ['@app/shared'],

  // Proxy do /api pro Fastify: mesma origem em dev (sem CORS no browser).
  // Em produção, o Caddy/reverse-proxy faz esse papel (ver templates/docker).
  async rewrites() {
    const apiUrl = process.env['API_URL'] ?? 'http://localhost:3001';
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
