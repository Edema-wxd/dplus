#!/usr/bin/env bash
# Dumps the Neon database into a file the shared server's Postgres 10 accepts.
#
#   NEON_DATABASE_URL='postgres://…' bash scripts/dump-neon.sh dplus.sql
#
# Neon runs Postgres 18, so this needs a pg_dump at least that new
# (brew install postgresql@18). The output is then edited for Postgres 10:
#   - psql 10 doesn't know the \restrict / \unrestrict guard lines
#   - transaction_timeout (17+) and default_table_access_method (12+) don't exist
#   - the public schema already exists in a new cPanel database
#   - gen_random_uuid() is built in only from 13, and pgcrypto needs a superuser
#     on 10, so admin_users gets a small stand-in function
set -euo pipefail

OUT="${1:-dplus.sql}"
: "${NEON_DATABASE_URL:?Set NEON_DATABASE_URL to the Neon direct (non -pooler) connection string}"
PG_DUMP="${PG_DUMP:-$(command -v /usr/local/opt/postgresql@18/bin/pg_dump /opt/homebrew/opt/postgresql@18/bin/pg_dump pg_dump | head -1)}"

"$PG_DUMP" --no-owner --no-acl --schema=public "$NEON_DATABASE_URL" |
  sed -E \
    -e '/^\\(un)?restrict /d' \
    -e '/^SET (transaction_timeout|default_table_access_method) /d' \
    -e '/^CREATE SCHEMA public;$/d' \
    -e '/^COMMENT ON SCHEMA public /d' \
    -e 's/DEFAULT gen_random_uuid\(\)/DEFAULT public.gen_random_uuid()/' \
    -e "/^SET row_security = off;$/a\\
\\
CREATE OR REPLACE FUNCTION public.gen_random_uuid() RETURNS uuid\\
  LANGUAGE sql VOLATILE AS \$\$ SELECT md5(random()::text || clock_timestamp()::text)::uuid \$\$;" \
  > "$OUT"

echo "Wrote $OUT ($(du -h "$OUT" | cut -f1))"
