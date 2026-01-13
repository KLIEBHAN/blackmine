#!/bin/sh
set -e

DB_PATH="${DATABASE_URL#file:}"
DB_DIR=$(dirname "$DB_PATH")

echo "Database path: $DB_PATH"
echo "Database dir: $DB_DIR"
echo "Contents of $DB_DIR:"
ls -la "$DB_DIR" 2>/dev/null || echo "(directory empty or not accessible)"

# Function to apply a migration if not already applied
apply_migration() {
  migration_name="$1"
  migration_file="$2"
  
  # Check if migration tracking table exists, create if not
  sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS _prisma_migrations (
    id TEXT PRIMARY KEY,
    migration_name TEXT NOT NULL UNIQUE,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );" 2>/dev/null || true
  
  # Check if migration was already applied
  applied=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM _prisma_migrations WHERE migration_name='$migration_name';" 2>/dev/null || echo "0")
  
  if [ "$applied" = "0" ]; then
    echo "Applying migration: $migration_name"
    sqlite3 "$DB_PATH" < "$migration_file"
    sqlite3 "$DB_PATH" "INSERT INTO _prisma_migrations (id, migration_name) VALUES ('$(cat /proc/sys/kernel/random/uuid 2>/dev/null || date +%s%N)', '$migration_name');"
    echo "Migration applied: $migration_name"
  else
    echo "Migration already applied: $migration_name"
  fi
}

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found. Initializing..."
  # Apply all migrations in order
  for migration_dir in prisma/migrations/*/; do
    if [ -f "${migration_dir}migration.sql" ]; then
      migration_name=$(basename "$migration_dir")
      apply_migration "$migration_name" "${migration_dir}migration.sql"
    fi
  done
  echo "Database initialized."
else
  echo "Existing database found ($(stat -c%s "$DB_PATH" 2>/dev/null || stat -f%z "$DB_PATH") bytes)"
  echo "Checking for pending migrations..."
  # Apply any pending migrations
  for migration_dir in prisma/migrations/*/; do
    if [ -f "${migration_dir}migration.sql" ]; then
      migration_name=$(basename "$migration_dir")
      apply_migration "$migration_name" "${migration_dir}migration.sql"
    fi
  done
fi

exec "$@"
