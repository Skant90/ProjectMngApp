#!/bin/bash
# =============================================================================
# Dodaj użytkownika VPN L2TP/IPSec (MS-CHAPv2)
# Użycie: ./vpn-add-user.sh <login> [haslo]
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

[[ $EUID -ne 0 ]] && error "Uruchom jako root."
[[ -z "${1:-}" ]] && error "Podaj login: $0 <login> [haslo]"

LOGIN="$1"
CLIENTS_DIR="/etc/vpn-users"
CHAP_SECRETS="/etc/ppp/chap-secrets"

grep -qP "^${LOGIN}\s" "$CHAP_SECRETS" 2>/dev/null && \
    error "Użytkownik '${LOGIN}' już istnieje. Użyj vpn-update-password.sh aby zmienić hasło."

if [[ -z "${2:-}" ]]; then
    PASSWORD=$(openssl rand -base64 12 | tr -d '/+=')
    info "Wygenerowano hasło automatycznie."
else
    PASSWORD="$2"
    [[ ${#PASSWORD} -lt 8 ]] && error "Hasło musi mieć co najmniej 8 znaków."
fi

echo "${LOGIN}    *    \"${PASSWORD}\"    *" >> "$CHAP_SECRETS"

mkdir -p "$CLIENTS_DIR"
chmod 700 "$CLIENTS_DIR"
cat > "${CLIENTS_DIR}/${LOGIN}.conf" << EOF
# VPN: ${LOGIN} — $(date '+%Y-%m-%d %H:%M:%S')
LOGIN=${LOGIN}
PASSWORD=${PASSWORD}
EOF
chmod 600 "${CLIENTS_DIR}/${LOGIN}.conf"

VPN_IP=$(cat "${CLIENTS_DIR}/.server_ip" 2>/dev/null || echo "TWOJ_IP")
PSK=$(cat "${CLIENTS_DIR}/.psk" 2>/dev/null || echo "KLUCZ_PSK")

echo ""
echo "════════════════════════════════════════════════"
echo -e "${GREEN} Użytkownik VPN dodany: ${LOGIN}${NC}"
echo "════════════════════════════════════════════════"
echo ""
echo "  Dane do połączenia Windows:"
echo "  ──────────────────────────────────────────────"
echo "  Adres serwera: ${VPN_IP}"
echo "  Typ VPN:       L2TP/IPSec z kluczem wstępnym"
echo "  Klucz wstępny: ${PSK}"
echo "  Login:         ${LOGIN}"
echo "  Hasło:         ${PASSWORD}"
echo ""
echo "  Właściwości VPN → Zabezpieczenia → Uwierzytelnianie:"
echo "  ☑ Zezwalaj na te protokoły → MS-CHAP v2 (NIE EAP)"
echo ""
