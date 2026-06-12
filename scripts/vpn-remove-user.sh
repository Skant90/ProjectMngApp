#!/bin/bash
# =============================================================================
# Usuń użytkownika VPN L2TP/IPSec
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
CHAP_SECRETS="/etc/ppp/chap-secrets"

grep -qP "^${LOGIN}\s" "$CHAP_SECRETS" 2>/dev/null || error "Użytkownik '${LOGIN}' nie istnieje."

sed -i "/^${LOGIN}\s/d" "$CHAP_SECRETS"
rm -f "${CLIENTS_DIR}/${LOGIN}.conf"

info "Użytkownik '${LOGIN}' usunięty z VPN."
