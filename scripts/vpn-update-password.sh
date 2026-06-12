#!/bin/bash
# =============================================================================
# Regeneruj klucze użytkownika WireGuard (odpowiednik zmiany hasła)
# Użycie: ./vpn-update-password.sh <login>
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

[[ $EUID -ne 0 ]] && error "Uruchom jako root."
[[ -z "${1:-}" ]] && error "Użycie: $0 <login>"

LOGIN="$1"
CLIENTS_DIR="/etc/vpn-users"

[[ ! -f "${CLIENTS_DIR}/${LOGIN}.conf" ]] && error "Użytkownik '${LOGIN}' nie istnieje."

info "Regeneruję klucze dla '${LOGIN}' — usuń stary tunel w kliencie WireGuard i zaimportuj nowy."

# Usuń i dodaj ponownie
bash "$(dirname "$0")/vpn-remove-user.sh" "$LOGIN"
bash "$(dirname "$0")/vpn-add-user.sh" "$LOGIN"
