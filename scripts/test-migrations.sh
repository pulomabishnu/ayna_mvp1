#!/usr/bin/env bash
# Apply every migration to a throwaway local Postgres and verify the result.
#
# Free, repeatable, and safe: it starts its own cluster in a temp directory,
# drops and recreates the database each run, and tears the cluster down at the
# end. Nothing on the machine and nothing in Supabase is touched.
#
#   ./scripts/test-migrations.sh
#
# Requires postgresql installed (brew install postgresql@17). If Homebrew could
# not link it (a libpq conflict is common), the share/lib dirs the binaries
# expect may be missing; see the SHARE/LIB notes below.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PG_PREFIX="${PG_PREFIX:-/usr/local/opt/postgresql@17}"
export PATH="$PG_PREFIX/bin:$PATH"

command -v initdb >/dev/null || { echo "initdb not found. brew install postgresql@17"; exit 1; }

# Socket paths are capped at ~103 bytes, so keep the cluster dir short and put
# the socket in /tmp regardless of where this repo lives.
PGDIR="$(mktemp -d /tmp/ayna-pg.XXXXXX)"
PORT="${PGPORT:-55432}"
export PGHOST=127.0.0.1 PGPORT="$PORT" PGUSER=postgres

cleanup() {
  pg_ctl -D "$PGDIR" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$PGDIR"
}
trap cleanup EXIT

echo "── starting a throwaway cluster on :$PORT"
initdb -D "$PGDIR" -U postgres --auth=trust >/dev/null
pg_ctl -D "$PGDIR" -o "-p $PORT -k /tmp -c listen_addresses=127.0.0.1" -l "$PGDIR/server.log" start >/dev/null
for _ in $(seq 1 20); do pg_isready -q && break; sleep 0.5; done
pg_isready -q || { echo "server did not start"; tail -20 "$PGDIR/server.log"; exit 1; }

DB=ayna_migration_test
createdb "$DB"

# Quiet the expected "... does not exist, skipping" NOTICEs from `drop if exists`
# on a clean database; real problems are WARNING or ERROR and still surface.
export PGOPTIONS='-c client_min_messages=warning'

run() { printf '── %-46s' "$1"; psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$1" >/dev/null; echo "ok"; }

run supabase/_local_bootstrap.sql

# Same order as supabase/README.md.
for f in \
  health_intakes phone_numbers pending_phone_verifications sms_conversations \
  user_ecosystems user_reviews user_learning_memory user_ai_usage \
  user_ecosystem_builds user_health_profiles product_catalog \
  product_recall_state recall_notifications
do
  run "supabase/$f.sql"
done

run supabase/seed/product_catalog.sql

# _verify.sql skips its behavioural half without an auth.users row — seed one, or
# the most valuable checks silently no-op.
psql -v ON_ERROR_STOP=1 -q -d "$DB" -c \
  "insert into auth.users (id, email) values ('00000000-0000-4000-8000-000000000001','test@example.com') on conflict do nothing;"

# Print the NOTICEs on success, and the actual ERROR on failure. A harness that
# aborts without saying why is barely better than one that does not abort.
verify() {
  local label="$1" file="$2" out rc
  echo
  echo "── $label"
  set +e
  out="$(PGOPTIONS='-c client_min_messages=notice' psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$file" 2>&1)"
  rc=$?
  set -e
  if [ $rc -ne 0 ]; then
    echo "$out" | grep -E "ERROR|FAIL|SECURITY" | sed 's/^psql[^ ]* /   /' | head -10
    echo
    echo "❌ $label FAILED"
    exit 1
  fi
  echo "$out" | grep -E "NOTICE" | sed 's/^psql.*NOTICE:  /   /'
}

verify "structural verification" supabase/_verify.sql
verify "behavioural verification" supabase/_behaviour_test.sql

echo
printf '   catalog rows: '
psql -q -d "$DB" -t -A -c "select count(*) from public.product_catalog;"

echo
echo "✅ migrations apply clean and pass structural + behavioural verification"
