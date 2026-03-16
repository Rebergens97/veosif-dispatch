#!/bin/bash
# =============================================================================
# Fleetbase - Deploy Script (kouri sou Droplet la)
# Usage: bash scripts/deploy.sh [--first-time]
# =============================================================================

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
header() { echo -e "\n${BLUE}========== $1 ==========${NC}\n"; }

FIRST_TIME=false
if [[ "$1" == "--first-time" ]]; then
  FIRST_TIME=true
fi

PROJECT_DIR="/opt/fleetbase"
cd "$PROJECT_DIR" || error "Dosye $PROJECT_DIR pa egziste!"

header "FLEETBASE DEPLOYMENT - $(date '+%Y-%m-%d %H:%M:%S')"

# ---- VERIFIKASYON ----
if [ ! -f "api/.env" ]; then
  error "api/.env pa egziste!\nKopye api/.env.example → api/.env epi ranpli valè yo"
fi

header "ETAP 1 - Pull Latest Code"
git pull origin main
git submodule update --init --recursive
log "Code mete ajou"

header "ETAP 2 - Build Docker Images"
docker compose -f docker-compose.yml -f docker-compose.production.yml build --no-cache console
docker compose -f docker-compose.yml -f docker-compose.production.yml build httpd application
log "Build Docker fini"

header "ETAP 3 - Start/Restart Services"
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d
log "Sèvis yo kouri"

# Tann application la kòmanse
echo "Ap tann application la kòmanse (30 sekond)..."
sleep 30

header "ETAP 4 - Database Setup"
if [ "$FIRST_TIME" = true ]; then
  echo "Premye deplwaman - kouri tout setup yo..."
  docker compose exec -T application php artisan mysql:createdb || warn "createdb te echwe (ka deja egziste)"
  docker compose exec -T application php artisan migrate --force
  docker compose exec -T application php artisan sandbox:migrate --force || warn "sandbox migrate echwe"
  docker compose exec -T application php artisan fleetbase:seed
  docker compose exec -T application php artisan fleetbase:create-permissions
  docker compose exec -T application php artisan registry:init || warn "registry init echwe"
  log "Database setup konplè"
else
  echo "Deplwaman nòmal - sèlman migrations..."
  docker compose exec -T application php artisan migrate --force
  log "Migrations fini"
fi

header "ETAP 5 - Queue & Cache"
docker compose exec -T application php artisan queue:restart
docker compose exec -T application php artisan cache:clear
docker compose exec -T application php artisan route:clear
log "Queue restart ak cache clear fini"

header "ETAP 6 - Optimize Production"
docker compose exec -T application php artisan config:cache
docker compose exec -T application php artisan route:cache
log "Optimization fini"

header "ETAP 7 - Sync Scheduler"
docker compose exec -T application php artisan schedule-monitor:sync || warn "schedule-monitor sync echwe"
log "Scheduler sync fini"

header "ETAP 8 - Netwaye Ansyen Images Docker"
docker image prune -f
log "Netwayaj fini"

header "ETAP 9 - Verifye Sèvis Yo"
echo ""
echo "Estatki Kontènè yo:"
docker compose -f docker-compose.yml -f docker-compose.production.yml ps
echo ""

header "REZIME FINAL"
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Fleetbase deplwaye avèk siksè!              ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Kontènè ki kouri:"
docker compose -f docker-compose.yml -f docker-compose.production.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Logs disponib ak:"
echo "  docker compose logs -f application"
echo "  docker compose logs -f queue"
echo "  docker compose logs -f console"
echo ""
