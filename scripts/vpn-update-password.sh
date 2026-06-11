#!/bin/bash
# =============================================================================
# Zmień hasło użytkownika VPN
# Użycie: ./vpn-update-password.sh <login> <nowe_haslo>
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

[[ $EUID -ne 0 ]] && error "Uruchom jako root."
[[ -z "${1:-}" ]] && error "Użycie: $0 <login> <nowe_haslo>"
[[ -z "${2:-}" ]] && error "Podaj nowe hasło."

LOGIN="$1"
NEW_PASS="$2"
CLIENTS_DIR="/etc/vpn-users"

[[ ${#NEW_PASS} -lt 8 ]] && error "Hasło musi mieć co najmniej 8 znaków."

if ! grep -q "\"${LOGIN}\"" /etc/ipsec.secrets 2>/dev/null; then
    error "Użytkownik '${LOGIN}' nie istnieje."
fi

# Zaktualizuj ipsec.secrets
sed -i "s/\"${LOGIN}\" : EAP \".*\"/\"${LOGIN}\" : EAP \"${NEW_PASS}\"/" /etc/ipsec.secrets

# Zaktualizuj plik klienta
if [[ -f "${CLIENTS_DIR}/${LOGIN}.conf" ]]; then
    sed -i "s/^PASSWORD=.*/PASSWORD=${NEW_PASS}/" "${CLIENTS_DIR}/${LOGIN}.conf"
fi

ipsec rereadsecrets

info "Hasło użytkownika '${LOGIN}' zostało zmienione."
echo "Nowe hasło: ${NEW_PASS}"
