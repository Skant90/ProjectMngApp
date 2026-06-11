# Instrukcja instalacji ProjectMng na VPS Ubuntu 26.04

## 1. Przygotowanie serwera

```bash
apt update && apt upgrade -y
apt install -y nginx php8.4-fpm php8.4-cli php8.4-pgsql php8.4-sqlite3 \
    php8.4-mbstring php8.4-xml php8.4-curl php8.4-zip php8.4-bcmath \
    php8.4-redis postgresql-16 redis-server nodejs npm git curl ufw fail2ban

# Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
chmod +x /usr/local/bin/composer
```

## 2. PostgreSQL

```bash
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql -c "CREATE USER projectmng WITH PASSWORD 'ZMIEN_HASLO';"
sudo -u postgres psql -c "CREATE DATABASE projectmng OWNER projectmng;"
```

## 3. WireGuard VPN

```bash
apt install -y wireguard

# Generuj klucze serwera
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
chmod 600 /etc/wireguard/server_private.key

# Konfiguracja serwera /etc/wireguard/wg0.conf
SERVER_PRIVATE=$(cat /etc/wireguard/server_private.key)

cat > /etc/wireguard/wg0.conf << EOF
[Interface]
PrivateKey = ${SERVER_PRIVATE}
Address = 10.20.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
EOF

# Włącz IP forwarding
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
sysctl -p

systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0
```

### Dodawanie użytkownika VPN

```bash
# Generuj klucze klienta
CLIENT_NAME="jan"
wg genkey | tee /etc/wireguard/clients/${CLIENT_NAME}_private.key | wg pubkey > /etc/wireguard/clients/${CLIENT_NAME}_public.key

# Znajdź wolny adres IP w podsieci (np. 10.20.0.2)
CLIENT_IP="10.20.0.2"
CLIENT_PUBKEY=$(cat /etc/wireguard/clients/${CLIENT_NAME}_public.key)

# Dodaj do konfiguracji serwera
cat >> /etc/wireguard/wg0.conf << EOF

[Peer]
PublicKey = ${CLIENT_PUBKEY}
AllowedIPs = ${CLIENT_IP}/32
EOF

# Przeładuj WireGuard (bez restartowania sesji)
wg addpeer ${CLIENT_PUBKEY} allowed-ips ${CLIENT_IP}/32

# Generuj plik klienta
SERVER_PUBKEY=$(cat /etc/wireguard/server_public.key)
CLIENT_PRIVKEY=$(cat /etc/wireguard/clients/${CLIENT_NAME}_private.key)

cat > /etc/wireguard/clients/${CLIENT_NAME}.conf << EOF
[Interface]
PrivateKey = ${CLIENT_PRIVKEY}
Address = ${CLIENT_IP}/24
DNS = 1.1.1.1

[Peer]
PublicKey = ${SERVER_PUBKEY}
Endpoint = TWOJ_IP_PUBLICZNY:51820
AllowedIPs = 10.20.0.0/24
PersistentKeepalive = 25
EOF

echo "Plik klienta: /etc/wireguard/clients/${CLIENT_NAME}.conf"
```

### Usuwanie użytkownika VPN

```bash
CLIENT_PUBKEY=$(cat /etc/wireguard/clients/jan_public.key)
wg set wg0 peer ${CLIENT_PUBKEY} remove
# Usuń ręcznie sekcję [Peer] z /etc/wireguard/wg0.conf
```

## 4. Firewall (UFW)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 51820/udp comment 'WireGuard'

# Aplikacja dostępna TYLKO z podsieci VPN
ufw allow from 10.20.0.0/24 to any port 80 comment 'HTTP z VPN'
ufw allow from 10.20.0.0/24 to any port 443 comment 'HTTPS z VPN'

ufw enable
ufw status verbose
```

## 5. Zabezpieczenie SSH

```bash
# Kopiuj klucz SSH na serwer zanim zaczniesz!
# ssh-copy-id -i ~/.ssh/id_ed25519.pub root@TWOJ_IP

# Edytuj /etc/ssh/sshd_config:
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config

systemctl restart ssh

# Fail2ban dla SSH
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
maxretry = 5
bantime = 3600
findtime = 600
EOF
systemctl restart fail2ban
```

## 6. Instalacja aplikacji

```bash
cd /var/www
git clone https://github.com/skant90/projectmngapp.git projectmng
cd projectmng

composer install --no-dev --optimize-autoloader
npm ci && npm run build

cp .env.example .env
php artisan key:generate

# Edytuj .env:
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=projectmng
# DB_USERNAME=projectmng
# DB_PASSWORD=ZMIEN_HASLO
# APP_URL=https://10.20.0.1

php artisan migrate --force
php artisan db:seed --force

chown -R www-data:www-data /var/www/projectmng
chmod -R 775 /var/www/projectmng/storage
chmod -R 775 /var/www/projectmng/bootstrap/cache
```

## 7. Nginx

```nginx
# /etc/nginx/sites-available/projectmng
server {
    listen 10.20.0.1:80;
    server_name 10.20.0.1;

    root /var/www/projectmng/public;
    index index.php;

    # Tylko z podsieci VPN
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

## 8. Backup

```bash
mkdir -p /var/backups/projectmng

cat > /usr/local/bin/projectmng-backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/projectmng

# Backup bazy danych
pg_dump -U projectmng projectmng | gzip > ${BACKUP_DIR}/db_${DATE}.sql.gz

# Backup plików
tar -czf ${BACKUP_DIR}/uploads_${DATE}.tar.gz /var/www/projectmng/storage/app/uploads/

# Rotacja — zachowaj 7 ostatnich backupów
ls -t ${BACKUP_DIR}/db_*.sql.gz | tail -n +8 | xargs -r rm
ls -t ${BACKUP_DIR}/uploads_*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup zakończony: ${DATE}"
EOF

chmod +x /usr/local/bin/projectmng-backup.sh

# Cron — codziennie o 3:00
echo "0 3 * * * root /usr/local/bin/projectmng-backup.sh >> /var/log/projectmng-backup.log 2>&1" > /etc/cron.d/projectmng-backup
```

## 9. Aktualizacja aplikacji

```bash
cd /var/www/projectmng
git pull origin main
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
systemctl reload php8.4-fpm
```

## 10. Konta testowe

| Email | Hasło | Rola |
|-------|-------|------|
| admin@projectmng.local | Admin@12345! | Administrator |
| manager@projectmng.local | Manager@123! | Kierownik |
| piotr@projectmng.local | User@12345! | Użytkownik |
| maria@projectmng.local | User@12345! | Użytkownik |

**WAŻNE: Zmień hasła po pierwszym logowaniu!**
