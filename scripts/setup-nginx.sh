#!/bin/bash
# =============================================================================
# Fleetbase - Nginx + SSL Setup Script
# Usage: bash scripts/setup-nginx.sh yourdomain.com
# Kouri sa SÈLMAN apre DNS yo pwopaje (domain → IP Droplet)
# =============================================================================

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
header() { echo -e "\n${BLUE}========== $1 ==========${NC}\n"; }

DOMAIN="${1}"
if [ -z "$DOMAIN" ]; then
  error "Ou dwe bay domèn ou a. Egzanp: bash setup-nginx.sh yourdomain.com"
fi

EMAIL="${2:-admin@${DOMAIN}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

header "KONFIGIRE NGINX POU $DOMAIN"

# ---- Substitye veosifwork.com ak domèn reyèl la ----
setup_conf() {
    local template="$1"
    local dest="$2"
    sed "s/YOURDOMAIN\.com/${DOMAIN}/g" "$template" > "$dest"
    log "Konfigire: $dest"
}

header "ETAP 1 - Kopye Konfig Nginx"
setup_conf "$SCRIPT_DIR/nginx/console.conf" "/etc/nginx/sites-available/fleetbase-console"
setup_conf "$SCRIPT_DIR/nginx/api.conf"     "/etc/nginx/sites-available/fleetbase-api"
setup_conf "$SCRIPT_DIR/nginx/socket.conf"  "/etc/nginx/sites-available/fleetbase-socket"

# Aktive sites
ln -sf /etc/nginx/sites-available/fleetbase-console /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/fleetbase-api     /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/fleetbase-socket  /etc/nginx/sites-enabled/

# Retire default site
rm -f /etc/nginx/sites-enabled/default

# Teste konfig Nginx
nginx -t || error "Nginx config gen erè! Tcheke fichye konfig yo."
systemctl reload nginx
log "Nginx reload fini"

header "ETAP 2 - Pran Sèrtifika SSL (Let's Encrypt)"
warn "Asire ou ke DNS yo pwopaje avan sa (domain → IP Droplet)"
echo ""
echo "DNS yo dwe pwopaje:"
echo "  $DOMAIN          → $(curl -s ifconfig.me)"
echo "  www.$DOMAIN      → $(curl -s ifconfig.me)"
echo "  api.$DOMAIN      → $(curl -s ifconfig.me)"
echo "  socket.$DOMAIN   → $(curl -s ifconfig.me)"
echo ""
read -p "DNS yo pwopaje deja? (oui/non): " CONFIRM
if [ "$CONFIRM" != "oui" ]; then
  warn "OK. Kouri script sa a ankò lè DNS yo pwopaje: bash setup-nginx.sh $DOMAIN"
  exit 0
fi

# Pran sèrtifika SSL pou tout sous-domèn yo
certbot --nginx \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive \
  --redirect

certbot --nginx \
  -d "api.${DOMAIN}" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive \
  --redirect

certbot --nginx \
  -d "socket.${DOMAIN}" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive \
  --redirect

log "Sèrtifika SSL aktive pou tout sous-domèn yo"

header "ETAP 3 - Konfigire Auto-Renewal SSL"
systemctl enable snap.certbot.renew.timer
systemctl start snap.certbot.renew.timer
log "Auto-renewal SSL konfigire"

header "REZIME FINAL"
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Nginx + SSL setup fini avèk siksè!          ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "URLs aktif:"
echo "  Console:  https://$DOMAIN"
echo "  API:      https://api.$DOMAIN"
echo "  Socket:   https://socket.$DOMAIN"
echo ""
echo "Pwochen etap: bash scripts/deploy.sh"
echo ""
