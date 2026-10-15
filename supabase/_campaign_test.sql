-- LOCAL TESTING ONLY: behavioural tests for the free product campaign.
-- Run by scripts/test-campaign-sql.sh after the migrations and
-- _campaign_test_setup.sql. Each block raises on the first failure.

\set ON_ERROR_STOP 1

-- Fresh campaign state for this file.
delete from public.reward_claims;
delete from public.reward_spins;
delete from public.reward_products;
delete from public.campaign_feedback;
update public.reward_campaigns
   set is_active = true, starts_at = now() - interval '1 day', ends_at = null
 where id = 'free-product-2026';

insert into public.reward_products (campaign_id, product_id, inventory_total)
select 'free-product-2026', id, case when row_number() over (order by id) = 1 then 1 else 2 end
from (select id from public.product_catalog where is_active order by id limit 2) p;

-- ── Eligibility: verification, feedback, referrals ──────────────────────────
do $$
declare
  c text := 'free-product-2026';
  r uuid := public.test_user('referrer@example.com');
  unv uuid := public.test_user('unverified@example.com', now() - interval '30 days', false);
  f1 uuid; f2 uuid; f3 uuid; f4 uuid; old uuid; me2 uuid; dup uuid;
  p jsonb;
  s jsonb;
begin
  p := public.campaign_progress(c, r);
  assert (p ->> 'verified')::boolean, 'existing verified user is verified';
  assert (p ->> 'feedbackComplete')::int = 0, 'no feedback yet';
  assert (p ->> 'referralsVerified')::int = 0, '0 referrals';
  assert not (p ->> 'eligible')::boolean, 'not eligible with nothing done';

  assert not (public.campaign_progress(c, unv) ->> 'verified')::boolean, 'unconfirmed account is not verified';

  -- Spinning before eligible is refused.
  s := public.campaign_spin(c, r);
  assert s ->> 'error' = 'not_eligible', 'ineligible spin refused: ' || s::text;

  -- Fewer than 3 feedback answers.
  perform public.campaign_save_feedback(c, r, 'like', 'q1', public.test_answer(1), true);
  perform public.campaign_save_feedback(c, r, 'friction', 'q2', public.test_answer(2), true);
  assert (public.campaign_progress(c, r) ->> 'feedbackComplete')::int = 2, 'two answers count as 2';

  -- Copy of answer 1 pasted into answer 3, even if a client lied about it being complete.
  perform public.campaign_save_feedback(c, r, 'change', 'q3', public.test_answer(1), true);
  assert (public.campaign_progress(c, r) ->> 'feedbackComplete')::int = 2, 'duplicate answer counts once';

  -- Too short, even if flagged complete.
  perform public.campaign_save_feedback(c, r, 'change', 'q3', 'good', true);
  assert (public.campaign_progress(c, r) ->> 'feedbackComplete')::int = 2, 'short answer does not count';

  perform public.campaign_save_feedback(c, r, 'change', 'q3', public.test_answer(3), true);
  assert (public.campaign_progress(c, r) ->> 'feedbackComplete')::int = 3, 'three real answers count as 3';

  -- Referrals, one at a time.
  f1 := public.test_user('friend.one@gmail.com', now() - interval '2 hours');
  perform public.test_refer(r, f1);
  assert (public.campaign_progress(c, r) ->> 'referralsVerified')::int = 1, '1 verified friend';

  f2 := public.test_user('friend2@example.com', now() - interval '2 hours');
  perform public.test_refer(r, f2);
  p := public.campaign_progress(c, r);
  assert (p ->> 'referralsVerified')::int = 2, '2 verified friends';
  assert not (p ->> 'eligible')::boolean, 'not eligible with 2 friends';

  -- Joined but not verified: listed, does not count.
  f4 := public.test_user('friend4@example.com', now() - interval '2 hours', false);
  perform public.test_refer(r, f4);
  p := public.campaign_progress(c, r);
  assert (p ->> 'referralsVerified')::int = 2, 'unverified friend does not count';
  assert exists (select 1 from jsonb_array_elements(p -> 'referrals') x where x ->> 'status' = 'unverified'), 'unverified friend is listed';

  -- Existing account (created before the campaign) attributed directly in the table: never counts.
  old := public.test_user('oldfriend@example.com', now() - interval '60 days');
  perform public.test_refer(r, old);
  -- Same inbox as the referrer (plus-address): never counts.
  me2 := public.test_user('referrer+alt@example.com', now() - interval '2 hours');
  perform public.test_refer(r, me2);
  -- Same Gmail inbox as friend 1 with dots moved: counts once.
  dup := public.test_user('friendone@gmail.com', now() - interval '1 hours');
  perform public.test_refer(r, dup);
  p := public.campaign_progress(c, r);
  assert (p ->> 'referralsVerified')::int = 2, 'existing / same-person / duplicate do not count: ' || (p -> 'referrals')::text;
  assert exists (select 1 from jsonb_array_elements(p -> 'referrals') x where x ->> 'status' = 'existing'), 'existing listed';
  assert exists (select 1 from jsonb_array_elements(p -> 'referrals') x where x ->> 'status' = 'same_person'), 'same person listed';
  assert exists (select 1 from jsonb_array_elements(p -> 'referrals') x where x ->> 'status' = 'duplicate'), 'duplicate listed';
  -- Masked labels only.
  assert not exists (select 1 from jsonb_array_elements(p -> 'referrals') x where x ->> 'label' like '%@%'), 'no emails exposed';

  -- Attribution more than 7 days after the friend's account was made: never counts.
  f3 := public.test_user('late@example.com', now() - interval '12 hours');
  insert into public.referrals (referred_user_id, referrer_code, created_at)
  values (f3, public.ayna_referral_code(r), now() + interval '8 days');
  assert (public.campaign_progress(c, r) ->> 'referralsVerified')::int = 2, 'late attribution does not count';
  delete from public.referrals where referred_user_id = f3;

  -- Self-referral row cannot count.
  insert into public.referrals (referred_user_id, referrer_code) values (r, public.ayna_referral_code(r)) on conflict do nothing;
  assert (public.campaign_progress(c, r) ->> 'referralsVerified')::int = 2, 'self referral does not count';
  delete from public.referrals where referred_user_id = r;

  -- Third verified friend: eligible.
  f3 := public.test_user('friend3@example.com', now() - interval '2 hours');
  perform public.test_refer(r, f3);
  p := public.campaign_progress(c, r);
  assert (p ->> 'referralsVerified')::int = 3, '3 verified friends';
  assert (p ->> 'eligible')::boolean, 'eligible: ' || p::text;

  -- The unverified user with everything else done is still not eligible.
  perform public.test_feedback(c, unv);
  for i in 1..3 loop perform public.test_refer(unv, public.test_user('uf' || i || '@example.com', now() - interval '1 hour')); end loop;
  p := public.campaign_progress(c, unv);
  assert (p ->> 'referralsVerified')::int = 3 and (p ->> 'feedbackComplete')::int = 3, 'unverified user did the rest';
  assert not (p ->> 'eligible')::boolean, 'unverified user is not eligible';
  assert public.campaign_spin(c, unv) ->> 'error' = 'not_eligible', 'unverified user cannot spin';

  raise notice 'ok  eligibility: verification, feedback, referrals';
end $$;

-- ── Spins, respins, claim, replay ───────────────────────────────────────────
do $$
declare
  c text := 'free-product-2026';
  r uuid := (select id from auth.users where email = 'referrer@example.com');
  s jsonb; prev text; first_spin uuid; last_spin uuid; k jsonb; k2 jsonb;
  before_total integer; i integer;
begin
  s := public.campaign_spin(c, r);
  assert (s ->> 'ok')::boolean, 'spin works: ' || s::text;
  first_spin := (s ->> 'spinId')::uuid;
  select sum(inventory_claimed) into before_total from public.reward_products where campaign_id = c;
  assert before_total = 0, 'a spin does not take inventory';

  -- 30 respins with two products available: never the same product twice in a row.
  prev := s -> 'product' ->> 'rewardProductId';
  for i in 1..30 loop
    s := public.campaign_spin(c, r);
    assert s -> 'product' ->> 'rewardProductId' <> prev, 'respin repeated the previous product';
    prev := s -> 'product' ->> 'rewardProductId';
  end loop;
  last_spin := (s ->> 'spinId')::uuid;
  assert (select count(*) from public.reward_spins where user_id = r) = 31, 'every spin recorded';
  assert (select sum(inventory_claimed) from public.reward_products where campaign_id = c) = 0, 'respins never take inventory';

  -- Older spin cannot be claimed.
  k := public.campaign_claim(c, r, first_spin, 'key-stale-000000000001');
  assert k ->> 'error' = 'stale_spin', 'stale spin refused: ' || k::text;

  -- Someone else's spin cannot be claimed.
  k := public.campaign_claim(c, (select id from auth.users where email = 'unverified@example.com'), last_spin, 'key-other-00000000001');
  assert k ->> 'error' in ('not_eligible', 'invalid_spin'), 'other user spin refused: ' || k::text;

  -- Real claim.
  k := public.campaign_claim(c, r, last_spin, 'key-claim-00000000001');
  assert (k ->> 'ok')::boolean, 'claim works: ' || k::text;
  assert (select sum(inventory_claimed) from public.reward_products where campaign_id = c) = 1, 'exactly one unit taken';

  -- Replay of the same request: same claim back, nothing else changes.
  k2 := public.campaign_claim(c, r, last_spin, 'key-claim-00000000001');
  assert (k2 ->> 'ok')::boolean and (k2 ->> 'replayed')::boolean, 'replay returns the claim: ' || k2::text;
  assert k2 -> 'claim' ->> 'id' = k -> 'claim' ->> 'id', 'replay is the same claim';
  -- New key (second tab, double click with a fresh key): refused.
  k2 := public.campaign_claim(c, r, last_spin, 'key-claim-00000000002');
  assert k2 ->> 'error' = 'already_claimed', 'second claim refused: ' || k2::text;
  assert (select count(*) from public.reward_claims where user_id = r) = 1, 'one claim row';
  assert (select sum(inventory_claimed) from public.reward_products where campaign_id = c) = 1, 'still one unit';

  -- After claiming: no more spins, progress shows the claim, feedback locked.
  assert public.campaign_spin(c, r) ->> 'error' = 'already_claimed', 'no spin after claim';
  assert public.campaign_progress(c, r) -> 'claim' <> 'null'::jsonb, 'claim visible on revisit';
  assert not (public.campaign_progress(c, r) ->> 'eligible')::boolean, 'not eligible again after claim';
  assert public.campaign_save_feedback(c, r, 'like', 'q1', public.test_answer(1), true) ->> 'error' = 'already_claimed', 'feedback locked after claim';

  -- Database constraint: one claim per user even bypassing the function.
  begin
    insert into public.reward_claims (campaign_id, user_id, reward_product_id, product_id, idempotency_key)
    select c, r, id, product_id, 'key-direct-0000000001' from public.reward_products where campaign_id = c limit 1;
    raise exception 'second claim row was allowed';
  exception when unique_violation then null;
  end;

  -- Database constraint: never oversold.
  begin
    update public.reward_products set inventory_claimed = inventory_total + 1 where campaign_id = c;
    raise exception 'oversell was allowed';
  exception when check_violation then null;
  end;

  raise notice 'ok  spins, respins, claim, replay, duplicate protection';
end $$;

-- ── Product sold out between spin and claim ─────────────────────────────────
do $$
declare
  c text := 'free-product-2026';
  a uuid; b uuid;
  u1 uuid := public.test_make_eligible('free-product-2026', 'one@example.com');
  u2 uuid := public.test_make_eligible('free-product-2026', 'two@example.com');
  s1 jsonb; s2 jsonb; k jsonb; claimed_before integer;
begin
  -- Reset: product A has exactly 1 unit, B is switched off, so both spin A.
  delete from public.reward_claims where user_id in (u1, u2);
  select id into a from public.reward_products where campaign_id = c order by product_id limit 1;
  select id into b from public.reward_products where campaign_id = c and id <> a limit 1;
  update public.reward_products set inventory_total = inventory_claimed + 1, is_active = true where id = a;
  update public.reward_products set is_active = false where id = b;

  s1 := public.campaign_spin(c, u1);
  s2 := public.campaign_spin(c, u2);
  assert s1 -> 'product' ->> 'rewardProductId' = a::text and s2 -> 'product' ->> 'rewardProductId' = a::text, 'both shown A';

  select inventory_claimed into claimed_before from public.reward_products where id = a;
  k := public.campaign_claim(c, u2, (s2 ->> 'spinId')::uuid, 'key-u2-000000000000001');
  assert (k ->> 'ok')::boolean, 'u2 gets the last A';

  k := public.campaign_claim(c, u1, (s1 ->> 'spinId')::uuid, 'key-u1-000000000000001');
  assert k ->> 'error' = 'out_of_stock', 'u1 told it just went: ' || k::text;
  assert (select inventory_claimed from public.reward_products where id = a) = claimed_before + 1, 'A taken once';
  assert (select inventory_remaining from public.reward_products where id = a) = 0, 'never below zero';
  assert not exists (select 1 from public.reward_claims where user_id = u1), 'no claim for u1';

  -- Sold out and the only product: no empty wheel.
  s1 := public.campaign_spin(c, u1);
  assert s1 ->> 'error' = 'no_inventory', 'no spin when nothing is left: ' || s1::text;
  assert not (public.campaign_progress(c, u1) ->> 'inventoryAvailable')::boolean, 'inventory reported empty';
  assert jsonb_array_length(public.campaign_pool(c)) = 0, 'pool empty';
  -- Eligible user waiting for stock is picked up by the notifier only once stock exists.
  assert not exists (select 1 from public.campaign_unlocked_to_notify(c) n where n.user_id = u1), 'no unlocked email with no stock';

  -- B comes back: u1 can spin again and gets B, never A.
  update public.reward_products set is_active = true where id = b;
  s1 := public.campaign_spin(c, u1);
  assert s1 -> 'product' ->> 'rewardProductId' = b::text, 'sold out product never offered again';
  assert exists (select 1 from public.campaign_unlocked_to_notify(c) n where n.user_id = u1), 'unlocked email queued when stock exists';
  assert public.campaign_mark_notified(c, u1, 'unlocked'), 'first mark wins';
  assert not public.campaign_mark_notified(c, u1, 'unlocked'), 'second mark refused';

  raise notice 'ok  sold out between spin and claim, empty pool, restock';
end $$;

-- ── Campaign paused / ended ─────────────────────────────────────────────────
do $$
declare
  c text := 'free-product-2026';
  u uuid := (select id from auth.users where email = 'one@example.com');
  s jsonb;
begin
  s := public.campaign_spin(c, u);
  assert (s ->> 'ok')::boolean, 'spins while live';
  update public.reward_campaigns set is_active = false where id = c;
  assert public.campaign_spin(c, u) ->> 'error' = 'campaign_inactive', 'paused: no spin';
  assert public.campaign_claim(c, u, (s ->> 'spinId')::uuid, 'key-paused-00000000001') ->> 'error' = 'campaign_inactive', 'paused: no claim';
  assert public.campaign_save_feedback(c, u, 'like', 'q', public.test_answer(1), true) ->> 'error' = 'campaign_inactive', 'paused: no feedback';
  update public.reward_campaigns set is_active = true, ends_at = now() - interval '1 minute' where id = c;
  assert (public.campaign_progress(c, u) -> 'campaign' ->> 'ended')::boolean, 'ended reported';
  assert public.campaign_spin(c, u) ->> 'error' = 'campaign_inactive', 'ended: no spin';
  update public.reward_campaigns set ends_at = null where id = c;
  raise notice 'ok  paused and ended campaign';
end $$;

-- ── Shipping and admin ──────────────────────────────────────────────────────
do $$
declare
  c text := 'free-product-2026';
  r uuid := (select id from auth.users where email = 'referrer@example.com');
  k jsonb; o jsonb;
begin
  k := public.campaign_save_shipping(c, r, '{"fullName":"Test Person","addressLine1":"1 Main St","city":"New York","state":"NY","postalCode":"10001","email":"t@example.com"}');
  assert (k ->> 'ok')::boolean, 'shipping saved: ' || k::text;
  assert k -> 'claim' ->> 'fulfillmentStatus' = 'preparing', 'status moves to preparing';
  begin
    perform public.campaign_save_shipping(c, r, '{"fullName":"T","addressLine1":"1 Main St","city":"New York","state":"New York","postalCode":"1","email":"t@example.com"}');
    raise exception 'bad address accepted';
  exception when check_violation then null;
  end;
  o := public.campaign_admin_overview(c);
  assert jsonb_array_length(o -> 'inventory') = 2, 'admin sees inventory';
  assert exists (select 1 from jsonb_array_elements(o -> 'people') x where x -> 'claim' -> 'shipping' ->> 'city' = 'New York'), 'admin sees shipping';
  assert (public.campaign_admin_set_fulfillment((k -> 'claim' ->> 'id')::uuid, 'shipped') ->> 'ok')::boolean, 'admin marks shipped';
  assert public.campaign_save_shipping(c, r, '{"fullName":"Test Person","addressLine1":"2 Main St","city":"New York","state":"NY","postalCode":"10001","email":"t@example.com"}') ->> 'error' = 'already_shipped', 'address locked after shipping';
  raise notice 'ok  shipping and admin overview';
end $$;

-- ── Nothing here is reachable from the browser roles ────────────────────────
do $$
declare t text;
begin
  foreach t in array array['reward_campaigns','campaign_feedback','reward_products','reward_spins','reward_claims','reward_shipping','reward_notifications'] loop
    assert not has_table_privilege('authenticated', 'public.' || t, 'select'), t || ' readable by authenticated';
    assert not has_table_privilege('anon', 'public.' || t, 'select'), t || ' readable by anon';
    assert not has_table_privilege('authenticated', 'public.' || t, 'insert'), t || ' writable by authenticated';
  end loop;
  assert not has_function_privilege('authenticated', 'public.campaign_claim(text, uuid, uuid, text)', 'execute'), 'claim callable by authenticated';
  assert not has_function_privilege('anon', 'public.campaign_progress(text, uuid)', 'execute'), 'progress callable by anon';
  assert not has_function_privilege('authenticated', 'public.campaign_spin(text, uuid)', 'execute'), 'spin callable by authenticated';
  assert has_function_privilege('service_role', 'public.campaign_claim(text, uuid, uuid, text)', 'execute'), 'service role can claim';
  raise notice 'ok  browser roles have no access to campaign tables or functions';
end $$;

-- Existing referral policy still blocks attributing an old account (unchanged behaviour).
do $$
declare old uuid := (select id from auth.users where email = 'oldfriend@example.com');
begin
  delete from public.referrals where referred_user_id = old;
  perform set_config('request.jwt.claim.sub', old::text, true);
  set local role authenticated;
  begin
    insert into public.referrals (referred_user_id, referrer_code) values (old, 'abcdef1234');
    raise exception 'old account attributed via client insert';
  exception when insufficient_privilege then null;
  end;
  reset role;
  raise notice 'ok  existing accounts cannot be attributed from the browser';
end $$;
