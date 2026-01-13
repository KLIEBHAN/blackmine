#!/bin/bash
set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file.db>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: File not found: $BACKUP_FILE"
  exit 1
fi

if command -v docker &> /dev/null && docker compose ps --quiet app 2>/dev/null | grep -q .; then
  docker compose cp "$BACKUP_FILE" app:/app/data/redmine.db
  docker compose restart app
  echo "Database imported and app restarted."
else
  cp "$BACKUP_FILE" dev.db
  echo "Database imported: dev.db"
fi
