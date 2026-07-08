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

log "=========================================="
log "Starting ASD Portal deployment"
log "=========================================="

cd "$SCRIPT_DIR"

# 1. Reset to origin/main
log "Resetting to origin/main..."
git fetch origin
git reset --hard origin/main

# 2. Install dependencies
log "Installing dependencies..."
npm ci

# 3. Sync database schema
# Uses `db push` (not `migrate deploy`) because the production DB was created
# manually and has no _prisma_migrations table. db push aligns the schema to
# prisma/schema.prisma without requiring migration history.
log "Syncing database schema (prisma db push)..."
npx prisma db push --skip-generate

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
