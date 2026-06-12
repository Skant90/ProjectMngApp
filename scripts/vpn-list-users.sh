#!/bin/bash
# =============================================================================
# Lista użytkowników VPN L2TP/IPSec + status
# =============================================================================
[[ $EUID -ne 0 ]] && echo "Uruchom jako root." && exit 1

CHAP_SECRETS="/etc/ppp/chap-secrets"
CLIENTS_DIR="/etc/vpn-users"

echo "══════════════════════════════════════"
echo " Użytkownicy VPN L2TP/IPSec"
echo "══════════════════════════════════════"

if ! grep -qP "^\w" "$CHAP_SECRETS" 2>/dev/null; then
    echo "  Brak użytkowników. Dodaj: ./scripts/vpn-add-user.sh <login>"
else
    grep -P "^\w" "$CHAP_SECRETS" | awk '{print "  •", $1}'
fi

echo ""
echo "Klucz PSK: $(cat "${CLIENTS_DIR}/.psk" 2>/dev/null || echo 'nieznany')"
echo "Serwer:    $(cat "${CLIENTS_DIR}/.server_ip" 2>/dev/null || echo 'nieznany')"
echo ""
echo "Aktywne tunele IPSec:"
swanctl --list-sas 2>/dev/null | grep -E "ESTABLISHED|l2tp" || echo "  Brak aktywnych połączeń."
echo ""
