#!/bin/bash
# =============================================================================
# Fleetbase - Digital Ocean Droplet Setup Script
# Ubuntu 22.04 LTS
# Run as root: bash setup-droplet.sh
# =============================================================================

set -e

# ---- COLORS ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
header() { echo -e "\n${BLUE}========== $1 ==========${NC}\n"; }

# ---- VERIFIKASYON ----
if [ "$EUID" -ne 0 ]; then
  error "Ou dwe kouri script sa a kòm root. Eseye: sudo bash setup-droplet.sh"
fi

header "ETAP 1 - Mete Sistem nan À Jour"
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  curl wget git unzip software-properties-common \
  apt-transport-https ca-certificates gnupg lsb-release \
  ufw fail2ban
log "Sistèm nan mete ajou"

header "ETAP 2 - Enstale Docker"
# Retire ansyen Docker si li egziste
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Ajoute Docker repo ofisyèl
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable docker
systemctl start docker
log "Docker enstale: $(docker --version)"

header "ETAP 3 - Kreye Itilizatè fleetbase"
if id "fleetbase" &>/dev/null; then
  warn "Itilizatè fleetbase deja egziste"
else
  useradd -m -s /bin/bash fleetbase
  usermod -aG docker fleetbase
  usermod -aG sudo fleetbase
  # Pèmèt sudo san modpas pou deplwaman
  echo "fleetbase ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/fleetbase
  log "Itilizatè fleetbase kreye"
fi

# Kreye SSH directory pou fleetbase
mkdir -p /home/fleetbase/.ssh
chmod 700 /home/fleetbase/.ssh
chown -R fleetbase:fleetbase /home/fleetbase/.ssh

header "ETAP 4 - Enstale Nginx"
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
log "Nginx enstale: $(nginx -v 2>&1)"

header "ETAP 5 - Enstale Certbot (SSL)"
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot
log "Certbot enstale"

header "ETAP 6 - Konfigire Firewall (UFW)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh          # Port 22
ufw allow http         # Port 80
ufw allow https        # Port 443
ufw allow 38000/tcp    # SocketCluster WebSocket
ufw --force enable
log "Firewall konfigire"
ufw status

header "ETAP 7 - Konfigire Fail2ban (Sekirite)"
systemctl enable fail2ban
systemctl start fail2ban
log "Fail2ban aktive"

header "ETAP 8 - Kreye Dosye Pwojè a"
mkdir -p /opt/fleetbase
chown -R fleetbase:fleetbase /opt/fleetbase
log "Dosye /opt/fleetbase kreye"

header "ETAP 9 - Optimize Sistèm pou Pwodiksyon"
# Ogmante limite fichye ouvè
cat >> /etc/security/limits.conf << 'EOF'
fleetbase soft nofile 65536
fleetbase hard nofile 65536
root soft nofile 65536
root hard nofile 65536
EOF

# Optimize TCP pou websocket
cat >> /etc/sysctl.conf << 'EOF'
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
EOF
sysctl -p
log "Sistèm optimize"

header "ETAP 10 - Enfòmasyon Enpòtan"
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Setup Droplet la fini avèk siksè!           ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "Pwochen etap yo:"
echo -e "  1. Kopye kle SSH GitHub ou nan: /home/fleetbase/.ssh/authorized_keys"
echo -e "  2. Clone pwojè a: git clone --recurse-submodules YOUR_REPO /opt/fleetbase"
echo -e "  3. Kopye fichye nginx yo: bash scripts/setup-nginx.sh YOURDOMAIN.com"
echo -e "  4. Kouri: bash scripts/deploy.sh"
echo ""
echo -e "IP Droplet ou: $(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
echo ""
