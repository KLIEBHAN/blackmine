#!/bin/sh
set -e

DB_PATH="${DATABASE_URL#file:}"
DB_DIR=$(dirname "$DB_PATH")

echo "Database path: $DB_PATH"
echo "Database dir: $DB_DIR"
echo "Contents of $DB_DIR:"
ls -la "$DB_DIR" 2>/dev/null || echo "(directory empty or not accessible)"

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found. Initializing..."
  ./node_modules/.bin/prisma db push --url "$DATABASE_URL"
  echo "Database ready. Run 'docker compose exec app npx tsx prisma/seed.ts' to seed demo data."
else
  echo "Existing database found ($(stat -c%s "$DB_PATH" 2>/dev/null || stat -f%z "$DB_PATH") bytes)"
  echo "Applying pending migrations..."
  ./node_modules/.bin/prisma migrate deploy
fi

exec "$@"
