#!/usr/bin/env bash
# Nightly Postgres backup for the shared server, run from cPanel cron:
#
#   15 20 * * * DATABASE_URL='postgres://...' bash ~/dplus24/scripts/backup-db.sh
#
# On the server the password comes from ~/.pgpass, so the URL carries none.
#
# Keeps the last BACKUP_KEEP_DAYS days of compressed dumps in BACKUP_DIR.
# These sit on the same server as the database, so download one now and then.
set -euo pipefail
umask 077 # dumps hold admin password hashes and customer details

: "${DATABASE_URL:?DATABASE_URL is not set}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/dplus}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/dplus-$(date +%Y%m%d-%H%M%S).sql.gz"

pg_dump --no-owner --no-acl "$DATABASE_URL" | gzip > "$file.partial"
mv "$file.partial" "$file"

find "$BACKUP_DIR" -name 'dplus-*.sql.gz' -mtime +"$BACKUP_KEEP_DAYS" -delete
echo "Backed up to $file"
