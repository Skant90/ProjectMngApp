#!/bin/bash
# =============================================================================
# ProjectMng — VPN L2TP/IPSec + PSK
# Logowanie: login i hasło (BEZ certyfikatów, BEZ dodatkowego oprogramowania)
# Windows 10/11 — natywna obsługa
# =============================================================================
set -euo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

VPN_SERVER_IP="${1:-}"
VPN_PSK="${2:-$(openssl rand -base64 20 | tr -d '/+=')}"
VPN_SUBNET="10.20.0.0/24"
VPN_LOCAL_IP="10.20.0.1"
VPN_POOL_START="10.20.0.100"
VPN_POOL_END="10.20.0.200"
VPN_DNS="1.1.1.1"
SWANCTL_DIR="/etc/swanctl"
CLIENTS_DIR="/etc/vpn-users"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

[[ $EUID -ne 0 ]] && error "Uruchom jako root."
[[ -z "$VPN_SERVER_IP" ]] && error "Podaj publiczne IP serwera: $0 <IP> [klucz-psk]"
[[ ! "$VPN_SERVER_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && error "Nieprawidłowy format IP."

info "Konfiguracja L2TP/IPSec VPN na IP: $VPN_SERVER_IP"

# ── Instalacja ────────────────────────────────────────────────────────────────
info "Instaluję strongSwan + xl2tpd + ppp..."
apt-get install -y strongswan xl2tpd ppp \
    libcharon-extra-plugins libcharon-extauth-plugins libstrongswan-extra-plugins

mkdir -p "$CLIENTS_DIR"
chmod 700 "$CLIENTS_DIR"

# Wykryj serwis strongSwan
VPN_SERVICE=""
for svc in strongswan-starter strongswan charon-systemd; do
    if systemctl list-unit-files "${svc}.service" 2>/dev/null | grep -q "${svc}"; then
        VPN_SERVICE="$svc"
        break
    fi
done
[[ -z "$VPN_SERVICE" ]] && error "Nie znaleziono serwisu strongSwan."
info "Serwis strongSwan: ${VPN_SERVICE}"

# ── Katalogi swanctl ──────────────────────────────────────────────────────────
mkdir -p "${SWANCTL_DIR}/conf.d"

# Usuń starą konfigurację IKEv2 jeśli istnieje
rm -f "${SWANCTL_DIR}/conf.d/projectmng.conf"
rm -f "${SWANCTL_DIR}/conf.d/server-key.conf"
rm -f "${SWANCTL_DIR}/conf.d/eap-"*.conf 2>/dev/null || true

# ── Konfiguracja swanctl (L2TP/IPSec + PSK) ──────────────────────────────────
info "Konfiguruję strongSwan (L2TP/IPSec + PSK)..."

cat > "${SWANCTL_DIR}/conf.d/l2tp-psk.conf" << EOF
connections {
    l2tp-psk {
        version = 1
        local_addrs = %any
        remote_addrs = %any
        proposals = aes256-sha256-modp2048, aes256-sha1-modp1024, aes128-sha1-modp1024, 3des-sha1-modp1024

        local {
            auth = psk
        }
        remote {
            auth = psk
        }

        children {
            l2tp-psk {
                local_ts = dynamic[17/1701]
                remote_ts = dynamic[17/1701]
                mode = transport
                esp_proposals = aes256-sha256, aes256-sha1, aes128-sha1, 3des-sha1
                dpd_action = clear
            }
        }
    }
}

secrets {
    ike-psk {
        secret = "${VPN_PSK}"
    }
}
EOF
chmod 600 "${SWANCTL_DIR}/conf.d/l2tp-psk.conf"

# ── xl2tpd ────────────────────────────────────────────────────────────────────
info "Konfiguruję xl2tpd..."
mkdir -p /etc/xl2tpd

cat > /etc/xl2tpd/xl2tpd.conf << EOF
[global]
port = 1701

[lns default]
ip range = ${VPN_POOL_START}-${VPN_POOL_END}
local ip = ${VPN_LOCAL_IP}
require chap = yes
refuse pap = yes
require authentication = yes
name = projectmng-vpn
ppp debug = no
pppoptfile = /etc/ppp/options.xl2tpd
length bit = yes
EOF

# ── Opcje PPP ─────────────────────────────────────────────────────────────────
cat > /etc/ppp/options.xl2tpd << EOF
ipcp-accept-local
ipcp-accept-remote
ms-dns ${VPN_DNS}
noccp
auth
mtu 1280
mru 1280
proxyarp
lcp-echo-failure 4
lcp-echo-interval 30
connect-delay 5000
EOF

# Inicjalizuj chap-secrets
echo "# login    server    secret    ip" > /etc/ppp/chap-secrets
chmod 600 /etc/ppp/chap-secrets

# ── Zapisz metadane serwera ───────────────────────────────────────────────────
echo "$VPN_PSK" > "${CLIENTS_DIR}/.psk"
echo "$VPN_SERVER_IP" > "${CLIENTS_DIR}/.server_ip"
chmod 600 "${CLIENTS_DIR}/.psk" "${CLIENTS_DIR}/.server_ip"

# ── IP forwarding ─────────────────────────────────────────────────────────────
info "Włączam IP forwarding..."
cat > /etc/sysctl.d/99-vpn.conf << EOF
net.ipv4.ip_forward = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.ip_no_pmtu_disc = 1
EOF
sysctl --system

# ── NAT i firewall ────────────────────────────────────────────────────────────
info "Konfiguruję NAT i firewall..."
ETH=$(ip route | grep default | awk '{print $5}' | head -1)
info "Interfejs sieciowy: ${ETH}"

iptables -t nat -C POSTROUTING -s "${VPN_SUBNET}" -o "${ETH}" -j MASQUERADE 2>/dev/null || \
    iptables -t nat -A POSTROUTING -s "${VPN_SUBNET}" -o "${ETH}" -j MASQUERADE
iptables -C FORWARD -s "${VPN_SUBNET}" -j ACCEPT 2>/dev/null || \
    iptables -A FORWARD -s "${VPN_SUBNET}" -j ACCEPT
iptables -C FORWARD -d "${VPN_SUBNET}" -j ACCEPT 2>/dev/null || \
    iptables -A FORWARD -d "${VPN_SUBNET}" -j ACCEPT

for port in 500 4500 1701; do
    iptables -C INPUT -p udp --dport "$port" -j ACCEPT 2>/dev/null || \
        iptables -A INPUT -p udp --dport "$port" -j ACCEPT
done
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

# ── Uruchomienie serwisów ─────────────────────────────────────────────────────
info "Uruchamiam strongSwan (${VPN_SERVICE})..."
systemctl enable "${VPN_SERVICE}"
systemctl restart "${VPN_SERVICE}"
sleep 2
swanctl --load-all

info "Uruchamiam xl2tpd..."
systemctl enable xl2tpd
systemctl restart xl2tpd

echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN} VPN L2TP/IPSec gotowy! (logowanie: login + hasło)${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "  Serwer:        ${VPN_SERVER_IP}"
echo "  Klucz wstępny: ${VPN_PSK}"
echo "  Protokół:      L2TP/IPSec + PSK"
echo ""
echo "  ── Konfiguracja Windows 10/11 (BEZ certyfikatów) ──────────────"
echo ""
echo "  KROK 1 — jednorazowa poprawka rejestru (każdy komputer):"
echo "  Otwórz PowerShell jako Administrator i wklej:"
echo ""
echo '  reg add HKLM\SYSTEM\CurrentControlSet\Services\PolicyAgent /v AssumeUDPEncapsulationContextOnSendRule /t REG_DWORD /d 2 /f'
echo ""
echo "  Uruchom ponownie komputer."
echo ""
echo "  KROK 2 — dodaj połączenie VPN:"
echo "  Ustawienia → Sieć i Internet → VPN → Dodaj połączenie VPN"
echo "    Dostawca VPN:  Windows (wbudowany)"
echo "    Typ VPN:       L2TP/IPSec z kluczem wstępnym"
echo "    Adres serwera: ${VPN_SERVER_IP}"
echo "    Klucz wstępny: ${VPN_PSK}"
echo "    Typ informacji logowania: Nazwa użytkownika i hasło"
echo "    (login i hasło podajesz przy łączeniu)"
echo ""
echo "  Dodaj użytkownika:"
echo "    ./scripts/vpn-add-user.sh <login> [haslo]"
echo ""
echo "  PSK zapisany w: ${CLIENTS_DIR}/.psk"
echo ""
