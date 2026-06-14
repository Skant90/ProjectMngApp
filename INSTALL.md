# Instrukcja instalacji ProjectMng na VPS Ubuntu 26.04

## Architektura dostępu

```
Internet
   │
   ├── port 22/TCP  → SSH (zarządzanie serwerem)
   ├── port 500/UDP → IKEv2 VPN
   └── port 4500/UDP→ IKEv2 VPN NAT-T
         │
         VPN IKEv2/IPSec (strongSwan)
         │
         Klienci w podsieci 10.20.0.100–200
         │
         Nginx (nasłuchuje tylko na interfejsie VPN)
         │
         Aplikacja Laravel (port 80/443, tylko z VPN)
```

**VPN działa natywnie na Windows 10/11 — bez dodatkowego oprogramowania.**

---

## 1. Przygotowanie serwera

```bash
apt update && apt upgrade -y
apt install -y nginx php8.4-fpm php8.4-cli php8.4-pgsql php8.4-sqlite3 \
    php8.4-mbstring php8.4-xml php8.4-curl php8.4-zip php8.4-bcmath \
    postgresql-16 nodejs npm git curl ufw fail2ban \
    strongswan strongswan-pki libcharon-extra-plugins \
    libcharon-extauth-plugins libstrongswan-extra-plugins \
    iptables-persistent

# Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
chmod +x /usr/local/bin/composer
```

---

## 2. PostgreSQL

```bash
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql -c "CREATE USER projectmng WITH PASSWORD 'ZMIEN_MOCNE_HASLO';"
sudo -u postgres psql -c "CREATE DATABASE projectmng OWNER projectmng;"
```

---

## 3. VPN IKEv2/IPSec — konfiguracja serwera

### Automatyczna instalacja

```bash
# Pobierz repo
git clone https://github.com/skant90/projectmngapp.git /var/www/projectmng
cd /var/www/projectmng

# Uruchom instalator VPN (podaj publiczne IP serwera)
chmod +x scripts/*.sh
./scripts/vpn-setup-ikev2.sh 51.38.141.84
#                             ↑ zastąp swoim publicznym IP
```

Skrypt automatycznie:
- Instaluje i konfiguruje strongSwan
- Generuje certyfikaty CA i serwera
- Konfiguruje IP forwarding i NAT
- Ustawia firewall (UFW)
- Eksportuje certyfikat CA dla klientów Windows: `/root/projectmng-vpn-ca.cer`

### Dodawanie użytkownika VPN

```bash
./scripts/vpn-add-user.sh jan
# lub z własnym hasłem:
./scripts/vpn-add-user.sh jan "MojeHaslo123!"
```

Skrypt wydrukuje gotowe dane do wpisania w Windows.

### Inne operacje VPN

```bash
./scripts/vpn-remove-user.sh jan          # usuń użytkownika
./scripts/vpn-update-password.sh jan nowe  # zmień hasło
./scripts/vpn-list-users.sh               # lista użytkowników + połączenia
```

---

## 4. Konfiguracja VPN na Windows 10/11

> Wykonaj **jednorazowo** dla każdego komputera.

### Krok 1 — Pobierz i zainstaluj certyfikat CA

1. Skopiuj plik `/root/projectmng-vpn-ca.cer` z serwera na komputer użytkownika  
   (np. przez SCP: `scp root@IP:/root/projectmng-vpn-ca.cer C:\Users\Jan\Downloads\`)

2. Kliknij dwukrotnie pobrany plik `projectmng-vpn-ca.cer`

3. Kliknij **Zainstaluj certyfikat**

4. Wybierz **Komputer lokalny** → Dalej

5. Wybierz **Umieść wszystkie certyfikaty w następującym magazynie** → Przeglądaj

6. Wybierz **Zaufane główne urzędy certyfikacji** → OK → Dalej → Zakończ

7. Potwierdź ostrzeżenie bezpieczeństwa klikając **Tak**

### Krok 2 — Dodaj połączenie VPN

**Windows 11:**  
`Ustawienia → Sieć i internet → VPN → Dodaj połączenie VPN`

**Windows 10:**  
`Ustawienia → Sieć i Internet → VPN → Dodaj połączenie VPN`

Wypełnij formularz:

| Pole | Wartość |
|------|---------|
| Dostawca sieci VPN | **Windows (wbudowany)** |
| Nazwa połączenia | ProjectMng VPN |
| Nazwa lub adres serwera | `1.2.3.4` ← Twoje IP serwera |
| Typ sieci VPN | **IKEv2** |
| Typ informacji logowania | Nazwa użytkownika i hasło |
| Nazwa użytkownika | `jan` ← login z `vpn-add-user.sh` |
| Hasło | `****` ← hasło z `vpn-add-user.sh` |

Kliknij **Zapisz**.

### Krok 3 — Połącz się

Kliknij ikonę sieci w zasobniku → wybierz **ProjectMng VPN** → **Połącz**

**Gotowe!** Aplikacja będzie dostępna pod adresem `http://10.20.0.1` lub `https://10.20.0.1`

---

## 5. Konfiguracja VPN na innych systemach

### macOS (natywnie)

`Ustawienia systemowe → Sieć → + → Nowe połączenie → VPN → IKEv2`

| Pole | Wartość |
|------|---------|
| Adres serwera | `1.2.3.4` |
| Identyfikator zdalny | `1.2.3.4` |
| Metoda uwierzytelniania | Nazwa użytkownika |
| Nazwa użytkownika | `jan` |
| Hasło | `****` |

Zaimportuj certyfikat CA (ten sam plik `.pem`):
```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/projectmng-vpn-ca.pem
```

### iOS (natywnie)

`Ustawienia → Ogólne → VPN i zarządzanie urządzeniami → VPN → Dodaj konfigurację VPN`
- Typ: **IKEv2**
- Serwer: IP serwera
- Login: login użytkownika

### Android

Zainstaluj darmową aplikację **strongSwan VPN Client** (Google Play).

### Linux

```bash
# Ubuntu/Debian
apt install network-manager-strongswan

# Lub przez CLI
nmcli connection add type vpn vpn-type ikev2 \
    con-name "ProjectMng" \
    vpn.data "address=1.2.3.4,username=jan" \
    vpn.secrets "password=haslo"
```

---

## 6. Instalacja aplikacji

```bash
cd /var/www/projectmng

composer install --no-dev --optimize-autoloader
npm ci && npm run build

cp .env.example .env
php artisan key:generate

# Edytuj .env:
# APP_URL=http://10.20.0.1
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=projectmng
# DB_USERNAME=projectmng
# DB_PASSWORD=ZMIEN_MOCNE_HASLO

php artisan migrate --force
php artisan db:seed --force

chown -R www-data:www-data /var/www/projectmng
chmod -R 775 /var/www/projectmng/storage
chmod -R 775 /var/www/projectmng/bootstrap/cache
```

---

## 7. Nginx

```nginx
# /etc/nginx/sites-available/projectmng
server {
    # Nasłuchuj TYLKO na interfejsie VPN — niedostępne z internetu
    listen 10.20.0.1:80;
    server_name 10.20.0.1;

    root /var/www/projectmng/public;
    index index.php;

    # Dodatkowe zabezpieczenie — tylko z podsieci VPN
    allow 10.20.0.0/24;
    deny all;

    client_max_body_size 50M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/projectmng /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## 8. Zabezpieczenie SSH

```bash
# UWAGA: Najpierw dodaj swój klucz SSH!
# ssh-copy-id -i ~/.ssh/id_ed25519.pub root@TWOJ_IP

# Wyłącz logowanie hasłem
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart ssh

# Fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
maxretry = 5
bantime = 3600
findtime = 600
EOF
systemctl restart fail2ban
```

---

## 9. Backup

```bash
mkdir -p /var/backups/projectmng

cat > /usr/local/bin/projectmng-backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/projectmng

pg_dump -U projectmng projectmng | gzip > ${BACKUP_DIR}/db_${DATE}.sql.gz
tar -czf ${BACKUP_DIR}/uploads_${DATE}.tar.gz /var/www/projectmng/storage/app/uploads/

# Zachowaj 7 ostatnich
ls -t ${BACKUP_DIR}/db_*.sql.gz | tail -n +8 | xargs -r rm
ls -t ${BACKUP_DIR}/uploads_*.tar.gz | tail -n +8 | xargs -r rm
EOF

chmod +x /usr/local/bin/projectmng-backup.sh
echo "0 3 * * * root /usr/local/bin/projectmng-backup.sh >> /var/log/projectmng-backup.log 2>&1" > /etc/cron.d/projectmng-backup
```

---

## 10. Aktualizacja aplikacji

```bash
cd /var/www/projectmng
git pull origin main
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan optimize
systemctl reload php8.4-fpm
```

---

## 11. Rozwiązywanie problemów VPN

### Windows: "Połączenie nie powiodło się"

```
Problem: Certyfikat CA nie jest zaufany
Rozwiązanie: Ponownie zainstaluj certyfikat CA jako "Zaufany główny urząd certyfikacji"
             dla "Komputera lokalnego" (nie bieżącego użytkownika!)
```

### Windows: "Brak odpowiedzi od serwera"

```bash
# Sprawdź czy porty są otwarte
ufw status
netstat -tulnp | grep -E '500|4500'
systemctl status strongswan-starter
```

### Sprawdź logi VPN

```bash
journalctl -u strongswan-starter -f
# lub
tail -f /var/log/syslog | grep charon
```

### Sprawdź aktywne połączenia

```bash
ipsec status
ipsec statusall
```

---

## 12. Konta testowe aplikacji

| E-mail | Hasło | Rola |
|--------|-------|------|
| admin@projectmng.local | Admin@12345! | Administrator |
| manager@projectmng.local | Manager@123! | Kierownik |
| piotr@projectmng.local | User@12345! | Użytkownik |
| maria@projectmng.local | User@12345! | Użytkownik |

**Zmień hasła po pierwszym logowaniu!**
