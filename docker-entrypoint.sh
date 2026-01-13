#!/bin/sh
set -e

DB_PATH="${DATABASE_URL#file:}"
DB_DIR=$(dirname "$DB_PATH")

echo "Database path: $DB_PATH"
echo "Database dir: $DB_DIR"
echo "Contents of $DB_DIR:"
ls -la "$DB_DIR" 2>/dev/null || echo "(directory empty or not accessible)"

ensure_migrations_table() {
  sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS _prisma_migrations (
    id TEXT PRIMARY KEY,
    migration_name TEXT NOT NULL UNIQUE,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );" 2>/dev/null || true
}

is_migration_applied() {
  migration_name="$1"
  applied=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM _prisma_migrations WHERE migration_name='$migration_name';" 2>/dev/null || echo "0")
  [ "$applied" != "0" ]
}

mark_migration_applied() {
  migration_name="$1"
  sqlite3 "$DB_PATH" "INSERT OR IGNORE INTO _prisma_migrations (id, migration_name) VALUES ('$(date +%s%N)', '$migration_name');"
}

table_exists() {
  table_name="$1"
  result=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='$table_name';" 2>/dev/null || echo "0")
  [ "$result" != "0" ]
}

column_exists() {
  table_name="$1"
  column_name="$2"
  result=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM pragma_table_info('$table_name') WHERE name='$column_name';" 2>/dev/null || echo "0")
  [ "$result" != "0" ]
}

apply_migration() {
  migration_name="$1"
  migration_file="$2"
  
  ensure_migrations_table
  
  if is_migration_applied "$migration_name"; then
    echo "Migration already applied: $migration_name"
    return 0
  fi
  
  echo "Applying migration: $migration_name"
  if sqlite3 "$DB_PATH" < "$migration_file" 2>&1; then
    mark_migration_applied "$migration_name"
    echo "Migration applied: $migration_name"
  else
    echo "Migration failed (may be partially applied): $migration_name"
    mark_migration_applied "$migration_name"
  fi
}

bootstrap_existing_db() {
  echo "Bootstrapping migration history for existing database..."
  ensure_migrations_table
  
  if table_exists "User" && table_exists "Project" && table_exists "Issue" && table_exists "TimeEntry"; then
    mark_migration_applied "20260112000238_init"
    echo "Marked init migration as applied (tables exist)"
  fi
  
  if table_exists "Comment" && column_exists "User" "passwordHash"; then
    mark_migration_applied "20260113185235_add_password_hash"
    echo "Marked add_password_hash migration as applied (Comment table and passwordHash column exist)"
  fi
}

apply_manual_fixes() {
  echo "Applying manual schema fixes if needed..."
  
  if ! column_exists "User" "passwordHash"; then
    echo "Adding missing passwordHash column to User table..."
    sqlite3 "$DB_PATH" "ALTER TABLE User ADD COLUMN passwordHash TEXT NOT NULL DEFAULT '';"
    echo "Added passwordHash column"
  fi
  
  if ! table_exists "Comment"; then
    echo "Creating missing Comment table..."
    sqlite3 "$DB_PATH" "CREATE TABLE Comment (
      id TEXT NOT NULL PRIMARY KEY,
      content TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL,
      issueId TEXT NOT NULL,
      authorId TEXT NOT NULL,
      CONSTRAINT Comment_issueId_fkey FOREIGN KEY (issueId) REFERENCES Issue (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT Comment_authorId_fkey FOREIGN KEY (authorId) REFERENCES User (id) ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS Comment_issueId_idx ON Comment(issueId);
    CREATE INDEX IF NOT EXISTS Comment_authorId_idx ON Comment(authorId);"
    echo "Created Comment table"
  fi
  
  if table_exists "Comment" && column_exists "User" "passwordHash"; then
    mark_migration_applied "20260113185235_add_password_hash"
  fi
}

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found. Initializing..."
  touch "$DB_PATH"
  for migration_dir in prisma/migrations/*/; do
    if [ -f "${migration_dir}migration.sql" ]; then
      migration_name=$(basename "$migration_dir")
      apply_migration "$migration_name" "${migration_dir}migration.sql"
    fi
  done
  echo "Database initialized."
else
  echo "Existing database found ($(stat -c%s "$DB_PATH" 2>/dev/null || stat -f%z "$DB_PATH") bytes)"
  
  bootstrap_existing_db
  apply_manual_fixes
  
  echo "Checking for pending migrations..."
  for migration_dir in prisma/migrations/*/; do
    if [ -f "${migration_dir}migration.sql" ]; then
      migration_name=$(basename "$migration_dir")
      apply_migration "$migration_name" "${migration_dir}migration.sql"
    fi
  done
fi

exec "$@"
