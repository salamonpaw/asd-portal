# VM Deployment — Complete Step-by-Step Guide

## Prerequisites

✅ **Your Setup:**
- SSH access to VM (you have it)
- Docker installed  
- PostgreSQL new instance on port 8002 (avoid 8001 collision)
- App accessible via IP initially, later: `partner.asdsystems.eu`
- SMTP: Microsoft 365 (IT will provide credentials)
- ~2GB free disk space

---

## Phase 1: Setup & Clone

```bash
# SSH to VM
ssh user@your-vm-ip

# Create project directory
mkdir -p /opt/projects/asd-portal
cd /opt/projects/asd-portal

# Clone repository
git clone <your-repo-url> .

# Verify
ls -la
```

---

## Phase 2: Environment Configuration

### Create `.env` file

```bash
cat > .env << 'EOF'
# Database (PostgreSQL) - Port 8002 to avoid collision
DB_USER=asd_portal_user
DB_PASSWORD=ChangeMeToSecurePassword123!
DB_NAME=asd_portal_prod
DB_PORT=8002

# Redis
REDIS_PORT=6379

# Next.js / Auth
# For now: http://YOUR_VM_IP:3000
# Later: https://partner.asdsystems.eu
NEXTAUTH_URL=http://YOUR_VM_IP:3000
NEXTAUTH_SECRET=your-secret-key-change-this

# Email (SMTP) - Microsoft 365 from IT
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-office365-email@asdsystems.pl
SMTP_PASS=your-office365-app-password
SMTP_FROM=ASD Partner Portal <portal@asdsystems.eu>

# Business
ORDER_FORM_URL=https://sales.asdsystems.pl/
PORTAL_URL=http://YOUR_VM_IP:3000

# Docker
APP_PORT=3000
EOF

chmod 600 .env
```

Generate secure secret:
```bash
openssl rand -base64 32
# Copy output to NEXTAUTH_SECRET in .env
```

---

## Phase 3: Update Docker Compose

Edit `docker-compose.yml` - change PostgreSQL port from 5432 to 8002:

```bash
nano docker-compose.yml
```

Find `postgres:` service, change this line:
```yaml
ports:
  - "8002:5432"  # Changed from 5432
```

Verify:
```bash
grep -A 2 "ports:" docker-compose.yml | grep -A 1 postgres
```

---

## Phase 4: Start Database Services

```bash
# Start postgres + redis
docker-compose up -d postgres redis

# Wait for startup
sleep 30

# Check health
docker-compose ps
# Status should be: healthy

# Verify no errors
docker-compose logs postgres | tail -10
docker-compose logs redis | tail -10
```

---

## Phase 5: Initialize Database

```bash
# Run migrations
docker-compose exec portal npx prisma migrate deploy

# Seed default data
docker-compose exec portal npx prisma db seed

# Verify
docker-compose exec postgres psql -U asd_portal_user -d asd_portal_prod -c "SELECT COUNT(*) FROM \"ContentItem\";"
# Should show: count ~100
```

---

## Phase 6: Start Full Stack

```bash
# Start all services
docker-compose up -d

# Verify all running
docker ps
# Should see: postgres, redis, portal

# Check app logs
docker-compose logs -f portal
# Wait for: "✓ Ready in XXXms"
# Press Ctrl+C
```

---

## Phase 7: Test via IP

```bash
# Test app
curl http://YOUR_VM_IP:3000/
# Should return HTML

# Test API
curl http://YOUR_VM_IP:3000/api/content?group=Landing%20page | jq '.[] | .key' | head -10

# Test login in browser:
# http://YOUR_VM_IP:3000/
# p.nowak@vendmax.pl / demo1234
```

---

## Phase 8: Nginx Reverse Proxy (HTTP)

### Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Create Config

```bash
sudo nano /etc/nginx/sites-available/asd-portal
```

Paste (replace YOUR_VM_IP):

```nginx
server {
    listen 80;
    server_name YOUR_VM_IP;

    # Proxy to app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 30d;
        expires 30d;
    }

    # Landing page caching (Level 3)
    location = / {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 60s;
        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

### Enable & Test

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/asd-portal /etc/nginx/sites-enabled/

# Test
sudo nginx -t
# Should show: "ok"

# Reload
sudo systemctl reload nginx

# Test via Nginx
curl http://YOUR_VM_IP/
# Should return HTML
```

---

## Phase 9: HTTPS Later (When IT provides domain)

Once IT configures DNS for `partner.asdsystems.eu`:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot certonly --nginx -d partner.asdsystems.eu

# Certbot will automatically update Nginx config
# Just reload:
sudo systemctl reload nginx
```

---

## Verification Checklist

```bash
# All containers running
docker ps | grep asd-portal

# Database connected
docker-compose exec postgres psql -U asd_portal_user -d asd_portal_prod -c "\dt"

# Redis working
docker-compose exec redis redis-cli PING
# Response: PONG

# App responding
curl http://YOUR_VM_IP:3000/ | head -10

# API working
curl http://YOUR_VM_IP:3000/api/content?group=Landing%20page | jq . | head -5

# Nginx proxying
curl http://YOUR_VM_IP/ | head -10

# Check Redis cache
docker-compose exec redis redis-cli KEYS landing:*
```

---

## Troubleshooting

### Port 8002 already in use
```bash
sudo lsof -i :8002
# Kill process if needed:
sudo kill -9 <PID>
```

### Database won't start
```bash
docker-compose logs postgres
# Check .env DB password matches docker-compose
cat .env | grep DB_PASSWORD
```

### App won't start
```bash
docker-compose logs portal
# Common issues:
# - DB_PORT wrong (should be 8002)
# - DB_PASSWORD mismatch
# - NEXTAUTH_SECRET missing or invalid
```

### Can't access from browser
```bash
# Check Nginx error log
sudo tail -20 /var/log/nginx/error.log

# Verify app is running
docker ps | grep portal

# Test locally
curl http://127.0.0.1:3000/
```

---

## Logs & Monitoring

```bash
# All services
docker-compose logs -f

# Just app
docker-compose logs -f portal

# Just database
docker-compose logs -f postgres

# Nginx
sudo journalctl -u nginx -f

# Check Redis cache status
docker-compose exec redis redis-cli INFO stats
```

---

## Maintenance Commands

```bash
# Restart all services
docker-compose restart

# Update app (new deployment)
git pull
docker-compose build --no-cache
docker-compose up -d
docker-compose exec portal npx prisma migrate deploy

# Backup database
docker-compose exec postgres pg_dump -U asd_portal_user asd_portal_prod > backup-$(date +%Y%m%d).sql

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL

# View app size
docker-compose exec portal du -sh /app/.next
```

---

## Summary of Defaults (from seed)

Test accounts already in database:

```
Partner:     p.nowak@vendmax.pl / demo1234
Sales Rep:   m.kowalczyk@asdsystems.pl / demo1234
Admin demo:  admin@asdsystems.pl / demo1234
Admin real:  p.salamon@asdsystems.pl / TymczasoweHaslo
```

---

## Next: SMTP Configuration

Once IT provides Office 365 credentials:

```bash
# Update .env
nano .env
# SMTP_USER=your.name@asdsystems.pl
# SMTP_PASS=xxxx-xxxx-xxxx-xxxx

# Restart app
docker-compose restart portal

# Test email sending (via admin panel or manually)
```

---

## Ready? Let's Go! 🚀

Questions or issues? Check logs first:
```bash
docker-compose logs -f portal
```
