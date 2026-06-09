# Deployment Guide — ASD Partner Portal

## Quick Start (Local Docker)

```bash
# Clone repository
git clone <repo-url> portal
cd portal

# Create .env file
cat > .env.local <<EOF
# Database
DB_USER=asd
DB_PASSWORD=asd_prod_pass
DB_NAME=asd_portal
DB_PORT=5432

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=ASD Partner Portal <portal@asdsystems.eu>

# Order Form
ORDER_FORM_URL=https://sales.asdsystems.pl/
PORTAL_URL=http://localhost:3000

# App
APP_PORT=3000
EOF

# Start containers
docker-compose up -d

# Initialize database (first time only)
docker-compose exec portal npx prisma migrate deploy
docker-compose exec portal npx prisma db seed

# Check logs
docker-compose logs -f portal
```

Visit: **http://localhost:3000**

---

## Production Deployment (VM)

### Prerequisites
- Docker + Docker Compose installed
- Ubuntu 20.04+ or similar
- Reverse proxy (nginx recommended)

### Setup

1. **Clone and configure:**
   ```bash
   ssh user@your-vm.com
   cd /opt
   git clone <repo-url> asd-portal
   cd asd-portal
   ```

2. **Create production `.env`:**
   ```bash
   cat > .env.local <<EOF
   # Database
   DB_USER=asd_prod
   DB_PASSWORD=$(openssl rand -base64 32)
   DB_NAME=asd_portal_prod
   DB_PORT=5432

   # Next.js
   NEXTAUTH_URL=https://portal.asdsystems.eu
   NEXTAUTH_SECRET=$(openssl rand -base64 32)

   # Email
   SMTP_HOST=your-smtp.com
   SMTP_PORT=587
   SMTP_SECURE=true
   SMTP_USER=noreply@asdsystems.eu
   SMTP_PASS=your-password
   SMTP_FROM=ASD Partner Portal <noreply@asdsystems.eu>

   # Order Form
   ORDER_FORM_URL=https://sales.asdsystems.pl/
   PORTAL_URL=https://portal.asdsystems.eu

   # App
   APP_PORT=3000
   EOF
   ```

3. **Start services:**
   ```bash
   docker-compose -f docker-compose.yml up -d
   
   # Initialize DB
   docker-compose exec portal npx prisma migrate deploy
   docker-compose exec portal npx prisma db seed
   ```

4. **Setup nginx reverse proxy:**
   ```bash
   sudo apt install nginx
   
   # Create /etc/nginx/sites-available/portal
   ```
   
   ```nginx
   upstream portal_backend {
       server 127.0.0.1:3000;
   }

   server {
       listen 80;
       server_name portal.asdsystems.eu;
       
       # Redirect to HTTPS
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name portal.asdsystems.eu;
       
       ssl_certificate /etc/letsencrypt/live/portal.asdsystems.eu/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/portal.asdsystems.eu/privkey.pem;
       
       client_max_body_size 50M;
       
       location / {
           proxy_pass http://portal_backend;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **SSL Certificate (Let's Encrypt):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot certonly --nginx -d portal.asdsystems.eu
   ```

---

## Management

### View logs
```bash
docker-compose logs -f portal
docker-compose logs -f postgres
```

### Database backup
```bash
docker-compose exec postgres pg_dump -U asd asd_portal > backup.sql
```

### Database restore
```bash
cat backup.sql | docker-compose exec -T postgres psql -U asd asd_portal
```

### Restart services
```bash
docker-compose restart
```

### Update application
```bash
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose exec portal npx prisma migrate deploy
```

---

## Environment Variables Reference

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | Yes | — | Auto-generated from DB_* vars |
| `NEXTAUTH_URL` | Yes | — | Public app URL |
| `NEXTAUTH_SECRET` | Yes | — | Generate: `openssl rand -base64 32` |
| `SMTP_HOST` | No | — | Email server hostname |
| `SMTP_PORT` | No | `587` | Email server port |
| `SMTP_USER` | No | — | Email account |
| `SMTP_PASS` | No | — | Email password/token |
| `SMTP_FROM` | No | `portal@asdsystems.eu` | Sender email |
| `ORDER_FORM_URL` | No | `https://sales.asdsystems.pl/` | External order form |
| `PORTAL_URL` | No | `http://localhost:3000` | Used in emails |

---

## Troubleshooting

**Port 3000 already in use:**
```bash
docker-compose down
# or change APP_PORT in .env
```

**Database connection failed:**
```bash
docker-compose logs postgres
# Ensure DB_PASSWORD matches in docker-compose.yml
```

**Prisma migration errors:**
```bash
docker-compose exec portal npx prisma migrate reset
# ⚠️  This will delete all data!
```

**Email not sending:**
- Verify SMTP credentials
- Check logs: `docker-compose logs portal | grep -i email`
- Test SMTP: `docker-compose exec portal node -e "require('nodemailer').createTransport({host:'...'}).verify(console.log)"`

---

## First-time Admin Setup

After deployment, create admin user:

```bash
psql postgresql://asd:asd_prod_pass@localhost:5432/asd_portal
```

```sql
-- Generate password hash (run locally first)
-- Node.js: const bcrypt = require('bcrypt');
--          console.log(await bcrypt.hash('TymczasoweHaslo', 10))

INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  'admin-' || gen_random_uuid()::text,
  'p.salamon@asdsystems.pl',
  '$2a$10$...',  -- bcrypt hash
  'Paweł Salamon',
  'ADMIN',
  NOW(),
  NOW()
);
```

Then visit: `https://portal.asdsystems.eu/admin/users`

---

## Performance & Caching (Level 2: ISR + Redis)

The landing page uses a two-layer caching strategy for optimal performance:

### How It Works

1. **Redis Cache (60s TTL)** – Content cached in memory, ~50ms response
2. **ISR Revalidation** – Fresh data every 60 seconds
3. **Admin Invalidation** – Cache clears instantly when content is updated
4. **Database Fallback** – If Redis down, queries database directly

### Performance Metrics

```
Cache hit (subsequent requests):    ~50ms
Cache miss (fresh data):            ~350ms
Admin update + next request:        ~350ms (instant clear + fresh fetch)
```

### Configuration

Environment variables (already set in docker-compose.yml):
```bash
REDIS_URL=redis://redis:6379  # Default, change if using remote Redis
```

### Monitoring Cache

```bash
# Check Redis cache contents
docker-compose exec redis redis-cli

# View all landing page caches
> KEYS landing:*

# Check specific content cache
> GET landing:Landing\ page

# Clear all caches (if needed)
> FLUSHALL
```

### For VM Deployment (Level 3: Edge Caching)

When deployed to your VM:

1. **Nginx Caching** – Add cache headers to public responses:
```nginx
location ~* ^/$ {
    proxy_pass http://portal:3000;
    proxy_cache_valid 200 60s;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
}
```

2. **Optional: Remove Redis** – If behind Nginx, Redis becomes optional:
   - ISR still works (NextJS handles revalidation)
   - Cache misses hit Nginx layer instead
   - Reduces infrastructure complexity

3. **Recommended Stack** – If you want max performance:
   - Nginx cache (HTTP layer)
   - Redis cache (application layer)
   - Database (source of truth)

No code changes needed – everything is configured to work with both strategies.

---

## Support

For issues or questions, check logs and contact the development team.
