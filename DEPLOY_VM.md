# VM Deployment — Complete Step-by-Step Guide

## Prerequisites

- VM with Docker installed
- SSH access (if remote)
- ~2GB free disk space
- Domain name (or will use IP)

---

## Phase 1: Setup Directories & Clone

```bash
# Connect to VM
ssh user@your-vm-ip

# Create project directory
mkdir -p /opt/projects/asd-portal
cd /opt/projects/asd-portal

# Clone repository
git clone <your-repo-url> .

# Verify structure
ls -la  # Should see: docker-compose.yml, Dockerfile, prisma/, app/, etc
```

---

## Phase 2: Environment Configuration

### Create `.env` file

```bash
cat > .env << 'EOF'
# Database (PostgreSQL)
DB_USER=asd_portal_user
DB_PASSWORD=your_secure_password_here_change_this
DB_NAME=asd_portal_prod
DB_PORT=5432

# Redis
REDIS_PORT=6379

# Next.js / Auth
NEXTAUTH_URL=https://portal.asdsystems.eu
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=ASD Partner Portal <portal@asdsystems.eu>

# Business
ORDER_FORM_URL=https://sales.asdsystems.pl/
PORTAL_URL=https://portal.asdsystems.eu

# Docker
APP_PORT=3000
EOF

chmod 600 .env  # Secure permissions
```

### Generate NEXTAUTH_SECRET securely

```bash
# If openssl not in .env, run:
openssl rand -base64 32
# Copy output to .env NEXTAUTH_SECRET value
```

---

## Phase 3: Database Setup

### Option A: New PostgreSQL Instance (Recommended for isolation)

```bash
# Update docker-compose.yml ports if needed
# Default: postgres on 5432 (fine if no other projects use it)

# Start only postgres + redis first
docker-compose up -d postgres redis

# Verify health
docker-compose logs postgres
docker-compose logs redis

# Wait for startup (30-60 seconds)
sleep 30
```

### Option B: Reuse Existing PostgreSQL

If you have existing postgres on same server:

```bash
# Modify .env to point to existing DB:
DB_PORT=5433  # Or whatever your existing postgres uses

# Update docker-compose.yml - comment out postgres service:
# postgres:
#   image: postgres:16-alpine
#   ... (entire section commented)

# Start only redis + app
docker-compose up -d redis
```

---

## Phase 4: Initialize Database

```bash
# Run migrations
docker-compose exec portal npx prisma migrate deploy

# Seed with default data
docker-compose exec portal npx prisma db seed

# Verify data
docker-compose exec postgres psql -U asd_portal_user -d asd_portal_prod -c "SELECT COUNT(*) FROM \"ContentItem\";"
# Should return: count=100+
```

---

## Phase 5: Start Full Stack

```bash
# Start all services
docker-compose up -d

# Verify all containers running
docker ps
# Should see: postgres, redis, portal (asd-portal-postgres, asd-portal-redis, asd-portal-app)

# Check app logs
docker-compose logs -f portal

# Wait for "Ready on" message (~30s)
```

---

## Phase 6: Nginx Reverse Proxy + SSL

### Install Nginx (if not present)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Configure Nginx + Auto SSL

Create config file:

```bash
sudo nano /etc/nginx/sites-available/portal.asdsystems.eu
```

Paste:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name portal.asdsystems.eu;

    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect HTTP → HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name portal.asdsystems.eu;

    # SSL Certificates (will be created by certbot)
    ssl_certificate /etc/letsencrypt/live/portal.asdsystems.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.asdsystems.eu/privkey.pem;

    # Security headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy to Docker app
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

    # Caching for static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 30d;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Cache landing page (Level 3 optimization)
    location ~* ^/$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 60s;
        proxy_cache_key "$scheme$request_method$host$request_uri$cookie_sessionid";
        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

Enable config:

```bash
sudo ln -s /etc/nginx/sites-available/portal.asdsystems.eu /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### Get SSL Certificate

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d portal.asdsystems.eu

# Follow prompts (email, agree to terms)
# Certificates saved to /etc/letsencrypt/live/portal.asdsystems.eu/

# Auto-renewal (certbot handles this automatically)
sudo systemctl enable certbot.timer
```

---

## Phase 7: Verify Deployment

```bash
# Test HTTPS
curl https://portal.asdsystems.eu/api/content?group=Landing%20page | jq '.[0]'

# Check cache working
docker-compose exec redis redis-cli KEYS landing:*

# Check logs
docker-compose logs portal | tail -20
```

---

## Phase 8: First Admin User

If you need to create admin account:

```bash
# Get postgres container shell
docker-compose exec postgres psql -U asd_portal_user -d asd_portal_prod

# Run seed query to add admin
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  'admin-' || gen_random_uuid()::text,
  'p.salamon@asdsystems.pl',
  '$2a$10$XYZ...',  -- bcrypt hash of password
  'Paweł Salamon',
  'ADMIN',
  NOW(),
  NOW()
);

\q  # Exit psql
```

Or use seed data (default admin password: `TymczasoweHaslo`):
```bash
docker-compose exec portal npx prisma db seed
```

---

## Troubleshooting

### Port 3000 already in use
```bash
# Change in docker-compose.yml:
# ports:
#   - "3001:3000"  # External:Internal

# Or kill existing process:
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Redis connection failed
```bash
# Restart redis
docker-compose restart redis

# Check logs
docker-compose logs redis
```

### Database connection error
```bash
# Verify postgres is healthy
docker-compose logs postgres

# Check env vars
cat .env | grep DB_

# Reset postgres (careful - loses data!)
docker-compose down
docker volume rm asd-portal_postgres_data
docker-compose up -d postgres
```

### Nginx not proxying
```bash
# Check Nginx error log
sudo tail -50 /var/log/nginx/error.log

# Verify docker app is running
docker ps | grep portal

# Test local curl
curl http://127.0.0.1:3000/
```

---

## Maintenance

### View Logs
```bash
docker-compose logs -f portal          # App logs
docker-compose logs -f postgres        # Database logs  
docker-compose logs -f redis           # Cache logs
sudo journalctl -u nginx -f            # Nginx logs
```

### Backup Database
```bash
docker-compose exec postgres pg_dump -U asd_portal_user asd_portal_prod \
  > backup-$(date +%Y%m%d).sql
```

### Update Application
```bash
git pull origin main
docker-compose build --no-cache
docker-compose up -d portal
docker-compose exec portal npx prisma migrate deploy
```

### Clear Cache
```bash
docker-compose exec redis redis-cli FLUSHALL
```

---

## Security Checklist

- [ ] `.env` file permissions: `chmod 600 .env`
- [ ] Change default passwords (DB, SMTP)
- [ ] Set strong NEXTAUTH_SECRET
- [ ] Enable SSL/HTTPS
- [ ] Firewall: only allow 80, 443, 22 (SSH)
- [ ] Regular backups of `/opt/projects/asd-portal`
- [ ] Monitor logs for errors

---

## Next Steps

1. Test all routes: https://portal.asdsystems.eu/
2. Login with seeded account: `p.nowak@vendmax.pl` / `demo1234`
3. Test admin panel: `p.salamon@asdsystems.pl` / `TymczasoweHaslo`
4. Monitor performance: Check Redis cache with `redis-cli`
5. Setup automated backups (optional)

---

**Questions? Check logs first:** `docker-compose logs -f`
