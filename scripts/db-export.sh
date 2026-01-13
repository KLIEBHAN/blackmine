#!/bin/bash
set -e

BACKUP_DIR="${1:-.}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/redmine_backup_$TIMESTAMP.db"

if command -v docker &> /dev/null && docker compose ps --quiet app 2>/dev/null | grep -q .; then
  docker compose cp app:/app/data/redmine.db "$BACKUP_FILE"
else
  cp dev.db "$BACKUP_FILE"
fi

echo "Backup created: $BACKUP_FILE"
