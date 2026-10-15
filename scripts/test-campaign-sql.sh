#!/usr/bin/env bash
# Free product campaign: apply the migration to a throwaway local Postgres and
# prove the rules, including real concurrent claims from separate connections.
#
#   ./scripts/test-campaign-sql.sh
#
# Nothing in Supabase is touched. Needs postgres binaries (initdb, pg_ctl, psql).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

for d in "${PG_PREFIX:-}/bin" /usr/lib/postgresql/17/bin /usr/lib/postgresql/16/bin /usr/local/opt/postgresql@17/bin; do
  [ -x "$d/initdb" ] && export PATH="$d:$PATH" && break
done
command -v initdb >/dev/null || { echo "initdb not found"; exit 1; }

PGDIR="$(mktemp -d /tmp/ayna-campaign-pg.XXXXXX)"
PORT="${PGPORT:-55433}"
export PGHOST=127.0.0.1 PGPORT="$PORT" PGUSER=postgres
cleanup() { pg_ctl -D "$PGDIR" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$PGDIR"; }
trap cleanup EXIT

if [ "$(id -u)" = "0" ]; then
  # initdb refuses to run as root; use a throwaway user.
  id ayna_pg >/dev/null 2>&1 || useradd -M ayna_pg
  chown ayna_pg "$PGDIR"
  RUNAS=(su ayna_pg -s /bin/bash -c)
  "${RUNAS[@]}" "PATH=$PATH initdb -D $PGDIR -U postgres --auth=trust >/dev/null"
  "${RUNAS[@]}" "PATH=$PATH pg_ctl -D $PGDIR -o '-p $PORT -k /tmp -c listen_addresses=127.0.0.1 -c max_connections=200' -l $PGDIR/server.log start >/dev/null"
  cleanup() { su ayna_pg -s /bin/bash -c "PATH=$PATH pg_ctl -D $PGDIR stop -m immediate" >/dev/null 2>&1 || true; rm -rf "$PGDIR"; }
else
  initdb -D "$PGDIR" -U postgres --auth=trust >/dev/null
  pg_ctl -D "$PGDIR" -o "-p $PORT -k /tmp -c listen_addresses=127.0.0.1 -c max_connections=200" -l "$PGDIR/server.log" start >/dev/null
fi
for _ in $(seq 1 30); do pg_isready -q && break; sleep 0.5; done

DB=ayna_campaign_test
createdb "$DB"
export PGOPTIONS='-c client_min_messages=warning'
q() { psql -v ON_ERROR_STOP=1 -q -t -A -d "$DB" "$@"; }
run() { printf '── %-58s' "$1"; q -f "$1" >/dev/null; echo ok; }

run supabase/_local_bootstrap.sql
run supabase/product_catalog.sql
# community_posts lives only in the hosted DB; the badge stats function reads it.
q -c "create table if not exists public.community_posts (id uuid primary key default gen_random_uuid(), author_id uuid);" >/dev/null
run supabase/migrations/20261013150000_referrals.sql
run supabase/migrations/20261015120000_free_product_campaign.sql
printf '── %-58s' "re-run campaign migration (idempotent)"; q -f supabase/migrations/20261015120000_free_product_campaign.sql >/dev/null; echo ok

echo
echo "── behaviour tests"
PGOPTIONS='-c client_min_messages=notice' psql -v ON_ERROR_STOP=1 -q -d "$DB" -f supabase/_campaign_test.sql 2>&1 \
  | sed -e "s/.*NOTICE:  /   /" -e "/^psql.*ERROR/!b" -e "s/^/   ❌ /"

# ── concurrency ────────────────────────────────────────────────────────────
echo
echo "── concurrency: building 40 eligible users on a race campaign"
q >/dev/null <<'SQL'
insert into public.campaigns (id, name, is_active, starts_at) values ('race-test', 'race', true, now() - interval '1 hour');
insert into public.product_catalog (id, name, brand, category) values ('race-prod', 'Race Product', 'Brand', 'pad'), ('race-prod-2', 'Race Two', 'Brand', 'pad');
insert into public.campaign_rewards (campaign_id, product_id, inventory_total) values ('race-test', 'race-prod', 5);
do $$
declare i int; k int; u uuid; code text;
begin
  for i in 1..40 loop
    u := ('c0000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    insert into auth.users (id, email, created_at, email_confirmed_at) values (u, 'r' || i || '@t.dev', now() - interval '20 days', now());
    insert into public.campaign_feedback (campaign_id, user_id, question_key, question, response)
    select 'race-test', u, qk, 'test question', format('Person %s says about %s: the product pages are clear, the match score helps me decide quickly, and I like the research notes a lot.', i, qk)
    from unnest(array['like','friction','change']) qk;
    code := public.ayna_get_referral_code(u);
    for k in 1..3 loop
      insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
      values (gen_random_uuid(), 'r' || i || 'f' || k || '@t.dev', now(), jsonb_build_object('referred_by', code));
    end loop;
  end loop;
end $$;
-- every racer spins once (the pool has one product, so they all see it)
select public.campaign_spin(('c0000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid, 'race-test') from generate_series(1, 40) i;
SQL
echo "   eligible: $(q -c "select count(*) from generate_series(1,40) i where public.campaign_is_eligible(('c0000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid, 'race-test')")/40"

claim_sql() { # user index, idempotency key
  local u="c0000000-0000-4000-8000-$(printf '%012d' "$1")"
  echo "select public.campaign_claim('$u'::uuid, 'race-test',
    (select reward_id from public.campaign_spins where user_id = '$u' and campaign_id='race-test' order by id desc limit 1),
    (select id from public.campaign_spins where user_id = '$u' and campaign_id='race-test' order by id desc limit 1), '$2') ->> 'status';"
}

OUT="$PGDIR/race"; mkdir -p "$OUT"
echo "── 40 different people claim the last 5 units at the same instant"
for i in $(seq 1 40); do (q -c "$(claim_sql "$i" "race-key-$(printf '%012d' "$i")")" > "$OUT/a$i") & done
wait
claimed=$(cat "$OUT"/a* | grep -c '^claimed$' || true)
soldout=$(cat "$OUT"/a* | grep -c '^out_of_stock$' || true)
inv=$(q -c "select inventory_claimed || '/' || inventory_total || ' remaining=' || inventory_remaining from public.campaign_rewards where product_id='race-prod'")
rows=$(q -c "select count(*) from public.campaign_claims where campaign_id='race-test'")
echo "   claimed=$claimed out_of_stock=$soldout claim_rows=$rows inventory=$inv"
[ "$claimed" = 5 ] && [ "$soldout" = 35 ] && [ "$rows" = 5 ] && [ "$inv" = "5/5 remaining=0" ] || { echo "❌ race on final units FAILED"; exit 1; }

# pick three racers who lost the first race (still eligible, no claim)
read -r L1 L2 L3 <<<"$(q -c "select string_agg(i::text, ' ') from (select i from generate_series(1,40) i where not exists (select 1 from public.campaign_claims c where c.user_id = ('c0000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid) order by i limit 3) x")"
pad() { printf '%012d' "$1"; }
echo "── one person double-clicks / retries 15 times at once (different keys)"
q -c "update public.campaign_rewards set inventory_total = 10 where product_id='race-prod'" >/dev/null
q -c "select public.campaign_spin('c0000000-0000-4000-8000-$(pad $L1)'::uuid, 'race-test')" >/dev/null
for n in $(seq 1 15); do (q -c "$(claim_sql "$L1" "dbl-key-$(printf '%012d' "$n")")" > "$OUT/b$n") & done
wait
claimed=$(cat "$OUT"/b* | grep -c '^claimed$' || true)
already=$(cat "$OUT"/b* | grep -c '^already_claimed$' || true)
inv=$(q -c "select inventory_claimed from public.campaign_rewards where product_id='race-prod'")
echo "   claimed=$claimed already_claimed=$already inventory_claimed=$inv"
[ "$claimed" = 1 ] && [ "$already" = 14 ] && [ "$inv" = 6 ] || { echo "❌ double-click FAILED"; exit 1; }

echo "── forced interleave: A holds the last unit uncommitted, B claims it meanwhile"
q -c "update public.campaign_rewards set inventory_total = inventory_claimed + 1 where product_id='race-prod'" >/dev/null
q -c "select public.campaign_spin('c0000000-0000-4000-8000-$(pad $L2)'::uuid, 'race-test'); select public.campaign_spin('c0000000-0000-4000-8000-$(pad $L3)'::uuid, 'race-test');" >/dev/null
( q -c "begin; $(claim_sql "$L2" 'slow-key-00000000001') select pg_sleep(2); commit;" > "$OUT/slow" ) &
sleep 0.5
start=$(date +%s.%N)
B=$(q -c "$(claim_sql "$L3" 'fast-key-00000000001')")
took=$(echo "$(date +%s.%N) - $start" | bc)
wait
A=$(head -1 "$OUT/slow")
echo "   A=$A  B=$B  (B waited ${took}s for A's lock)"
[ "$A" = claimed ] && [ "$B" = out_of_stock ] && [ "$(echo "$took > 1" | bc)" = 1 ] || { echo "❌ interleave FAILED"; exit 1; }
neg=$(q -c "select count(*) from public.campaign_rewards where inventory_remaining < 0")
[ "$neg" = 0 ] || { echo "❌ negative inventory"; exit 1; }

echo
echo "✅ campaign migration: behaviour + concurrency tests passed"
