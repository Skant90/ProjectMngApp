#!/bin/bash
# =============================================================================
# Usuń użytkownika WireGuard VPN
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
WG_CONF="/etc/wireguard/wg0.conf"
CLIENT_CONF="${CLIENTS_DIR}/${LOGIN}.conf"

[[ ! -f "$CLIENT_CONF" ]] && error "Użytkownik '${LOGIN}' nie istnieje."

# Odczytaj klucz publiczny klienta z pliku conf
CLIENT_PUB=$(grep "PrivateKey" "$CLIENT_CONF" | awk '{print $3}' | wg pubkey 2>/dev/null || true)

# Usuń peera z działającego interfejsu
if [[ -n "$CLIENT_PUB" ]]; then
    wg set wg0 peer "$CLIENT_PUB" remove 2>/dev/null || true
fi

# Usuń sekcję [Peer] z pliku konfiguracyjnego serwera
if [[ -n "$CLIENT_PUB" ]]; then
    python3 - "$WG_CONF" "$CLIENT_PUB" << 'PYEOF'
import sys, re
conf_path, pub_key = sys.argv[1], sys.argv[2]
with open(conf_path, 'r') as f:
    content = f.read()
pattern = r'\n\[Peer\]\n# [^\n]*\nPublicKey = ' + re.escape(pub_key) + r'\nAllowedIPs = [^\n]*\n?'
content = re.sub(pattern, '', content)
with open(conf_path, 'w') as f:
    f.write(content)
PYEOF
fi

rm -f "$CLIENT_CONF"

info "Użytkownik '${LOGIN}' usunięty z VPN."
