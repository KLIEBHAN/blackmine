#!/bin/sh
set -e

DB_PATH="${DATABASE_URL#file:}"

if [ ! -f "$DB_PATH" ]; then
  echo "Initializing database..."
  npx prisma db push --url "$DATABASE_URL"
  echo "Database ready. Run 'docker compose exec app npx tsx prisma/seed.ts' to seed demo data."
fi

exec "$@"
