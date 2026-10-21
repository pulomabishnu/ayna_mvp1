#!/usr/bin/env bash
# Free product campaign: apply the migrations to a throwaway local Postgres,
# run the behavioural tests, then race real concurrent sessions for the last
# units of a product. Nothing in Supabase is touched.
#
#   ./scripts/test-campaign-sql.sh
#
# Needs initdb/pg_ctl/psql (brew install postgresql@17, or apt postgresql).
# Set PG_BIN if the binaries are not on PATH.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ -n "${PG_BIN:-}" ]; then export PATH="$PG_BIN:$PATH"; fi
if ! command -v initdb >/dev/null; then
  for d in /usr/local/opt/postgresql@17/bin /opt/homebrew/opt/postgresql@17/bin /usr/lib/postgresql/*/bin; do
    if [ -x "$d/initdb" ]; then export PATH="$d:$PATH"; break; fi
  done
fi
command -v initdb >/dev/null || { echo "initdb not found. Install postgresql or set PG_BIN."; exit 1; }

PGDIR="$(mktemp -d /tmp/ayna-campaign-pg.XXXXXX)"
PORT="${PGPORT:-55433}"
export PGHOST=127.0.0.1 PGPORT="$PORT" PGUSER=postgres
DB=ayna_campaign_test

# initdb refuses to run as root; use the postgres user when we are root.
AS=()
if [ "$(id -u)" = "0" ]; then
  chown postgres "$PGDIR"
  AS=(runuser -u postgres --)
fi

cleanup() {
  "${AS[@]}" pg_ctl -D "$PGDIR" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$PGDIR"
}
trap cleanup EXIT

echo "── starting a throwaway cluster on :$PORT"
"${AS[@]}" initdb -D "$PGDIR" -U postgres --auth=trust >/dev/null
"${AS[@]}" pg_ctl -D "$PGDIR" -o "-p $PORT -k /tmp -c listen_addresses=127.0.0.1 -c max_connections=100" -l "$PGDIR/server.log" start >/dev/null
for _ in $(seq 1 20); do pg_isready -q && break; sleep 0.5; done
createdb "$DB"
export PGOPTIONS='-c client_min_messages=warning'

run() { printf '── %-58s' "$1"; psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$1" >/dev/null; echo "ok"; }
q() { psql -v ON_ERROR_STOP=1 -q -t -A -d "$DB" -c "$1"; }

run supabase/_local_bootstrap.sql
run supabase/product_catalog.sql
run supabase/seed/product_catalog.sql
# my_referral_stats() reads community_posts; that table's DDL is not in the repo.
q "create table if not exists public.community_posts (id uuid primary key default gen_random_uuid(), author_id uuid);" >/dev/null
run supabase/migrations/20261013150000_referrals.sql
run supabase/migrations/20261019120000_referral_from_signup.sql
run supabase/migrations/20261019120000_referral_from_signup.sql
run supabase/migrations/20261015120000_free_product_campaign.sql
# Idempotent: applying it twice must not fail or change anything.
run supabase/migrations/20261015120000_free_product_campaign.sql
run supabase/_campaign_test_setup.sql

echo
echo "── behavioural tests"
PGOPTIONS='-c client_min_messages=notice' psql -v ON_ERROR_STOP=1 -q -d "$DB" -f supabase/_campaign_test.sql 2>&1 \
  | sed -n -e 's/^psql.*NOTICE:  /   /p' -e '/ERROR/p' -e '/CONTEXT/p'; [ "${PIPESTATUS[0]}" = 0 ] || { echo "❌ behavioural tests failed"; exit 1; }

C=free-product-2026

echo
echo "── share link: friend signs up with the code, confirms later somewhere else"
q "update public.reward_campaigns set is_active = true, starts_at = now() - interval '1 day', ends_at = null where id = '$C';" >/dev/null
R=$(q "select public.test_user('sharer@example.com')")
RC=$(q "select public.ayna_referral_code('$R')")
# Sign-up: the form sends referred_by in metadata. No browser insert happens.
F=$(q "insert into auth.users (id, email, created_at, raw_user_meta_data) values (gen_random_uuid(), 'friend1@example.com', now(), jsonb_build_object('referred_by', '$RC')) returning id")
ROW=$(q "select referrer_code from public.referrals where referred_user_id = '$F'")
S1=$(q "select status from public.campaign_referral_rows('$C', '$R') where referred_user_id = '$F'")
# She taps the confirmation link on her phone: only email_confirmed_at changes.
q "update auth.users set email_confirmed_at = now() where id = '$F';" >/dev/null
S2=$(q "select status from public.campaign_referral_rows('$C', '$R') where referred_user_id = '$F'")
# Browser path later sets the same metadata again, or a second code: first one stays.
q "update auth.users set raw_user_meta_data = jsonb_build_object('referred_by', 'aaaaaaaaaa') where id = '$F';" >/dev/null
KEEP=$(q "select referrer_code from public.referrals where referred_user_id = '$F'")
# Own code and an old account never count.
OWN=$(q "with u as (insert into auth.users (id, email, created_at) values ('11111111-2222-4333-8444-555555555555', 'self@example.com', now()) returning id) select 1")
q "update auth.users set raw_user_meta_data = jsonb_build_object('referred_by', '1111111122') where id = '11111111-2222-4333-8444-555555555555';" >/dev/null
OLD=$(q "select public.test_user('old@example.com', now() - interval '30 days')")
q "update auth.users set raw_user_meta_data = jsonb_build_object('referred_by', '$RC') where id = '$OLD';" >/dev/null
NOROWS=$(q "select count(*) from public.referrals where referred_user_id in ('11111111-2222-4333-8444-555555555555', '$OLD')")
echo "   row=$ROW before_confirm=$S1 after_confirm=$S2 first_code_kept=$([ "$KEEP" = "$RC" ] && echo yes || echo no) own_or_old_rows=$NOROWS"
[ "$ROW" = "$RC" ] && [ "$S1" = unverified ] && [ "$S2" = verified ] && [ "$KEEP" = "$RC" ] && [ "$NOROWS" = 0 ] \
  || { echo "❌ share link test failed"; exit 1; }
echo "   ok  counted as soon as she confirms, from any device"

echo
echo "── race: 20 people claim the same product with 5 units, all at once"
q "delete from public.reward_claims; delete from public.reward_spins; update public.reward_products set is_active = false;
   update public.reward_campaigns set is_active = true, starts_at = now() - interval '1 day', ends_at = null where id = '$C';" >/dev/null
PID=$(q "select id from public.product_catalog where is_active and id not in (select product_id from public.reward_products where product_id is not null) order by id limit 1")
q "insert into public.reward_products (campaign_id, product_id, inventory_total) values ('$C', '$PID', 5);" >/dev/null
RP=$(q "select id from public.reward_products where product_id = '$PID'")
SPINS=()
for i in $(seq 1 20); do
  U=$(q "select public.test_make_eligible('$C', 'race$i@example.com')")
  S=$(q "select public.campaign_spin('$C', '$U') ->> 'spinId'")
  SPINS+=("$U:$S")
done
OUT="$PGDIR/race"; mkdir -p "$OUT"
for pair in "${SPINS[@]}"; do
  U="${pair%%:*}"; S="${pair##*:}"
  ( q "select coalesce(public.campaign_claim('$C', '$U', '$S', 'race-key-$U') ->> 'error', 'claimed')" > "$OUT/$U" ) &
done
wait
CLAIMED=$(cat "$OUT"/* | grep -c '^claimed$' || true)
SOLD_OUT=$(cat "$OUT"/* | grep -c '^out_of_stock$' || true)
INV=$(q "select inventory_claimed || '/' || inventory_total || ' remaining ' || inventory_remaining from public.reward_products where id = '$RP'")
ROWS=$(q "select count(*) from public.reward_claims where reward_product_id = '$RP'")
echo "   claimed=$CLAIMED out_of_stock=$SOLD_OUT claim_rows=$ROWS inventory=$INV"
[ "$CLAIMED" = 5 ] && [ "$SOLD_OUT" = 15 ] && [ "$ROWS" = 5 ] && [ "$INV" = "5/5 remaining 0" ] \
  || { echo "❌ race test failed"; exit 1; }
echo "   ok  exactly 5 claims, 15 told it just went, never oversold"

echo
echo "── race: the last unit, two people, one transaction held open"
q "update public.reward_products set inventory_total = inventory_total + 1 where id = '$RP';" >/dev/null
A=$(q "select public.test_make_eligible('$C', 'lasta@example.com')"); SA=$(q "select public.campaign_spin('$C', '$A') ->> 'spinId'")
B=$(q "select public.test_make_eligible('$C', 'lastb@example.com')"); SB=$(q "select public.campaign_spin('$C', '$B') ->> 'spinId'")
( psql -q -t -A -d "$DB" -c "begin; select coalesce(public.campaign_claim('$C', '$A', '$SA', 'last-key-a-000000001') ->> 'error','claimed'); select pg_sleep(1.5); commit;" | grep -v '^$' | head -1 > "$OUT/lastA" ) &
sleep 0.4
RB=$(q "select coalesce(public.campaign_claim('$C', '$B', '$SB', 'last-key-b-000000001') ->> 'error','claimed')")
wait
RA=$(cat "$OUT/lastA")
echo "   first=$RA second=$RB (second waited for the first to commit)"
[ "$RA" = claimed ] && [ "$RB" = out_of_stock ] || { echo "❌ last-unit test failed"; exit 1; }
echo "   ok  the second person gets out_of_stock, not a duplicate"

echo
echo "── race: one person double-clicks claim (6 requests at once, 2 share a key)"
q "update public.reward_products set inventory_total = inventory_total + 3 where id = '$RP';" >/dev/null
D=$(q "select public.test_make_eligible('$C', 'double@example.com')"); SD=$(q "select public.campaign_spin('$C', '$D') ->> 'spinId'")
BEFORE=$(q "select inventory_claimed from public.reward_products where id = '$RP'")
for k in k1-000000000000001 k1-000000000000001 k2-000000000000002 k3-000000000000003 k4-000000000000004 k5-000000000000005; do
  ( q "select public.campaign_claim('$C', '$D', '$SD', 'dbl-$k') ->> 'ok'" >> "$OUT/double" ) &
done
wait
AFTER=$(q "select inventory_claimed from public.reward_products where id = '$RP'")
ROWS=$(q "select count(*) from public.reward_claims where user_id = '$D'")
OKS=$(grep -c '^true$' "$OUT/double" || true)
echo "   claim_rows=$ROWS units_taken=$((AFTER - BEFORE)) ok_responses=$OKS (the winner, plus its replay if the shared key won)"
[ "$ROWS" = 1 ] && [ "$((AFTER - BEFORE))" = 1 ] && [ "$OKS" -ge 1 ] && [ "$OKS" -le 2 ] || { echo "❌ double-click test failed"; exit 1; }
echo "   ok  one claim, one unit"

echo

echo
echo "── PR haul seed: loads, and re-running it keeps claimed counts"
q "delete from public.reward_claims; delete from public.reward_spins; delete from public.reward_products where product_id is null;" >/dev/null
psql -v ON_ERROR_STOP=1 -q -t -A -d "$DB" -f supabase/seed/free_product_pr_haul.sql | tail -1
q "update public.reward_products set inventory_claimed = 1 where brand = 'Kieró' and name = 'Moisturizing Barrier Cream';" >/dev/null
OUT2=$(psql -v ON_ERROR_STOP=1 -q -t -A -d "$DB" -f supabase/seed/free_product_pr_haul.sql | tail -1)
KEPT=$(q "select inventory_claimed || '/' || inventory_total from public.reward_products where brand = 'Kieró' and name = 'Moisturizing Barrier Cream'")
echo "   after re-run: $OUT2 (products|units), barrier cream claimed/total = $KEPT"
[ "$OUT2" = "49|52" ] && [ "$KEPT" = "1/2" ] || { echo "❌ seed test failed"; exit 1; }
echo "   ok  49 products, 52 units, re-run is safe"

echo
echo "── Vinted prizes: units follow the listings, a won unit is never taken twice"
run supabase/migrations/20261021120000_vinted_pool_sync.sql
run supabase/migrations/20261021120000_vinted_pool_sync.sql
q "delete from public.reward_claims; delete from public.reward_spins; update public.reward_products set is_active = false;" >/dev/null
VP=$(q "insert into public.reward_products (campaign_id, name, brand, inventory_total) values ('$C', 'Glow Deep Serum', 'Beauty of Joseon', 0) returning id")
q "insert into public.reward_vinted_listings (listing_id, reward_product_id) values (101, '$VP'), (102, '$VP');
   select public.campaign_vinted_recount('$C');" >/dev/null
T0=$(q "select inventory_total from public.reward_products where id = '$VP'")
# Someone wins one: it is tied to a listing straight away.
W=$(q "select public.test_make_eligible('$C', 'vinted-winner@example.com')"); SW=$(q "select public.campaign_spin('$C', '$W') ->> 'spinId'")
CL=$(q "select coalesce(public.campaign_claim('$C', '$W', '$SW', 'vinted-key-000000001') ->> 'error', 'claimed')")
TIED=$(q "select listing_id from public.reward_vinted_listings where claim_id is not null")
# Ameera takes the won one off Vinted, and sells the other: nothing left, nothing double-counted.
A1=$(q "select public.campaign_vinted_apply('$C', '[{\"listingId\":101,\"status\":\"sold\"},{\"listingId\":102,\"status\":\"sold\"}]'::jsonb) -> 'changes' -> 0 ->> 'wonInCampaign'")
T1=$(q "select inventory_claimed || '/' || inventory_total from public.reward_products where id = '$VP'")
# A blocked check ("unknown") changes nothing; a released reservation comes back.
q "select public.campaign_vinted_apply('$C', '[{\"listingId\":102,\"status\":\"unknown\"}]'::jsonb)" >/dev/null
T2=$(q "select inventory_total from public.reward_products where id = '$VP'")
q "select public.campaign_vinted_apply('$C', '[{\"listingId\":102,\"status\":\"available\"}]'::jsonb)" >/dev/null
T3=$(q "select inventory_claimed || '/' || inventory_total from public.reward_products where id = '$VP'")
NOACCESS=$(q "set role authenticated; select has_function_privilege('public.campaign_vinted_apply(text, jsonb)', 'execute')::text; reset role;" | head -1)
echo "   total=$T0 claim=$CL tied_to=$TIED won_flag=$A1 after_sold=$T1 after_unknown=$T2 after_back=$T3 browser_can_apply=$NOACCESS"
[ "$T0" = 2 ] && [ "$CL" = claimed ] && [ "$TIED" = 101 ] && [ "$A1" = true ] && [ "$T1" = "1/1" ] && [ "$T2" = 1 ] && [ "$T3" = "1/2" ] && [ "$NOACCESS" = false ] \
  || { echo "❌ Vinted test failed"; exit 1; }
echo "   ok  sold listings leave the pool, won ones stay won, unknown changes nothing"

echo
echo "── Vinted seed: 42 listings, PR haul items reused, re-run is safe"
q "delete from public.reward_vinted_listings; delete from public.reward_claims; delete from public.reward_spins; delete from public.reward_products where product_id is null;" >/dev/null
psql -v ON_ERROR_STOP=1 -q -t -A -d "$DB" -f supabase/seed/free_product_pr_haul.sql >/dev/null
BEFORE=$(q "select count(*) from public.reward_products where product_id is null")
V1=$(psql -v ON_ERROR_STOP=1 -q -t -A -d "$DB" -f supabase/seed/free_product_vinted.sql | tail -1)
q "update public.reward_vinted_listings set status = 'sold' where listing_id = 10464761615; select public.campaign_vinted_recount('$C');" >/dev/null
V2=$(psql -v ON_ERROR_STOP=1 -q -t -A -d "$DB" -f supabase/seed/free_product_vinted.sql | tail -1)
ADDED=$(( $(q "select count(*) from public.reward_products where product_id is null") - BEFORE ))
MANYO=$(q "select inventory_total || ':' || (select count(*) from public.reward_vinted_listings l where l.reward_product_id = rp.id) from public.reward_products rp where brand = 'manyo' and name = 'Glutathione 7 Dark Spot Serum'")
BOJ=$(q "select inventory_total from public.reward_products where name = 'Glow Deep Serum: Rice + Alpha-Arbutin'")
echo "   first=$V1 rerun=$V2 new_products=$ADDED manyo(units:listings)=$MANYO glow_deep_units_after_one_sold=$BOJ"
[ "$V1" = "41|42|42" ] && [ "$V2" = "41|42|41" ] && [ "$ADDED" = 39 ] && [ "$MANYO" = "1:1" ] && [ "$BOJ" = 1 ] \
  || { echo "❌ Vinted seed test failed"; exit 1; }
echo "   ok  41 prizes, 42 units; a sold listing stays sold on re-run"

echo
echo "✅ campaign SQL: behaviour and concurrency tests pass"
