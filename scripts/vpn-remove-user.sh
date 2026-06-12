#!/bin/bash
# =============================================================================
# Usuń użytkownika VPN IKEv2 (strongSwan 6.x / swanctl)
# Użycie: ./vpn-remove-user.sh <login>
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

[[ $EUID -ne 0 ]] && error "Uruchom jako root."
[[ -z "${1:-}" ]] && error "Podaj login: $0 <login>"

LOGIN="$1"
SWANCTL_DIR="/etc/swanctl"
CLIENTS_DIR="/etc/vpn-users"
EAP_CONF="${SWANCTL_DIR}/conf.d/eap-${LOGIN}.conf"

[[ ! -f "$EAP_CONF" ]] && error "Użytkownik '${LOGIN}' nie istnieje."

rm -f "$EAP_CONF"
rm -f "${CLIENTS_DIR}/${LOGIN}.conf"

swanctl --load-creds

info "Użytkownik '${LOGIN}' usunięty z VPN."
