#!/bin/bash

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_FILE="/var/log/asd-portal/deploy.log"
LOG_DIR=$(dirname "$LOG_FILE")
SERVICE_NAME="asd-portal"

# Ensure log directory exists
mkdir -p "$LOG_DIR"
touch "$LOG_FILE"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

cd "$SCRIPT_DIR"

# Pull latest FIRST, then re-exec the freshly pulled script once. This avoids
# the self-update race where bash runs a stale copy of this file after the
# git reset swaps it underneath a running process.
if [ -z "$DEPLOY_REEXEC" ]; then
  log "Resetting to origin/main..."
  git fetch origin
  git reset --hard origin/main
  export DEPLOY_REEXEC=1
  exec bash "$SCRIPT_DIR/deploy.sh" "$@"
fi

log "=========================================="
log "Starting ASD Portal deployment"
log "=========================================="

# 2. Install dependencies
log "Installing dependencies..."
npm ci

# 3. Sync database schema
# Uses `db push` (not `migrate deploy`) because the production DB was created
# manually and has no _prisma_migrations table. db push aligns the schema to
# prisma/schema.prisma without requiring migration history.
log "Syncing database schema (prisma db push)..."
npx prisma db push

# 4. Generate Prisma Client
log "Generating Prisma Client..."
npx prisma generate

# 5. Build application
log "Building application..."
npm run build

# 6. Restart service
log "Restarting service..."
systemctl restart "$SERVICE_NAME"
systemctl enable "$SERVICE_NAME"

log "=========================================="
log "Deployment completed successfully"
log "=========================================="
log "Service status:"
systemctl status "$SERVICE_NAME" --no-pager || true
