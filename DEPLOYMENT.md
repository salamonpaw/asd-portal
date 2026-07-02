# Deployment Guide — ASD Partner Portal

## One-time Setup

### 1. Install Node.js (if not already installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Set up log directory
```bash
sudo mkdir -p /var/log/asd-portal
sudo chown psalamon:psalamon /var/log/asd-portal
```

### 3. Copy systemd service file
```bash
sudo cp /Users/pawel/Zgłaszanie\ projektów/portal/asd-portal.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable asd-portal
```

### 4. Ensure deploy.sh is executable
```bash
chmod +x /Users/pawel/Zgłaszanie\ projektów/portal/deploy.sh
```

### 5. Create sudo rule (optional — allows deploy without password)
```bash
echo "psalamon ALL=(ALL) NOPASSWD: /usr/bin/systemctl start asd-portal, /usr/bin/systemctl stop asd-portal, /usr/bin/systemctl restart asd-portal, /usr/bin/systemctl enable asd-portal" | sudo tee -a /etc/sudoers.d/asd-portal
```

---

## Deployment

### Full Deploy (Reset + Build + Start)
```bash
cd /Users/pawel/Zgłaszanie\ projektów/portal
sudo -u psalamon ./deploy.sh
```

This will:
- ✅ Fetch latest from origin/main
- ✅ Reset local changes
- ✅ Install dependencies (npm ci)
- ✅ Run database migrations
- ✅ Generate Prisma Client
- ✅ Build the application
- ✅ Stop old service
- ✅ Start new service via systemd
- ✅ Log everything to `/var/log/asd-portal/deploy.log`

### Check Service Status
```bash
systemctl status asd-portal
```

### View Logs
```bash
# Last 50 lines
journalctl -u asd-portal -n 50

# Follow logs in real-time
journalctl -u asd-portal -f

# Full deploy log
cat /var/log/asd-portal/deploy.log
```

### Restart Service
```bash
sudo systemctl restart asd-portal
```

### Stop Service
```bash
sudo systemctl stop asd-portal
```

---

## How It Works

1. **deploy.sh** — handles the entire deployment pipeline
   - Pulls latest code from git
   - Installs dependencies
   - Runs migrations
   - Builds the app
   - Starts/restarts the service

2. **asd-portal.service** — systemd service unit
   - Runs the app as `psalamon` user
   - Auto-restarts on failure (after 10s)
   - Logs to systemd journal
   - Starts on boot

3. **Environment** — loaded from `.env.local`
   - DATABASE_URL
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL
   - etc.

---

## Troubleshooting

### Service won't start
```bash
journalctl -u asd-portal -n 100  # Check logs
systemctl status asd-portal      # Check status
```

### Port 3000 already in use
```bash
sudo lsof -i :3000  # Find what's using it
sudo kill -9 <PID>  # Kill it
sudo systemctl restart asd-portal
```

### Database migration fails
```bash
npx prisma migrate status  # Check migration status
npx prisma migrate deploy  # Try again manually
```

### Build fails
```bash
npm ci              # Clean install
npm run build       # Build manually to see error
```

---

## Manual Commands (if needed)

```bash
# Manual build
cd /Users/pawel/Zgłaszanie\ projektów/portal
npm ci
npm run build

# Start dev server manually
npm run dev

# Reset everything
git reset --hard origin/main
npm ci
npx prisma migrate deploy
npm run build
sudo systemctl restart asd-portal
```

---

## Production Checklist

- [ ] `.env.local` is configured with production values
- [ ] Database is set up and accessible
- [ ] PostgreSQL is running and responding
- [ ] systemd service is enabled: `systemctl is-enabled asd-portal`
- [ ] Service auto-restarts on failure
- [ ] Logs are being written to `/var/log/asd-portal/deploy.log`
- [ ] NEXTAUTH_SECRET is set and same across deployments
- [ ] NEXTAUTH_URL matches actual domain/port
