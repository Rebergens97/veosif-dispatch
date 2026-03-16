# Fleetbase - Guide Deplwaman Digital Ocean (SaaS)

> Gid konplè pou deplwaye Fleetbase kòm SaaS sou Digital Ocean ak yon domèn reyèl ak GitHub CI/CD.

---

## Achitekti Final

```
Internet (HTTPS)
     │
     ▼
Nginx (SSL/TLS - Let's Encrypt)
     ├── yourdomain.com        → Docker: console  (port 4200)
     ├── api.yourdomain.com    → Docker: httpd    (port 8000) → application (8000)
     └── socket.yourdomain.com → Docker: socket   (port 38000)

Docker Services:
  ├── application  (Laravel 10 + FrankenPHP/Octane)
  ├── scheduler    (Laravel Cron via go-crond)
  ├── queue        (Laravel Queue Worker)
  ├── console      (Ember.js SPA - Nginx)
  ├── socket       (SocketCluster v17)
  └── httpd        (Nginx Reverse Proxy → application)

Managed Services (Digital Ocean):
  ├── DO Managed MySQL 8.0
  └── DO Managed Redis 6+
  └── DO Spaces (S3 storage - opsyonèl)
```

---

## PRE-REQUI (Sa ou bezwen)

- [ ] Yon kont [Digital Ocean](https://digitalocean.com)
- [ ] Yon domèn (eks: yourdomain.com) - achte nan Namecheap, GoDaddy, etc.
- [ ] Yon kont GitHub
- [ ] Git enstale sou machin lokal ou
- [ ] Kle SSH sou machin lokal ou

---

## FAZA 1 — GitHub Setup

### 1.1 Kreye yon GitHub Personal Access Token (PAT)

1. Ale: GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Klike "Generate new token (classic)"
3. Bay non: `fleetbase-deploy`
4. Chwazi pèmisyon: `repo` (tout) + `workflow`
5. Kopye token la — ou pap wè l ankò!

### 1.2 Push Pwojè a sou GitHub

```bash
# Sou machin lokal ou:
cd "/path/to/fleetbase-main 2"

# Inisyalize git
git init
git add .
git commit -m "Initial commit: Fleetbase SaaS setup"

# Kreye repo sou GitHub epi push
git remote add origin https://github.com/TON_USERNAME/fleetbase.git
git branch -M main
git push -u origin main
```

### 1.3 Konfigire GitHub Secrets

Ale: GitHub Repo → Settings → Secrets and Variables → Actions → New repository secret

| Secret Name | Valè | Deskripsyon |
|-------------|------|-------------|
| `DO_HOST` | `123.456.789.0` | IP Droplet ou |
| `DO_USERNAME` | `fleetbase` | Non itilizatè SSH |
| `DO_SSH_KEY` | `-----BEGIN OPENSSH...` | Kle SSH PRIVE ou (pou GitHub → Droplet) |
| `GH_PAT` | `ghp_xxxx...` | GitHub Personal Access Token (pou submodules) |
| `API_HOST` | `https://api.yourdomain.com` | URL API Backend |
| `SOCKETCLUSTER_HOST` | `socket.yourdomain.com` | Host WebSocket |
| `DOMAIN` | `yourdomain.com` | Domèn ou |

---

## FAZA 2 — Digital Ocean Setup

### 2.1 Kreye Managed MySQL

1. Digital Ocean → Databases → Create Database
2. Chwazi: **MySQL 8** | Region: New York 3 | Plan: Basic ($15/mo)
3. Kreye yon nouvo database: `fleetbase`
4. Kreye yon nouvo itilizatè: `fleetbase` + modpas solid
5. **Kopye**: Host, Port (25060), Password

### 2.2 Kreye Managed Redis

1. Digital Ocean → Databases → Create Database
2. Chwazi: **Redis 7** | Region: New York 3 | Plan: Basic ($15/mo)
3. **Kopye**: Host, Port (25061), Password

### 2.3 Kreye DO Spaces (opsyonèl - pou fichye)

1. Digital Ocean → Spaces → Create Space
2. Chwazi region: New York 3 (nyc3)
3. Bay non: `fleetbase-storage`
4. Kreye Access Key: Spaces → Manage Keys → Generate New Key
5. **Kopye**: Key ID, Secret, Bucket name

### 2.4 Kreye Droplet

1. Digital Ocean → Droplets → Create Droplet
2. **Konfigirasyon**:
   - Image: **Ubuntu 22.04 LTS**
   - Plan: **Basic** → **Regular** → **$24/mo** (4GB RAM / 2 vCPU / 80GB SSD)
   - Region: **New York 3** (menm ak databases yo)
   - Authentication: SSH Key (ajoute kle SSH piblik ou)
   - Hostname: `fleetbase-production`
3. Klike **Create Droplet**
4. **Kopye IP adrès** la

---

## FAZA 3 — Konfigire DNS

Nan DNS manager domèn ou a (oubyen Digital Ocean DNS):

| Enrejisteman | Tip | Valè | TTL |
|--------------|-----|------|-----|
| `@` | A | IP Droplet | 3600 |
| `www` | A | IP Droplet | 3600 |
| `api` | A | IP Droplet | 3600 |
| `socket` | A | IP Droplet | 3600 |

> Tann 5-30 minit pou DNS yo pwopaje. Verifye ak: `ping yourdomain.com`

---

## FAZA 4 — Setup Droplet la

### 4.1 Konekte SSH sou Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### 4.2 Kouri Script Setup la

```bash
# Telechaje ak kouri setup script
curl -o setup.sh https://raw.githubusercontent.com/TON_USERNAME/fleetbase/main/scripts/setup-droplet.sh
bash setup.sh
```

Oubyen si ou deja clone pwojè a:
```bash
bash /opt/fleetbase/scripts/setup-droplet.sh
```

### 4.3 Ajoute Kle SSH GitHub Actions

```bash
# Jenere yon nouvo kle SSH ESPESYALMAN pou GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy -N ""

# Montre kle piblik la → kopye nan Droplet
cat ~/.ssh/github_deploy.pub

# Ajoute kle piblik la nan Droplet (kouri sou Droplet)
echo "PASTE_PUBLIC_KEY_HERE" >> /home/fleetbase/.ssh/authorized_keys
chmod 600 /home/fleetbase/.ssh/authorized_keys

# Kle PRIVE a (github_deploy) → kopye nan GitHub Secret "DO_SSH_KEY"
cat ~/.ssh/github_deploy
```

### 4.4 Clone Pwojè a sou Droplet

```bash
su - fleetbase
git clone --recurse-submodules https://github.com/TON_USERNAME/fleetbase.git /opt/fleetbase
cd /opt/fleetbase
```

---

## FAZA 5 — Konfigire Fichye .env

```bash
cd /opt/fleetbase

# Edite .env la — ranpli TOUT valè yo
nano api/.env
```

Chanje valè sa yo:
```bash
APP_KEY=                         # php artisan key:generate --show
APP_URL=https://api.yourdomain.com
DB_HOST=YOUR_DO_MYSQL_HOST
DB_PASSWORD=YOUR_DB_PASSWORD
REDIS_HOST=YOUR_DO_REDIS_HOST
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
CONSOLE_HOST=https://yourdomain.com
SESSION_DOMAIN=.yourdomain.com
SOCKETCLUSTER_HOST=socket.yourdomain.com
```

> Pou jenere APP_KEY: `docker run --rm php:8.2-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"`

---

## FAZA 6 — Setup Nginx + SSL

```bash
# Asire DNS yo pwopaje avan!
bash /opt/fleetbase/scripts/setup-nginx.sh yourdomain.com admin@yourdomain.com
```

---

## FAZA 7 — Premye Deplwaman

```bash
# Premye fwa sèlman (konfigure tout)
bash /opt/fleetbase/scripts/deploy.sh --first-time
```

---

## FAZA 8 — Konfigire GitHub Actions

Apre sa, chak `git push origin main` pral:
1. Build Frontend Ember.js
2. SSH sou Droplet la
3. Pull dènye kòd la
4. Rebuild Docker images
5. Kouri migrations
6. Redeplwaye tout sèvis yo

---

## Deplwaman Manyèl (san GitHub Actions)

```bash
ssh fleetbase@YOUR_DROPLET_IP
cd /opt/fleetbase
bash scripts/deploy.sh
```

---

## Verifikasyon

```bash
# Tcheke sèvis yo kouri
docker compose -f docker-compose.yml -f docker-compose.production.yml ps

# Tcheke logs
docker compose logs -f application
docker compose logs -f queue
docker compose logs -f console

# Teste API
curl https://api.yourdomain.com/health

# Teste WebSocket
curl https://socket.yourdomain.com
```

---

## Fichye Enpòtan

| Fichye | Wòl |
|--------|-----|
| `api/.env` | Konfigirasyon backend pwodiksyon |
| `docker-compose.yml` | Sèvis Docker debaz |
| `docker-compose.production.yml` | Override pwodiksyon (DO) |
| `scripts/setup-droplet.sh` | Enstale sèvè a |
| `scripts/setup-nginx.sh` | Konfigire Nginx + SSL |
| `scripts/deploy.sh` | Kouri deplwaman |
| `scripts/nginx/console.conf` | Nginx pou frontend |
| `scripts/nginx/api.conf` | Nginx pou API |
| `scripts/nginx/socket.conf` | Nginx pou WebSocket |
| `.github/workflows/deploy-digitalocean.yml` | CI/CD GitHub Actions |

---

## Kout Estime (Digital Ocean)

| Sèvis | Pri/Mwa |
|-------|---------|
| Droplet (4GB RAM) | $24 |
| Managed MySQL | $15 |
| Managed Redis | $15 |
| DO Spaces (25GB) | $5 |
| **Total** | **~$59/mwa** |

---

## Depannaj Rapèl

```bash
# Sèvis yo pa kouri?
docker compose -f docker-compose.yml -f docker-compose.production.yml restart

# Erè database?
docker compose exec -T application php artisan migrate:status

# Cache pwoblèm?
docker compose exec -T application php artisan cache:clear
docker compose exec -T application php artisan config:clear

# Nginx pa mache?
nginx -t && systemctl restart nginx

# SSL ekspire?
certbot renew --dry-run
```
