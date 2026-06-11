#!/bin/bash
# =============================================================================
# Lista użytkowników VPN + status połączeń
# =============================================================================
[[ $EUID -ne 0 ]] && echo "Uruchom jako root." && exit 1

echo "══════════════════════════════════════"
echo " Użytkownicy VPN IKEv2"
echo "══════════════════════════════════════"

# Lista z ipsec.secrets
grep ': EAP' /etc/ipsec.secrets 2>/dev/null | while read -r line; do
    login=$(echo "$line" | grep -oP '"\K[^"]+(?=".*EAP)')
    echo "  • ${login}"
done

echo ""
echo "Aktywne połączenia:"
ipsec status 2>/dev/null | grep -E "ESTABLISHED|ikev2" || echo "  Brak aktywnych połączeń."
echo ""
