#!/bin/bash
# =============================================================================
# Lista użytkowników VPN + status połączeń (strongSwan 6.x / swanctl)
# =============================================================================
[[ $EUID -ne 0 ]] && echo "Uruchom jako root." && exit 1

SWANCTL_DIR="/etc/swanctl"

echo "══════════════════════════════════════"
echo " Użytkownicy VPN IKEv2"
echo "══════════════════════════════════════"

shopt -s nullglob
eap_files=("${SWANCTL_DIR}/conf.d/eap-"*.conf)
if [[ ${#eap_files[@]} -eq 0 ]]; then
    echo "  Brak użytkowników. Dodaj: ./scripts/vpn-add-user.sh <login>"
else
    for f in "${eap_files[@]}"; do
        login=$(grep -oP 'id = \K\S+' "$f" 2>/dev/null | head -1)
        echo "  • ${login}"
    done
fi

echo ""
echo "Aktywne połączenia:"
swanctl --list-sas 2>/dev/null | grep -E "ikev2-vpn|ESTABLISHED" || echo "  Brak aktywnych połączeń."
echo ""
