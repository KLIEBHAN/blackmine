#!/bin/sh
set -e

DB_PATH="${DATABASE_URL#file:}"

if [ -z "$DB_PATH" ] || [ "$DB_PATH" = "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL must be set and start with 'file:'"
  exit 1
fi

echo "Database: $DB_PATH"

generate_id() {
  head -c 16 /dev/urandom 2>/dev/null | od -An -tx1 | tr -d ' \n' || date +%s
}

ensure_migrations_table() {
  sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS _prisma_migrations (
    id TEXT PRIMARY KEY,
    migration_name TEXT NOT NULL UNIQUE,
    finished_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );"
}

is_migration_applied() {
  count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM _prisma_migrations WHERE migration_name='$1';")
  [ "$count" != "0" ]
}

apply_migration() {
  name="$1"
  file="$2"
  
  if is_migration_applied "$name"; then
    echo "  [skip] $name"
    return 0
  fi
  
  echo "  [apply] $name"
  if ! sqlite3 "$DB_PATH" < "$file"; then
    echo "Error: Migration $name failed"
    exit 1
  fi
  
  sqlite3 "$DB_PATH" "INSERT INTO _prisma_migrations (id, migration_name) VALUES ('$(generate_id)', '$name');"
}

run_migrations() {
  ensure_migrations_table
  
  for dir in prisma/migrations/*/; do
    [ -f "${dir}migration.sql" ] || continue
    apply_migration "$(basename "$dir")" "${dir}migration.sql"
  done
}

if [ ! -f "$DB_PATH" ]; then
  echo "Initializing new database..."
  touch "$DB_PATH"
fi

echo "Running migrations..."
run_migrations
echo "Ready."

exec "$@"
