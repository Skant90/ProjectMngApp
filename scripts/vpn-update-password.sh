#!/bin/bash
# =============================================================================
# Zmień hasło użytkownika VPN (strongSwan 6.x / swanctl)
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
SWANCTL_DIR="/etc/swanctl"
CLIENTS_DIR="/etc/vpn-users"
EAP_CONF="${SWANCTL_DIR}/conf.d/eap-${LOGIN}.conf"

[[ ${#NEW_PASS} -lt 8 ]] && error "Hasło musi mieć co najmniej 8 znaków."
[[ ! -f "$EAP_CONF" ]] && error "Użytkownik '${LOGIN}' nie istnieje."

# Nadpisz plik sekretów
cat > "$EAP_CONF" << EOF
secrets {
    eap-${LOGIN} {
        id = ${LOGIN}
        secret = "${NEW_PASS}"
    }
}
EOF
chmod 600 "$EAP_CONF"

# Zaktualizuj plik klienta
if [[ -f "${CLIENTS_DIR}/${LOGIN}.conf" ]]; then
    sed -i "s/^PASSWORD=.*/PASSWORD=${NEW_PASS}/" "${CLIENTS_DIR}/${LOGIN}.conf"
fi

swanctl --load-creds

info "Hasło użytkownika '${LOGIN}' zostało zmienione."
echo "Nowe hasło: ${NEW_PASS}"
