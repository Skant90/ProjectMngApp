#!/bin/bash
# =============================================================================
# Usuń użytkownika VPN IKEv2
# Użycie: ./vpn-remove-user.sh <login>
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

[[ $EUID -ne 0 ]] && error "Uruchom jako root."
[[ -z "${1:-}" ]] && error "Podaj login: $0 <login>"

LOGIN="$1"
CLIENTS_DIR="/etc/vpn-users"

# Sprawdź czy istnieje
if ! grep -q "\"${LOGIN}\"" /etc/ipsec.secrets 2>/dev/null; then
    error "Użytkownik '${LOGIN}' nie istnieje."
fi

# Rozłącz aktywne sesje tego użytkownika
ipsec down ikev2-vpn{*} 2>/dev/null || true

# Usuń z ipsec.secrets
sed -i "/\"${LOGIN}\" : EAP/d" /etc/ipsec.secrets

# Usuń plik klienta
rm -f "${CLIENTS_DIR}/${LOGIN}.conf"

# Przeładuj strongSwan
ipsec rereadsecrets

info "Użytkownik '${LOGIN}' usunięty z VPN."
