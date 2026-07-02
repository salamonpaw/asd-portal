#!/bin/bash

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_FILE="/var/log/asd-portal/deploy.log"
LOG_DIR=$(dirname "$LOG_FILE")
SERVICE_NAME="asd-portal"
USER="psalamon"

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

# 3. Apply database migrations
log "Applying database migrations..."
npx prisma migrate deploy

# 4. Generate Prisma Client
log "Generating Prisma Client..."
npx prisma generate

# 5. Build application
log "Building application..."
npm run build

# 6. Stop old service if running
log "Stopping old service..."
systemctl stop "$SERVICE_NAME" || true

# 7. Start service
log "Starting service..."
systemctl start "$SERVICE_NAME"
systemctl enable "$SERVICE_NAME"

log "=========================================="
log "Deployment completed successfully"
log "=========================================="
log "Service status:"
systemctl status "$SERVICE_NAME"
