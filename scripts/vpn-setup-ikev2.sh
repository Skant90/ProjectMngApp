#!/bin/bash
# =============================================================================
# ProjectMng — Instalacja serwera VPN IKEv2/IPSec (strongSwan)
# Ubuntu 26.04 — działa natywnie na Windows 10/11 bez dodatkowego oprogramowania
# =============================================================================
set -euo pipefail

# ── Konfiguracja ──────────────────────────────────────────────────────────────
VPN_SERVER_IP="${1:-}"          # publiczne IP serwera (wymagane!)
VPN_SUBNET="10.20.0.0/24"
VPN_POOL_START="10.20.0.100"
VPN_POOL_END="10.20.0.200"
VPN_DNS="1.1.1.1"
CA_CN="ProjectMng VPN CA"
SERVER_CN="vpn.projectmng.local"
CERT_DIR="/etc/ipsec.d"
CLIENTS_DIR="/etc/vpn-users"

# ── Kolory ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── Walidacja ─────────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Uruchom jako root."
[[ -z "$VPN_SERVER_IP" ]] && error "Podaj publiczne IP serwera: $0 <IP>"
[[ ! "$VPN_SERVER_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && error "Nieprawidłowy format IP."

info "Konfiguracja IKEv2 VPN na IP: $VPN_SERVER_IP"

# ── Instalacja pakietów ───────────────────────────────────────────────────────
info "Instaluję strongSwan i narzędzia..."
apt-get update -qq
apt-get install -y strongswan strongswan-pki libcharon-extra-plugins \
    libcharon-extauth-plugins libstrongswan-extra-plugins

mkdir -p "$CLIENTS_DIR"
chmod 700 "$CLIENTS_DIR"

# ── Generowanie certyfikatów ──────────────────────────────────────────────────
info "Generuję certyfikaty PKI..."

# Upewnij się że katalogi ipsec.d istnieją
mkdir -p "${CERT_DIR}/private" "${CERT_DIR}/cacerts" "${CERT_DIR}/certs"
chmod 700 "${CERT_DIR}/private"

# CA
ipsec pki --gen --type rsa --size 4096 --outform pem > "${CERT_DIR}/private/ca.pem"
chmod 600 "${CERT_DIR}/private/ca.pem"

ipsec pki --self \
    --ca \
    --lifetime 3650 \
    --in "${CERT_DIR}/private/ca.pem" \
    --type rsa \
    --dn "CN=${CA_CN}" \
    --outform pem > "${CERT_DIR}/cacerts/ca.pem"

info "Certyfikat CA wygenerowany."

# Certyfikat serwera
ipsec pki --gen --type rsa --size 4096 --outform pem > "${CERT_DIR}/private/server.pem"
chmod 600 "${CERT_DIR}/private/server.pem"

ipsec pki --pub \
    --in "${CERT_DIR}/private/server.pem" \
    --type rsa \
    | ipsec pki --issue \
        --lifetime 1825 \
        --cacert "${CERT_DIR}/cacerts/ca.pem" \
        --cakey "${CERT_DIR}/private/ca.pem" \
        --dn "CN=${VPN_SERVER_IP}" \
        --san "${VPN_SERVER_IP}" \
        --san "${SERVER_CN}" \
        --flag serverAuth \
        --flag ikeIntermediate \
        --outform pem > "${CERT_DIR}/certs/server.pem"

info "Certyfikat serwera wygenerowany."

# ── Konfiguracja strongSwan (/etc/ipsec.conf) ─────────────────────────────────
info "Konfiguruję strongSwan..."

cat > /etc/ipsec.conf << EOF
config setup
    charondebug="ike 1, knl 1, cfg 0"
    uniqueids=no

conn ikev2-vpn
    auto=add
    compress=no
    type=tunnel
    keyexchange=ikev2
    fragmentation=yes
    forceencaps=yes
    dpdaction=clear
    dpddelay=300s
    rekey=no

    # Serwer
    left=%any
    leftid=${VPN_SERVER_IP}
    leftcert=server.pem
    leftsendcert=always
    leftsubnet=0.0.0.0/0

    # Klient
    right=%any
    rightid=%any
    rightauth=eap-mschapv2
    rightsourceip=${VPN_POOL_START}-${VPN_POOL_END}
    rightdns=${VPN_DNS}
    rightsendcert=never

    eap_identity=%identity

    # Algorytmy kryptograficzne
    ike=chacha20poly1305-sha512-curve25519-prfsha512,aes256gcm16-sha384-x25519-prfsha384,aes256-sha256-modp2048
    esp=chacha20poly1305-sha512,aes256gcm16-sha384,aes256-sha256
EOF

# ── Poświadczenia (/etc/ipsec.secrets) ───────────────────────────────────────
cat > /etc/ipsec.secrets << EOF
# Klucz prywatny serwera
: RSA server.pem

# Użytkownicy VPN — format: "login" : EAP "haslo"
# Dodawaj kolejnych użytkowników skryptem vpn-add-user.sh
EOF

chmod 600 /etc/ipsec.secrets

# ── IP forwarding ─────────────────────────────────────────────────────────────
info "Włączam IP forwarding..."

cat > /etc/sysctl.d/99-vpn.conf << EOF
net.ipv4.ip_forward = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.ip_no_pmtu_disc = 1
EOF

sysctl --system

# ── Firewall (UFW + iptables NAT) ─────────────────────────────────────────────
info "Konfiguruję firewall..."

# Znajdź główny interfejs sieciowy
ETH=$(ip route | grep default | awk '{print $5}' | head -1)
info "Interfejs sieciowy: ${ETH}"

# IPTables NAT dla VPN
iptables -t nat -A POSTROUTING -s "${VPN_SUBNET}" -o "${ETH}" -j MASQUERADE
iptables -A FORWARD -s "${VPN_SUBNET}" -j ACCEPT
iptables -A FORWARD -d "${VPN_SUBNET}" -j ACCEPT

# Zapisz reguły iptables (bez iptables-persistent — ufw zarządza firewallem)
mkdir -p /etc/iptables
iptables-save > /etc/iptables/rules.v4

# Załaduj reguły przy starcie systemu
if [ ! -f /etc/network/if-pre-up.d/iptables-load ]; then
    cat > /etc/network/if-pre-up.d/iptables-load << 'EOLOAD'
#!/bin/sh
iptables-restore < /etc/iptables/rules.v4
EOLOAD
    chmod +x /etc/network/if-pre-up.d/iptables-load
fi

# UFW
ufw allow 500/udp  comment 'IKEv2 VPN'
ufw allow 4500/udp comment 'IKEv2 VPN NAT-T'
ufw allow 22/tcp   comment 'SSH'

# Aplikacja dostępna TYLKO z podsieci VPN
ufw allow from "${VPN_SUBNET}" to any port 80  comment 'HTTP z VPN'
ufw allow from "${VPN_SUBNET}" to any port 443 comment 'HTTPS z VPN'

ufw --force enable

# ── Eksport certyfikatu CA (dla klientów Windows) ─────────────────────────────
info "Eksportuję certyfikat CA dla Windows..."

# Konwersja PEM → DER (Windows akceptuje .cer)
openssl x509 -in "${CERT_DIR}/cacerts/ca.pem" -outform DER \
    -out "/root/projectmng-vpn-ca.cer"

cp "${CERT_DIR}/cacerts/ca.pem" "/root/projectmng-vpn-ca.pem"

info "Plik CA: /root/projectmng-vpn-ca.cer (dla Windows)"
info "Plik CA: /root/projectmng-vpn-ca.pem (dla Linux/Mac)"

# ── Restart strongSwan ────────────────────────────────────────────────────────
systemctl enable strongswan-starter
systemctl restart strongswan-starter

# ── Podsumowanie ──────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
echo -e "${GREEN} VPN IKEv2 gotowy!${NC}"
echo "════════════════════════════════════════════════════════"
echo ""
echo "  Serwer:     ${VPN_SERVER_IP}"
echo "  Pula IP:    ${VPN_POOL_START} – ${VPN_POOL_END}"
echo "  DNS VPN:    ${VPN_DNS}"
echo "  Protokół:   IKEv2/IPSec + EAP-MSCHAPv2"
echo ""
echo "  Certyfikat CA (Windows): /root/projectmng-vpn-ca.cer"
echo "  Pobierz i zainstaluj przed pierwszym połączeniem!"
echo ""
echo "  Dodaj użytkownika:"
echo "    ./vpn-add-user.sh <login> <haslo>"
echo ""
