#!/bin/bash
set -e
ENV_FILE="/home/psalamon/apps/asd-portal/.env"
TOKEN=$(grep '^CRON_SECRET_TOKEN=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')
curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:3310/api/cron/discount-lifecycle
echo
