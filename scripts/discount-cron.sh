#!/bin/bash
# Codzienny cron portalu (timer asd-discount-cron, 07:00): cykl życia rabatów + przypomnienia e-mail
set -e
ENV_FILE="/home/psalamon/apps/asd-portal/.env"
TOKEN=$(grep '^CRON_SECRET_TOKEN=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')
for ENDPOINT in discount-lifecycle reminders; do
  echo "== $ENDPOINT =="
  curl -sS -H "Authorization: Bearer $TOKEN" "http://localhost:3310/api/cron/$ENDPOINT"
  echo
done
