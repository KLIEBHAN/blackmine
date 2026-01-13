#!/bin/sh
# One-time script to bootstrap _prisma_migrations table for legacy databases
# that were created with 'prisma db push' instead of 'prisma migrate'
#
# Usage: DATABASE_URL="file:/path/to/db" ./scripts/bootstrap-migrations.sh

set -e

DB_PATH="${DATABASE_URL#file:}"

if [ -z "$DB_PATH" ] || [ "$DB_PATH" = "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL must be set (e.g., DATABASE_URL=file:./dev.db)"
  exit 1
fi

if [ ! -f "$DB_PATH" ]; then
  echo "Error: Database file not found: $DB_PATH"
  exit 1
fi

echo "Bootstrapping migrations for: $DB_PATH"

table_exists() {
  count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='$1';")
  [ "$count" != "0" ]
}

column_exists() {
  count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM pragma_table_info('$1') WHERE name='$2';")
  [ "$count" != "0" ]
}

generate_id() {
  head -c 16 /dev/urandom 2>/dev/null | od -An -tx1 | tr -d ' \n' || date +%s
}

sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS _prisma_migrations (
  id TEXT PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  finished_at DATETIME DEFAULT CURRENT_TIMESTAMP
);"

if table_exists "User" && table_exists "Project" && table_exists "Issue" && table_exists "TimeEntry"; then
  sqlite3 "$DB_PATH" "INSERT OR IGNORE INTO _prisma_migrations (id, migration_name) VALUES ('$(generate_id)', '20260112000238_init');"
  echo "Marked 20260112000238_init as applied"
fi

if table_exists "Comment" && column_exists "User" "passwordHash"; then
  sqlite3 "$DB_PATH" "INSERT OR IGNORE INTO _prisma_migrations (id, migration_name) VALUES ('$(generate_id)', '20260113185235_add_password_hash');"
  echo "Marked 20260113185235_add_password_hash as applied"
fi

echo "Done. Current migrations:"
sqlite3 "$DB_PATH" "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY migration_name;"
