# ASD Partner Portal — VM Deployment Guide

Instrukcje deployment aplikacji na produkcyjnym serwerze (Virtual Machine).

**Current Setup (VM: 192.160.20.254):**
- App Directory: `/home/psalamon/apps/asd-portal`
- App Port: 3310
- Database Port: 8002
- Database: PostgreSQL (zewnętrzna lub containerized)

---

## 📋 Prerequisites (VM)

Przed deploymentem upewnij się, że VM ma:

```bash
# Check versions on VM
node --version        # 18+ required
npm --version         # 8+ required
git --version         # Required
psql --version        # PostgreSQL client (opcjonalnie)
docker --version      # (opcjonalnie) Jeśli używasz Docker
```

---

## 🚀 Deployment Steps

### Phase 1: Update Code

```bash
cd /home/psalamon/apps/asd-portal

# Fetch latest
git fetch origin

# Pull v0.1.0 (or latest main)
git pull origin main

# Verify version
cat VERSION
git log --oneline -1
```

### Phase 2: Install Dependencies

```bash
npm ci --omit=dev
# (lub npm install jeśli nie masz lock file)
```

### Phase 3: Verify & Update .env

```bash
# Check current .env configuration
cat .env

# Key variables to verify:
# - DATABASE_URL (pointing to correct PostgreSQL)
# - NEXTAUTH_SECRET (must be set!)
# - NEXTAUTH_URL (must be http://192.160.20.254:3310 or your VM IP:port)
# - PORTAL_URL (must be same as NEXTAUTH_URL)
# - APP_PORT=3310

# If NEXTAUTH_SECRET is empty/placeholder, generate one:
openssl rand -base64 32
# Then update .env with the output
```

**Minimal .env Template:**

```bash
# Database (external PostgreSQL on port 8002)
DATABASE_URL="postgresql://asd_portal_user:W3ryfik4cj4@localhost:8002/asd_portal_prod"

# NextAuth
NEXTAUTH_SECRET="your_generated_secret_here"
NEXTAUTH_URL="http://192.160.20.254:3310"
PORTAL_URL="http://192.160.20.254:3310"

# App
APP_PORT=3310

# Optional (for future email support)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=placeholder@asdsystems.pl
SMTP_PASS=placeholder
```

### Phase 4: Database Migrations

```bash
# Run pending Prisma migrations
npx prisma migrate deploy

# Verify database is accessible:
npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) FROM "User";
EOF
```

### Phase 5: Build Application

```bash
# Production build (generates optimized .next output)
npm run build

# Verify build succeeded
ls -la .next/
```

### Phase 6: Start Application

#### Option A: Direct Node Process (Simple)

```bash
# Start production server
npm run start

# Should see: ▲ Next.js 16.2.7 listening on port 3310

# Test in another terminal:
curl http://localhost:3310/login
```

#### Option B: PM2 (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'asd-portal',
    script: 'npm',
    args: 'run start',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3310
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs asd-portal

# Setup auto-restart on VM boot
pm2 startup
pm2 save
```

#### Option C: Docker Compose (If Docker Available)

```bash
# If docker-compose is available:
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f portal
```

### Phase 7: Verify Application

```bash
# Test API
curl http://localhost:3310/api/auth/session

# Should respond with JSON (with or without session)

# Test login page
curl http://localhost:3310/login | head -20

# Should return HTML with login form
```

### Phase 8: Configure Nginx Reverse Proxy (Optional)

If you want to access app via domain (e.g., `partner.asdsystems.eu`):

```bash
# Create Nginx config
sudo tee /etc/nginx/sites-available/asd-portal > /dev/null << 'EOF'
server {
    listen 80;
    server_name 192.160.20.254;  # or your.domain.com

    location / {
        proxy_pass http://127.0.0.1:3310;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/asd-portal /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Now accessible via http://192.160.20.254/
```

### Phase 9: SSL/TLS (When Domain Ready)

Once IT provides `partner.asdsystems.eu` domain with DNS:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot certonly --nginx -d partner.asdsystems.eu

# Update Nginx config to use HTTPS
sudo nano /etc/nginx/sites-available/asd-portal
# Add 443 block with ssl_certificate directives

# Reload Nginx
sudo systemctl reload nginx
```

---

## 📊 Verification Checklist

After deployment, verify:

- [ ] `npm run build` completes without errors
- [ ] `npm run start` starts on port 3310
- [ ] Login page loads: `http://192.160.20.254:3310/login`
- [ ] Test login works: `p.nowak@vendmax.pl` / `demo1234`
- [ ] Dashboard loads after login
- [ ] Can create service order (SERVICE_TECHNICIAN role)
- [ ] Can view orders (WAREHOUSE_SPECIALIST role)
- [ ] Logout works without redirect loops
- [ ] Database migrations applied: `psql ... -c "SELECT version();"`

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Check what's using port 3310
lsof -i :3310

# Kill process if needed
kill -9 <PID>
```

### Database Connection Error

```bash
# Verify PostgreSQL is running
psql postgresql://asd_portal_user:W3ryfik4cj4@localhost:8002/asd_portal_prod -c "SELECT 1;"

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### NEXTAUTH_SECRET Issues

```bash
# Generate new secret
openssl rand -base64 32

# Update .env
sed -i 's/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET="new_secret_here"/' .env

# Restart application
npm run start
```

### Build Fails

```bash
# Clean build cache
rm -rf .next
rm -rf node_modules
npm ci
npm run build
```

---

## 📈 Monitoring & Logs

### View Application Logs

```bash
# If using PM2
pm2 logs asd-portal

# If using direct Node
# Logs go to stdout (capture with supervisor/systemd)

# If using Docker Compose
docker-compose logs -f portal
```

### Check Processes

```bash
# All Node processes
ps aux | grep node

# PM2 status
pm2 status

# Docker containers
docker-compose ps
```

### Database Health

```bash
# Check PostgreSQL connection
psql postgresql://asd_portal_user:W3ryfik4cj4@localhost:8002/asd_portal_prod -c "\dt"

# Should list all tables: users, projects, serviceorders, etc.
```

---

## 🔄 Updates & Redeployment

To deploy a newer version:

```bash
cd /home/psalamon/apps/asd-portal

# Stop current app
npm stop
# or pm2 stop asd-portal
# or docker-compose down

# Update code
git pull origin main

# Reinstall (if package.json changed)
npm ci

# Run migrations (if schema changed)
npx prisma migrate deploy

# Rebuild
npm run build

# Restart
npm run start
# or pm2 start ecosystem.config.js
# or docker-compose up -d
```

---

## 📋 Configuration Matrix

| Component | Development | Production |
|-----------|------------|-----------|
| **Host** | localhost | 192.160.20.254 |
| **Port** | 3000 | 3310 |
| **Database** | localhost:5432 | localhost:8002 |
| **NEXTAUTH_URL** | http://localhost:3000 | http://192.160.20.254:3310 |
| **Node Env** | development | production |
| **Build** | `npm run dev` | `npm run build && npm run start` |

---

## 📞 Support

For deployment issues:
1. Check logs: `pm2 logs asd-portal`
2. Verify .env configuration
3. Check database connectivity
4. Review NEXTAUTH_SECRET and NEXTAUTH_URL
5. Check port availability

**Contact:** Paweł Sałamon (salamonpaw@gmail.com)

---

**Last Updated:** 2026-06-11

**Version:** 0.1.0 — See [CHANGELOG.md](./CHANGELOG.md)
