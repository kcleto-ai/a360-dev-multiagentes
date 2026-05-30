---
description: Coloca o produto no ar — instala Docker (local e no VPS), pega os dados do servidor da pessoa, e sobe a aplicação com docker compose via SSH. Automatizado, com checkpoints de confirmação. Use depois que o app roda local.
argument-hint: "[opcional: dados do VPS]"
---

# /a360-deploy — Do local pro ar (Docker + VPS)

A pessoa não sabe o que é Docker, SSH ou containers. Você faz **tudo por ela**, mas
**confirma antes de cada ação que mexe na máquina dela ou no servidor** (instalar
software, conectar via SSH, subir containers). Automação real — não só instruções.

> Use a skill **`deploy-vps`** pra os detalhes de cada passo. Fonte de stack/segurança:
> `references/STACK-DEFAULT.md` (HTTPS only, secrets fora do código, CORS whitelist).

## Checkpoints (sempre confirme antes)

Estas ações são difíceis de desfazer ou mexem em algo externo — **peça OK explícito**:
- Instalar Docker na máquina local.
- Conectar via SSH no VPS da pessoa.
- Instalar Docker/pacotes no VPS.
- Subir/derrubar containers em produção.
- Apontar DNS / abrir portas / configurar firewall.

## Fluxo

### 1. Pré-requisitos locais
```bash
docker --version           # se faltar → instale (confirme): Docker Desktop (mac/win) ou engine (linux)
docker compose version
```
Detecte o SO (`uname`) e dê o caminho certo de instalação. No mac/win, Docker Desktop;
no Linux, `docker` + `docker compose plugin`. **Confirme antes de instalar.**

### 2. Containerizar o app (se ainda não tem)
Se o projeto não tem Docker ainda, a skill `deploy-vps` gera, a partir dos templates do
plugin (`templates/docker/`):
- `Dockerfile.api`, `Dockerfile.web` (multi-stage, Node 22 slim)
- `docker-compose.yml` (api + web + reverse proxy Caddy com HTTPS automático)
- `.env.production.example` (a pessoa preenche os segredos)

Teste local primeiro:
```bash
docker compose up --build -d
docker compose ps          # tudo "healthy"?
```
Mostre pra pessoa rodando em `localhost`. Só vá pro VPS depois que subir local.

### 3. Dados do VPS
Pergunte (uma por vez, linguagem simples):
- **IP ou domínio do servidor** ("o endereço do seu servidor, tipo 203.0.113.10")
- **Usuário** (geralmente `root` ou `ubuntu`)
- **Como acessa** — chave SSH (recomendado) ou senha. Se não tem chave, gere uma
  (`ssh-keygen`) e ajude a instalar no servidor (`ssh-copy-id`).
- **Domínio** que vai apontar pro app (pra HTTPS automático), se houver.

Teste a conexão (confirme antes):
```bash
ssh <user>@<host> "echo ok && uname -a"
```

### 4. Preparar o VPS (confirme antes)
Via SSH, instale Docker no servidor se faltar (script oficial `get.docker.com`),
configure o firewall (libere 80/443, mantenha 22), crie a pasta do app.

### 5. Subir (confirme antes)
- Envie o projeto (git clone do repo no servidor, ou `rsync` do build).
- Copie `.env.production` (com os segredos — **nunca commitados**).
- `docker compose -f docker-compose.yml up --build -d` no servidor.
- Caddy resolve HTTPS automático pro domínio.
- Verifique: `docker compose ps`, `curl -I https://<dominio>`.

### 6. Verificação final + entrega
```bash
curl -fsS https://<dominio>/health || echo "checar logs: docker compose logs"
```
Mostre o app no ar. Entregue:
> ✅ Seu produto está no ar: `https://<dominio>`
> Pra atualizar no futuro: rode `/a360-deploy` de novo (eu faço o resto).

Salve um `docs/DEPLOY.md` com host, domínio, e o comando de atualização — pra próxima vez.

## Regras invioláveis

1. **Confirme antes** de cada ação dos checkpoints. Automação real ≠ sem permissão.
2. **Segredos nunca no git.** `.env.production` no servidor; `.env.production.example` no repo.
3. **HTTPS only** em produção (Caddy faz). Nunca exponha o app em HTTP puro.
4. **Não derrube prod sem avisar.** `docker compose down` em servidor com tráfego = confirme.
5. **Não toque na porta 22** ao configurar firewall — não se tranque pra fora.
6. **Registre tudo** em `docs/DEPLOY.md` pra a próxima atualização ser 1 comando.
