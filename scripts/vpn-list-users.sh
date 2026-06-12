#!/bin/bash
# =============================================================================
# Lista użytkowników WireGuard VPN + status połączeń
# =============================================================================
[[ $EUID -ne 0 ]] && echo "Uruchom jako root." && exit 1

CLIENTS_DIR="/etc/vpn-users"

echo "══════════════════════════════════════"
echo " Użytkownicy WireGuard VPN"
echo "══════════════════════════════════════"

shopt -s nullglob
confs=("${CLIENTS_DIR}/"*.conf)
if [[ ${#confs[@]} -eq 0 ]]; then
    echo "  Brak użytkowników. Dodaj: ./scripts/vpn-add-user.sh <login>"
else
    for f in "${confs[@]}"; do
        login=$(basename "$f" .conf)
        ip=$(grep "^Address" "$f" | awk '{print $3}' | cut -d/ -f1)
        echo "  • ${login} (${ip})"
    done
fi

echo ""
echo "Aktywne połączenia WireGuard:"
wg show wg0 2>/dev/null | grep -A3 "peer:" | grep -E "peer:|endpoint:|latest handshake:" || echo "  Brak aktywnych połączeń."
echo ""
echo "Status interfejsu:"
wg show wg0 2>/dev/null | head -5 || echo "  WireGuard nie działa."
echo ""
