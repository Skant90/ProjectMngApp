#!/bin/bash
# =============================================================================
# Dodaj użytkownika WireGuard VPN
# Użycie: ./vpn-add-user.sh <login>
# Generuje plik .conf który użytkownik importuje w kliencie WireGuard
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
COUNTER_FILE="${CLIENTS_DIR}/.ip_counter"
CLIENT_CONF="${CLIENTS_DIR}/${LOGIN}.conf"

[[ ! -f "$WG_CONF" ]] && error "WireGuard nie jest skonfigurowany. Uruchom najpierw vpn-setup-ikev2.sh."
[[ -f "$CLIENT_CONF" ]] && error "Użytkownik '${LOGIN}' już istnieje."

SERVER_IP=$(cat "${CLIENTS_DIR}/.server_ip" 2>/dev/null || error "Brak pliku .server_ip")
SERVER_PORT=$(cat "${CLIENTS_DIR}/.server_port" 2>/dev/null || echo "51820")
SERVER_PUB=$(cat "${CLIENTS_DIR}/.server_pub" 2>/dev/null || error "Brak klucza publicznego serwera")

# Przydziel kolejny adres IP
COUNTER=$(cat "$COUNTER_FILE" 2>/dev/null || echo "2")
CLIENT_IP="10.20.0.${COUNTER}"
echo $((COUNTER + 1)) > "$COUNTER_FILE"

# Wygeneruj klucze klienta
CLIENT_PRIVATE=$(wg genkey)
CLIENT_PUBLIC=$(echo "$CLIENT_PRIVATE" | wg pubkey)

# Plik konfiguracyjny dla klienta (Windows import)
cat > "$CLIENT_CONF" << EOF
[Interface]
PrivateKey = ${CLIENT_PRIVATE}
Address = ${CLIENT_IP}/32
DNS = 1.1.1.1

[Peer]
PublicKey = ${SERVER_PUB}
Endpoint = ${SERVER_IP}:${SERVER_PORT}
AllowedIPs = 10.20.0.0/24
PersistentKeepalive = 25
EOF
chmod 600 "$CLIENT_CONF"

# Dodaj peera do serwera
cat >> "$WG_CONF" << EOF

[Peer]
# ${LOGIN}
PublicKey = ${CLIENT_PUBLIC}
AllowedIPs = ${CLIENT_IP}/32
EOF

# Przeładuj WireGuard bez przerywania połączeń
wg addconf wg0 <(echo -e "[Peer]\nPublicKey = ${CLIENT_PUBLIC}\nAllowedIPs = ${CLIENT_IP}/32")

echo ""
echo "════════════════════════════════════════════════"
echo -e "${GREEN} Użytkownik VPN dodany: ${LOGIN}${NC}"
echo "════════════════════════════════════════════════"
echo ""
echo "  Plik konfiguracyjny: ${CLIENT_CONF}"
echo "  Adres VPN klienta:   ${CLIENT_IP}"
echo ""
echo "  Pobierz plik na swój komputer:"
echo "  scp -P 9122 root@${SERVER_IP}:${CLIENT_CONF} C:\\Users\\leszek\\Desktop\\${LOGIN}-vpn.conf"
echo ""
echo "  Krok 1 — zainstaluj klienta (jednorazowo):"
echo "  https://www.wireguard.com/install/"
echo ""
echo "  Krok 2 — importuj tunel:"
echo "  Otwórz WireGuard → Import tunnel(s) from file → wybierz ${LOGIN}-vpn.conf → Activate"
echo ""
echo "  Gotowe — żadnych certyfikatów, żadnych haseł, jeden klik."
echo ""
