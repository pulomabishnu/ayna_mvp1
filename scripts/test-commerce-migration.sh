#!/usr/bin/env bash
# Applies commerce_engine.sql (twice, to prove it is re-runnable) to a
# throwaway Postgres on top of the catalog, then runs its behaviour checks.
# Nothing in Supabase is touched.
#
#   ./scripts/test-commerce-migration.sh            # catalog only
#   PILOT_SQL_DIR=/path/to/pilot/sql ./scripts/...  # also apply pilot tables first
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)}"
[ -n "$PG_BIN" ] && export PATH="$PG_BIN:$PATH"
command -v initdb >/dev/null || { echo "initdb not found (install postgresql)"; exit 1; }

PGDIR="$(mktemp -d /tmp/ayna-commerce-pg.XXXXXX)"
PORT="${PGPORT:-55433}"
export PGHOST=127.0.0.1 PGPORT="$PORT" PGUSER=postgres PGOPTIONS='-c client_min_messages=warning'
cleanup() { pg_ctl -D "$PGDIR" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$PGDIR"; }
trap cleanup EXIT

initdb -D "$PGDIR" -U postgres --auth=trust >/dev/null
pg_ctl -D "$PGDIR" -o "-p $PORT -k /tmp -c listen_addresses=127.0.0.1" -l "$PGDIR/server.log" start >/dev/null
for _ in $(seq 1 20); do pg_isready -q && break; sleep 0.5; done
createdb commerce_test
run() { printf '── %-52s' "$1"; psql -v ON_ERROR_STOP=1 -q -d commerce_test -f "$1" >/dev/null; echo ok; }

run supabase/_local_bootstrap.sql
run supabase/product_catalog.sql
run supabase/seed/product_catalog.sql
if [ -n "${PILOT_SQL_DIR:-}" ]; then
  for f in pilot_orders pilot_prices pilot_requests pilot_cart pilot_price_approval; do
    [ -f "$PILOT_SQL_DIR/$f.sql" ] && run "$PILOT_SQL_DIR/$f.sql"
  done
fi
run supabase/commerce_engine.sql
run supabase/commerce_engine.sql
run supabase/seed/2026-10-15_commerce_offers.sql
run supabase/seed/2026-10-15_commerce_offers.sql
psql -q -d commerce_test -At -c "select 'offers='||count(*) from public.commerce_offers; select 'variants='||count(*) from public.commerce_variants; select 'amazon_offers_with_price='||count(*) from public.commerce_offers where provider='amazon_associates' and current_price_cents is not null; select 'audit_rows='||count(*) from public.commerce_audit_log;"
run supabase/seed/2026-10-15_commerce_price_text_fixes.sql
echo "── behaviour checks"
PGOPTIONS='-c client_min_messages=notice' psql -v ON_ERROR_STOP=1 -q -d commerce_test -f supabase/_commerce_engine_test.sql
