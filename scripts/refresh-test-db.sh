#!/bin/sh
# Rebuild the DEDICATED test database (`postgres_test`) as a clone of the
# local stack's dev database — schemas (auth, storage, cron data) and the
# applied migrations included, via pg_dump inside the db container (no
# exclusive template lock needed, so dev services can stay connected).
#
# Why it exists: the postgres specs WIPE the world they run against
# (postgres-access-seed deletes auth.users, cascading memberships). Pointing
# them at their own database keeps `supabase start`'s dev data alive across
# quality-gate runs.
#
# Run after `pnpm stack` and after adding migrations:  pnpm stack:testdb
set -eu

CONTAINER="${SUPABASE_DB_CONTAINER:-supabase_db_bison-manager}"

echo "Recreating postgres_test in $CONTAINER ..."
docker exec "$CONTAINER" psql -U supabase_admin -d postgres -q \
  -c "drop database if exists postgres_test with (force);" \
  -c "create database postgres_test;"

# Full dump (schema + data) as the image's superuser, so auth/storage
# objects restore with their real owners. role_templates/plans seeds ride
# along; specs wipe whatever they own. pg_cron can only live in the
# configured database, so its objects fail on restore — tolerated (cron is
# irrelevant to specs); everything else applies cleanly.
docker exec "$CONTAINER" sh -c \
  "pg_dump -U supabase_admin -d postgres | psql -U supabase_admin -d postgres_test -q" \
  2>&1 | grep -viE "cron|realtime|\\\\unrestrict|secrets" || true

docker exec "$CONTAINER" psql -U postgres -d postgres_test -tA \
  -c "select count(*) from public.bison_issued_documents;" >/dev/null

echo "postgres_test ready."
