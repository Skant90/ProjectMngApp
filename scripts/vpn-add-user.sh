#!/bin/bash
# =============================================================================
# Dodaj użytkownika VPN IKEv2
# Użycie: ./vpn-add-user.sh <login> [haslo]
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

[[ $EUID -ne 0 ]] && error "Uruchom jako root."
[[ -z "${1:-}" ]] && error "Podaj login: $0 <login> [haslo]"

LOGIN="$1"
CLIENTS_DIR="/etc/vpn-users"

# Sprawdź czy użytkownik już istnieje
if grep -q "\"${LOGIN}\"" /etc/ipsec.secrets 2>/dev/null; then
    error "Użytkownik '${LOGIN}' już istnieje. Użyj vpn-update-user.sh aby zmienić hasło."
fi

# Generuj hasło jeśli nie podano
if [[ -z "${2:-}" ]]; then
    PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')
    info "Wygenerowano hasło automatycznie."
else
    PASSWORD="$2"
    [[ ${#PASSWORD} -lt 8 ]] && error "Hasło musi mieć co najmniej 8 znaków."
fi

# Dodaj do ipsec.secrets
echo "\"${LOGIN}\" : EAP \"${PASSWORD}\"" >> /etc/ipsec.secrets

# Zapisz dane w pliku klienta
mkdir -p "$CLIENTS_DIR"
chmod 700 "$CLIENTS_DIR"

cat > "${CLIENTS_DIR}/${LOGIN}.conf" << EOF
# Dane VPN użytkownika: ${LOGIN}
# Data utworzenia: $(date '+%Y-%m-%d %H:%M:%S')
LOGIN=${LOGIN}
PASSWORD=${PASSWORD}
EOF
chmod 600 "${CLIENTS_DIR}/${LOGIN}.conf"

# Przeładuj strongSwan (bez przerywania połączeń)
ipsec rereadsecrets

echo ""
echo "════════════════════════════════════════════════"
echo -e "${GREEN} Użytkownik VPN dodany: ${LOGIN}${NC}"
echo "════════════════════════════════════════════════"
echo ""

# Wyświetl instrukcję konfiguracji Windows
VPN_IP=$(grep -oP 'leftid=\K[^\s]+' /etc/ipsec.conf 2>/dev/null || echo "TWOJ_IP")

echo "  Dane do połączenia (Windows):"
echo "  ─────────────────────────────────────────"
echo "  Adres serwera: ${VPN_IP}"
echo "  Typ VPN:       IKEv2"
echo "  Login:         ${LOGIN}"
echo "  Hasło:         ${PASSWORD}"
echo ""
echo "  Kroki konfiguracji Windows:"
echo "  1. Zainstaluj certyfikat CA (jednorazowo)"
echo "     - Pobierz: /root/projectmng-vpn-ca.cer"
echo "     - Kliknij dwukrotnie → Zainstaluj certyfikat"
echo "     - Wybierz: Komputer lokalny → Zaufane główne urzędy certyfikacji"
echo ""
echo "  2. Ustawienia → Sieć → VPN → Dodaj połączenie VPN:"
echo "     Dostawca:      Windows (wbudowany)"
echo "     Nazwa:         ProjectMng VPN"
echo "     Adres serwera: ${VPN_IP}"
echo "     Typ VPN:       IKEv2"
echo "     Logowanie:     Nazwa użytkownika i hasło"
echo "     Login:         ${LOGIN}"
echo "     Hasło:         ${PASSWORD}"
echo ""
