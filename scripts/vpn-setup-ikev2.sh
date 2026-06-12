#!/bin/bash
# =============================================================================
# ProjectMng — Instalacja serwera VPN IKEv2/IPSec (strongSwan 6.x / swanctl)
# Ubuntu 26.04 — działa natywnie na Windows 10/11 bez dodatkowego oprogramowania
# =============================================================================
set -euo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

VPN_SERVER_IP="${1:-}"
VPN_SUBNET="10.20.0.0/24"
VPN_POOL_ADDRS="10.20.0.100-10.20.0.200"
VPN_DNS="1.1.1.1"
CA_CN="ProjectMng VPN CA"
SWANCTL_DIR="/etc/swanctl"
CLIENTS_DIR="/etc/vpn-users"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

[[ $EUID -ne 0 ]] && error "Uruchom jako root."
[[ -z "$VPN_SERVER_IP" ]] && error "Podaj publiczne IP serwera: $0 <IP>"
[[ ! "$VPN_SERVER_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && error "Nieprawidłowy format IP."

info "Konfiguracja IKEv2 VPN na IP: $VPN_SERVER_IP"

# ── Instalacja ────────────────────────────────────────────────────────────────
info "Instaluję strongSwan..."
apt-get install -y strongswan strongswan-pki libcharon-extra-plugins \
    libcharon-extauth-plugins libstrongswan-extra-plugins

mkdir -p "$CLIENTS_DIR"
chmod 700 "$CLIENTS_DIR"

# Wykryj nazwę serwisu
VPN_SERVICE=""
for svc in charon-systemd strongswan-starter strongswan; do
    if systemctl list-unit-files "${svc}.service" 2>/dev/null | grep -q "${svc}"; then
        VPN_SERVICE="$svc"
        break
    fi
done
[[ -z "$VPN_SERVICE" ]] && error "Nie znaleziono serwisu strongSwan."
info "Serwis strongSwan: ${VPN_SERVICE}"

# ── Katalogi swanctl ──────────────────────────────────────────────────────────
mkdir -p "${SWANCTL_DIR}/private" "${SWANCTL_DIR}/x509ca" "${SWANCTL_DIR}/x509" "${SWANCTL_DIR}/conf.d"
chmod 700 "${SWANCTL_DIR}/private"

# ── Certyfikat CA ─────────────────────────────────────────────────────────────
info "Generuję certyfikat CA..."
pki --gen --type rsa --size 4096 --outform pem > "${SWANCTL_DIR}/private/ca.pem"
chmod 600 "${SWANCTL_DIR}/private/ca.pem"

pki --self \
    --ca \
    --lifetime 3650 \
    --in "${SWANCTL_DIR}/private/ca.pem" \
    --type rsa \
    --dn "CN=${CA_CN}" \
    --outform pem > "${SWANCTL_DIR}/x509ca/ca.pem"

info "Certyfikat CA wygenerowany."

# ── Certyfikat serwera ────────────────────────────────────────────────────────
info "Generuję certyfikat serwera..."
pki --gen --type rsa --size 4096 --outform pem > "${SWANCTL_DIR}/private/server.pem"
chmod 600 "${SWANCTL_DIR}/private/server.pem"

pki --pub \
    --in "${SWANCTL_DIR}/private/server.pem" \
    --type rsa \
    | pki --issue \
        --lifetime 1825 \
        --cacert "${SWANCTL_DIR}/x509ca/ca.pem" \
        --cakey "${SWANCTL_DIR}/private/ca.pem" \
        --dn "CN=${VPN_SERVER_IP}" \
        --san "${VPN_SERVER_IP}" \
        --flag serverAuth \
        --flag ikeIntermediate \
        --outform pem > "${SWANCTL_DIR}/x509/server.pem"

info "Certyfikat serwera wygenerowany."

# ── Konfiguracja swanctl ──────────────────────────────────────────────────────
info "Konfiguruję swanctl..."

cat > "${SWANCTL_DIR}/conf.d/projectmng.conf" << EOF
connections {
    ikev2-vpn {
        version = 2
        local_addrs = %any
        remote_addrs = %any
        fragmentation = yes
        dpd_delay = 300s

        local {
            auth = pubkey
            certs = server.pem
            id = ${VPN_SERVER_IP}
        }

        remote {
            auth = eap-mschapv2
            eap_id = %any
        }

        children {
            ikev2-vpn {
                local_ts = 0.0.0.0/0
                remote_ts = dynamic
                esp_proposals = aes256gcm16-sha384, aes256-sha256
                mode = tunnel
                dpd_action = clear
            }
        }

        pools = vpn-pool
        send_cert = always
        proposals = aes256gcm16-prfsha384-ecp384, aes256-sha256-modp2048, aes256-sha256-modp1024
    }
}

pools {
    vpn-pool {
        addrs = ${VPN_POOL_ADDRS}
        dns = ${VPN_DNS}
    }
}
EOF

# Klucz prywatny serwera
cat > "${SWANCTL_DIR}/conf.d/server-key.conf" << EOF
secrets {
    private-server {
        file = server.pem
    }
}
EOF
chmod 600 "${SWANCTL_DIR}/conf.d/server-key.conf"

# ── IP forwarding ─────────────────────────────────────────────────────────────
info "Włączam IP forwarding..."
cat > /etc/sysctl.d/99-vpn.conf << EOF
net.ipv4.ip_forward = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.ip_no_pmtu_disc = 1
EOF
sysctl --system

# ── NAT (iptables) ────────────────────────────────────────────────────────────
info "Konfiguruję NAT..."
ETH=$(ip route | grep default | awk '{print $5}' | head -1)
info "Interfejs sieciowy: ${ETH}"

iptables -t nat -C POSTROUTING -s "${VPN_SUBNET}" -o "${ETH}" -j MASQUERADE 2>/dev/null || \
    iptables -t nat -A POSTROUTING -s "${VPN_SUBNET}" -o "${ETH}" -j MASQUERADE
iptables -C FORWARD -s "${VPN_SUBNET}" -j ACCEPT 2>/dev/null || \
    iptables -A FORWARD -s "${VPN_SUBNET}" -j ACCEPT
iptables -C FORWARD -d "${VPN_SUBNET}" -j ACCEPT 2>/dev/null || \
    iptables -A FORWARD -d "${VPN_SUBNET}" -j ACCEPT

mkdir -p /etc/iptables
iptables-save > /etc/iptables/rules.v4

if [ ! -f /etc/network/if-pre-up.d/iptables-load ]; then
    cat > /etc/network/if-pre-up.d/iptables-load << 'EOLOAD'
#!/bin/sh
iptables-restore < /etc/iptables/rules.v4
EOLOAD
    chmod +x /etc/network/if-pre-up.d/iptables-load
fi

# ── Firewall (UFW) ────────────────────────────────────────────────────────────
info "Konfiguruję UFW..."
UFW=$(command -v ufw || echo /usr/sbin/ufw)
$UFW allow 500/udp  comment 'IKEv2 VPN'
$UFW allow 4500/udp comment 'IKEv2 VPN NAT-T'
$UFW allow 22/tcp   comment 'SSH'
$UFW allow from "${VPN_SUBNET}" to any port 80  comment 'HTTP z VPN'
$UFW allow from "${VPN_SUBNET}" to any port 443 comment 'HTTPS z VPN'
$UFW --force enable

# ── Eksport certyfikatu CA ────────────────────────────────────────────────────
info "Eksportuję certyfikat CA dla Windows..."
openssl x509 -in "${SWANCTL_DIR}/x509ca/ca.pem" -outform DER -out "/root/projectmng-vpn-ca.cer"
cp "${SWANCTL_DIR}/x509ca/ca.pem" "/root/projectmng-vpn-ca.pem"

# ── Uruchomienie strongSwan ───────────────────────────────────────────────────
info "Uruchamiam strongSwan (${VPN_SERVICE})..."
systemctl enable "${VPN_SERVICE}"
systemctl restart "${VPN_SERVICE}"
sleep 3
swanctl --load-all

echo ""
echo "════════════════════════════════════════════════════════"
echo -e "${GREEN} VPN IKEv2 gotowy!${NC}"
echo "════════════════════════════════════════════════════════"
echo ""
echo "  Serwer:     ${VPN_SERVER_IP}"
echo "  Pula IP:    ${VPN_POOL_ADDRS}"
echo "  DNS VPN:    ${VPN_DNS}"
echo "  Protokół:   IKEv2/IPSec + EAP-MSCHAPv2"
echo ""
echo "  Certyfikat CA (Windows): /root/projectmng-vpn-ca.cer"
echo "  Pobierz i zainstaluj przed pierwszym połączeniem!"
echo ""
echo "  Dodaj użytkownika:"
echo "    ./scripts/vpn-add-user.sh <login> [haslo]"
echo ""
