# Deploy Guide — Posify SaaS (VPS RumahZone)

## Server Info
- **Provider:** RumahZone
- **Hostname:** vps.ahsanprod.my.id
- **IP:** 103.247.11.172
- **Specs:** 1 Core, 2330 MB RAM, 40 GB SSD
- **OS:** Ubuntu 22.04

---

## 1. Initial Server Setup

```bash
# SSH ke server
ssh root@103.247.11.172

# Update system
apt update && apt upgrade -y

# Install essentials
apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

# Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

## 2. Install Node.js (via NVM)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
nvm alias default 22
npm install -g pm2
```

---

## 3. Install PostgreSQL

```bash
apt install -y postgresql postgresql-contrib

# Create database & user
sudo -u postgres psql
CREATE USER posify WITH PASSWORD 'YOUR_SECURE_PASSWORD_HERE';
CREATE DATABASE posify_db OWNER posify;
GRANT ALL PRIVILEGES ON DATABASE posify_db TO posify;
\q
```

---

## 4. Install Redis

```bash
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server
```

---

## 5. Clone & Setup Project

```bash
# Create app directory
mkdir -p /var/www/posify
cd /var/www/posify

# Clone repository
git clone https://github.com/sopyanahsan/maslahattani-v2.git .
git checkout feat/sprint1-ngalir-rebrand-pin-login

# Backend setup
cd backend
cp .env.example .env
# Edit .env:
#   DATABASE_URL=postgresql://posify:YOUR_PASSWORD@localhost:5432/posify_db
#   JWT_SECRET=your-random-64-char-secret
#   JWT_REFRESH_SECRET=another-random-64-char-secret
#   PORT=3000
#   CORS_ORIGIN=https://app.posify.id,https://kasir.posify.id,https://owner.posify.id

npm install
npx prisma migrate deploy
npx prisma generate
npm run build

# Frontend setup
cd ../frontend
cp .env.example .env
# Edit .env:
#   VITE_API_BASE_URL=https://api.posify.id/api
#   VITE_APP_TITLE=Posify

npm install
npm run build
```

---

## 6. PM2 Process Manager

```bash
cd /var/www/posify/backend

# Start backend with PM2
pm2 start dist/main.js --name posify-api -i 1 --max-memory-restart 500M

# Save PM2 config
pm2 save
pm2 startup  # follow instructions to auto-start on reboot
```

---

## 7. Nginx Configuration

### Create config files:

```bash
nano /etc/nginx/sites-available/posify
```

```nginx
# ===========================================
# API Backend (api.posify.id)
# ===========================================
server {
    listen 80;
    server_name api.posify.id;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # WebSocket support (for /realtime namespace)
        proxy_read_timeout 86400;
    }

    # File upload limit
    client_max_body_size 10M;
}

# ===========================================
# Admin Panel (app.posify.id)
# ===========================================
server {
    listen 80;
    server_name app.posify.id;

    root /var/www/posify/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# ===========================================
# Kasir Webapp (kasir.posify.id)
# ===========================================
server {
    listen 80;
    server_name kasir.posify.id;

    root /var/www/posify/frontend/dist;
    index webapp/index.html;

    location / {
        try_files $uri $uri/ /webapp/index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# ===========================================
# Owner Dashboard (owner.posify.id)
# ===========================================
server {
    listen 80;
    server_name owner.posify.id;

    root /var/www/posify/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# ===========================================
# Landing Page (posify.id / www.posify.id)
# ===========================================
server {
    listen 80;
    server_name posify.id www.posify.id;

    root /var/www/posify/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable & test:

```bash
ln -s /etc/nginx/sites-available/posify /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## 8. SSL Certificates (Let's Encrypt)

```bash
# Get SSL for all domains at once
certbot --nginx -d posify.id -d www.posify.id -d app.posify.id -d api.posify.id -d kasir.posify.id -d owner.posify.id

# Auto-renew (already set up by certbot, verify with):
systemctl status certbot.timer
```

---

## 9. DNS Setup (di domain registrar)

Arahkan semua subdomain ke IP VPS:

| Type | Name | Value |
|------|------|-------|
| A | @ | 103.247.11.172 |
| A | www | 103.247.11.172 |
| A | app | 103.247.11.172 |
| A | api | 103.247.11.172 |
| A | kasir | 103.247.11.172 |
| A | owner | 103.247.11.172 |

---

## 10. Update / Deploy New Version

```bash
cd /var/www/posify

# Pull latest
git pull origin feat/sprint1-ngalir-rebrand-pin-login

# Backend
cd backend
npm install
npx prisma migrate deploy
npm run build
pm2 restart posify-api

# Frontend
cd ../frontend
npm install
npm run build

# Done! Nginx serves static files, no restart needed.
```

---

## 11. Monitoring & Maintenance

```bash
# PM2 status
pm2 status
pm2 logs posify-api --lines 50

# Database backup (daily cron)
crontab -e
# Add: 0 3 * * * pg_dump -U posify posify_db | gzip > /var/backups/posify_$(date +\%Y\%m\%d).sql.gz

# Disk usage
df -h
du -sh /var/www/posify

# Memory
free -h
htop
```

---

## 12. Environment Variables (.env Backend)

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://posify:PASSWORD@localhost:5432/posify_db

# JWT
JWT_SECRET=generate-64-char-random-string-here
JWT_REFRESH_SECRET=another-64-char-random-string-here
JWT_EXPIRATION=86400
JWT_REFRESH_EXPIRATION=2592000

# CORS
CORS_ORIGIN=https://app.posify.id,https://kasir.posify.id,https://owner.posify.id,https://posify.id

# Redis (optional, for rate-limit/cache)
REDIS_URL=redis://localhost:6379
```

---

## Checklist Deploy

- [ ] Domain posify.id dibeli & DNS diarahkan
- [ ] SSH ke VPS bisa
- [ ] PostgreSQL + Redis running
- [ ] Node 22 + PM2 installed
- [ ] Project cloned & built
- [ ] .env configured
- [ ] Prisma migration deployed
- [ ] PM2 running backend
- [ ] Nginx config active
- [ ] SSL certificates installed
- [ ] Test: posify.id (landing), app.posify.id (admin), api.posify.id/api/health
- [ ] Backup cron active
