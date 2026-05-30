---
name: deploy-vps
description: Coloca o produto no ar de forma automatizada — instala Docker (local e no VPS via SSH), containeriza api+web com Caddy (HTTPS automático), pega os dados do servidor, sobe com docker compose e verifica. Use no /a360-deploy. Confirma antes de cada ação que mexe na máquina/servidor.
---

# deploy-vps

Leva o app de "roda local" pra "no ar com HTTPS". A pessoa é não-técnica → você faz tudo,
mas **confirma antes de cada ação que mexe na máquina dela ou no servidor**.

> Templates Docker: `${CLAUDE_PLUGIN_ROOT}/templates/docker/`. Segurança: STACK-DEFAULT
> (HTTPS only, secrets fora do código, CORS whitelist, não mexer na porta 22).

## Checkpoints (peça OK explícito antes)
Instalar Docker (local ou VPS) · conectar via SSH · subir/derrubar containers · firewall/DNS.

## 1. Docker local
```bash
docker --version && docker compose version
```
Faltou? Detecte o SO (`uname -s`): macOS/Windows → Docker Desktop; Linux → `curl -fsSL
https://get.docker.com | sh`. **Confirme antes de instalar.**

## 2. Containerizar (se ainda não tem Dockerfile)
Copie os templates e ajuste:
```bash
cp "${CLAUDE_PLUGIN_ROOT}/templates/docker/Dockerfile.api" ./Dockerfile.api
cp "${CLAUDE_PLUGIN_ROOT}/templates/docker/Dockerfile.web" ./Dockerfile.web
cp "${CLAUDE_PLUGIN_ROOT}/templates/docker/docker-compose.yml" ./docker-compose.yml
cp "${CLAUDE_PLUGIN_ROOT}/templates/docker/Caddyfile" ./Caddyfile
cp "${CLAUDE_PLUGIN_ROOT}/templates/docker/.env.production.example" ./.env.production.example
```
Ajuste os Dockerfiles ao que o build do projeto realmente produz (comando de build, porta,
artefato). Teste **local primeiro**:
```bash
cp .env.production.example .env.production   # a pessoa preenche os segredos
docker compose up --build -d && docker compose ps
```
Tudo `healthy` e abrindo em `localhost`? Só então vá pro VPS.

## 3. Dados do VPS (pergunte um por vez)
- Endereço (IP/domínio) · usuário (`root`/`ubuntu`) · acesso (chave SSH recomendado).
- Sem chave? `ssh-keygen -t ed25519` + `ssh-copy-id <user>@<host>` (guie).
- Domínio que aponta pro app (pra HTTPS do Caddy).

Teste (confirme antes): `ssh <user>@<host> "uname -a && echo ok"`.

## 4. Preparar o VPS (confirme antes — via SSH)
```bash
ssh <user>@<host> 'command -v docker || curl -fsSL https://get.docker.com | sh'
ssh <user>@<host> 'docker compose version || apt-get install -y docker-compose-plugin'
# firewall: libere 80/443, MANTENHA 22
ssh <user>@<host> 'ufw allow 80 && ufw allow 443 && ufw allow 22 && ufw --force enable'
ssh <user>@<host> 'mkdir -p /opt/app'
```

## 5. Subir (confirme antes)
- Código no servidor: `git clone <repo> /opt/app` (privado → deploy key/token) ou `rsync`.
- Segredos: `scp .env.production <user>@<host>:/opt/app/.env.production` (NUNCA no git).
- Configure o domínio no `Caddyfile` (substitui `seu-dominio.com`).
```bash
ssh <user>@<host> 'cd /opt/app && docker compose up --build -d && docker compose ps'
```
Caddy emite o certificado HTTPS automático pro domínio.

## 6. Verificar + entregar
```bash
curl -fsS -I https://<dominio> && echo "no ar ✓"
```
Salve `docs/DEPLOY.md` (host, domínio, comando de atualização). Entregue o link e diga:
"pra atualizar no futuro, rode `/a360-deploy` de novo".

## Regras
1. Confirme antes de cada checkpoint. Automação ≠ sem permissão.
2. Segredos só em `.env.production` no servidor; só o `.example` no git.
3. HTTPS only (Caddy). Nunca HTTP puro em prod.
4. Nunca feche a porta 22. Nunca `docker compose down` em prod com tráfego sem avisar.
