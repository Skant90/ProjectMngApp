#!/bin/bash
# =============================================================================
# ProjectMng — VPN WireGuard
# Każdy użytkownik dostaje plik .conf który importuje do klienta WireGuard
# Windows: https://www.wireguard.com/install/ (darmowy, 2 minuty)
# =============================================================================
set -euo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

VPN_SERVER_IP="${1:-}"
VPN_PORT="${2:-51820}"
VPN_SUBNET="10.20.0.0/24"
VPN_SERVER_ADDR="10.20.0.1"
VPN_DNS="1.1.1.1"
WG_IFACE="wg0"
CLIENTS_DIR="/etc/vpn-users"
WG_CONF="/etc/wireguard/${WG_IFACE}.conf"
COUNTER_FILE="${CLIENTS_DIR}/.ip_counter"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

[[ $EUID -ne 0 ]] && error "Uruchom jako root."
[[ -z "$VPN_SERVER_IP" ]] && error "Podaj publiczne IP serwera: $0 <IP> [port]"
[[ ! "$VPN_SERVER_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && error "Nieprawidłowy format IP."

info "Konfiguracja WireGuard VPN na IP: $VPN_SERVER_IP port: $VPN_PORT"

# ── Instalacja ────────────────────────────────────────────────────────────────
info "Instaluję WireGuard..."
apt-get install -y wireguard wireguard-tools

mkdir -p "$CLIENTS_DIR"
chmod 700 "$CLIENTS_DIR"

# ── Klucze serwera ────────────────────────────────────────────────────────────
info "Generuję klucze serwera..."
mkdir -p /etc/wireguard
chmod 700 /etc/wireguard

SERVER_PRIVATE=$(wg genkey)
SERVER_PUBLIC=$(echo "$SERVER_PRIVATE" | wg pubkey)

echo "$SERVER_PRIVATE" > /etc/wireguard/server.key
echo "$SERVER_PUBLIC"  > /etc/wireguard/server.pub
chmod 600 /etc/wireguard/server.key

# Zapisz metadane
echo "$VPN_SERVER_IP" > "${CLIENTS_DIR}/.server_ip"
echo "$VPN_PORT"      > "${CLIENTS_DIR}/.server_port"
echo "$SERVER_PUBLIC" > "${CLIENTS_DIR}/.server_pub"
echo "2"              > "$COUNTER_FILE"   # .1 = serwer, klienci od .2

# ── Konfiguracja serwera WireGuard ───────────────────────────────────────────
info "Tworzę konfigurację serwera..."
ETH=$(ip route | grep default | awk '{print $5}' | head -1)

cat > "$WG_CONF" << EOF
[Interface]
Address = ${VPN_SERVER_ADDR}/24
ListenPort = ${VPN_PORT}
PrivateKey = ${SERVER_PRIVATE}
PostUp   = iptables -t nat -A POSTROUTING -s ${VPN_SUBNET} -o ${ETH} -j MASQUERADE; iptables -A FORWARD -i ${WG_IFACE} -j ACCEPT; iptables -A FORWARD -o ${WG_IFACE} -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -s ${VPN_SUBNET} -o ${ETH} -j MASQUERADE; iptables -D FORWARD -i ${WG_IFACE} -j ACCEPT; iptables -D FORWARD -o ${WG_IFACE} -j ACCEPT

# ── Użytkownicy (dodawane przez vpn-add-user.sh) ─────────────────────────────
EOF
chmod 600 "$WG_CONF"

# ── IP forwarding ─────────────────────────────────────────────────────────────
info "Włączam IP forwarding..."
cat > /etc/sysctl.d/99-vpn.conf << EOF
net.ipv4.ip_forward = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
EOF
sysctl --system

# ── Firewall ──────────────────────────────────────────────────────────────────
info "Konfiguruję firewall..."
iptables -C INPUT -p udp --dport "$VPN_PORT" -j ACCEPT 2>/dev/null || \
    iptables -A INPUT -p udp --dport "$VPN_PORT" -j ACCEPT
iptables -C INPUT -p tcp --dport 22 -j ACCEPT 2>/dev/null || \
    iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -C INPUT -s "${VPN_SUBNET}" -p tcp --dport 80 -j ACCEPT 2>/dev/null || \
    iptables -A INPUT -s "${VPN_SUBNET}" -p tcp --dport 80 -j ACCEPT
iptables -C INPUT -s "${VPN_SUBNET}" -p tcp --dport 443 -j ACCEPT 2>/dev/null || \
    iptables -A INPUT -s "${VPN_SUBNET}" -p tcp --dport 443 -j ACCEPT

mkdir -p /etc/iptables
iptables-save > /etc/iptables/rules.v4

if [ ! -f /etc/network/if-pre-up.d/iptables-load ]; then
    cat > /etc/network/if-pre-up.d/iptables-load << 'EOLOAD'
#!/bin/sh
iptables-restore < /etc/iptables/rules.v4
EOLOAD
    chmod +x /etc/network/if-pre-up.d/iptables-load
fi

# ── Uruchomienie WireGuard ────────────────────────────────────────────────────
info "Uruchamiam WireGuard..."
systemctl enable "wg-quick@${WG_IFACE}"
systemctl restart "wg-quick@${WG_IFACE}"

# Wyłącz stare serwisy VPN jeśli istnieją
for svc in xl2tpd strongswan strongswan-starter charon-systemd; do
    if systemctl is-active "$svc" &>/dev/null; then
        systemctl stop "$svc" && systemctl disable "$svc" 2>/dev/null || true
        info "Zatrzymano stary serwis: ${svc}"
    fi
done

echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN} WireGuard VPN gotowy!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "  Serwer: ${VPN_SERVER_IP}:${VPN_PORT}"
echo ""
echo "  Instalacja klienta Windows (jednorazowo):"
echo "  https://www.wireguard.com/install/"
echo "  → Pobierz i zainstaluj (Next, Next, Finish)"
echo ""
echo "  Dodaj użytkownika i wyślij mu plik .conf:"
echo "    ./scripts/vpn-add-user.sh leszek"
echo "    scp -P 9122 /etc/vpn-users/leszek.conf leszek@komputer:Desktop/"
echo ""
echo "  Użytkownik importuje plik w kliencie WireGuard:"
echo "    Import tunnel(s) from file → wybierz .conf → Activate"
echo ""
