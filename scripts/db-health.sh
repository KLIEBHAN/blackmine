#!/usr/bin/env bash
set -euo pipefail

CONTAINER="${1:-docker-blackmine-app-1}"

DATABASE_URL=$(docker exec -i "$CONTAINER" sh -lc 'printf "%s" "$DATABASE_URL"')
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set in container: $CONTAINER"
  exit 1
fi

DB_PATH="${DATABASE_URL#file:}"

echo "Database: $DB_PATH"

docker exec -i "$CONTAINER" sh -lc "sqlite3 \"$DB_PATH\" \".schema Issue\""
docker exec -i "$CONTAINER" sh -lc "sqlite3 \"$DB_PATH\" \".schema Comment\""
docker exec -i "$CONTAINER" sh -lc "sqlite3 \"$DB_PATH\" \"select migration_name, finished_at from _prisma_migrations order by finished_at;\""
docker exec -i "$CONTAINER" sh -lc "sqlite3 \"$DB_PATH\" \"select descriptionFormat, count(*) from Issue group by descriptionFormat;\""
docker exec -i "$CONTAINER" sh -lc "sqlite3 \"$DB_PATH\" \"select contentFormat, count(*) from Comment group by contentFormat;\""
