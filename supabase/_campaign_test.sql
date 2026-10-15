-- LOCAL TESTING ONLY. Behaviour tests for 20261015120000_free_product_campaign.sql.
-- Run by scripts/test-campaign-sql.sh against a throwaway Postgres.
-- Every check raises (ASSERT) on failure, so psql -v ON_ERROR_STOP=1 fails loudly.

\set ON_ERROR_STOP 1

-- ── fixtures ────────────────────────────────────────────────────────────────
insert into public.product_catalog (id, name, brand, category, is_active) values
  ('t-prod-a', 'Test Product A', 'Brand A', 'pad', true),
  ('t-prod-b', 'Test Product B', 'Brand B', 'supplement', true),
  ('t-prod-c', 'Test Product C', 'Brand C', 'skincare', true)
on conflict (id) do nothing;

update public.campaigns set is_active = true, starts_at = now() - interval '1 hour', ends_at = null
 where id = 'free-product-2026';

-- referrer (existing, verified), plus an unverified one
insert into auth.users (id, email, created_at, email_confirmed_at) values
  ('a0000000-0000-4000-8000-000000000001', 'referrer@test.dev', now() - interval '30 days', now() - interval '30 days'),
  ('a0000000-0000-4000-8000-000000000002', 'unverified@test.dev', now() - interval '30 days', null),
  ('a0000000-0000-4000-8000-000000000003', 'second@test.dev', now() - interval '30 days', now() - interval '30 days'),
  -- existing account created BEFORE the campaign started
  ('e0000000-0000-4000-8000-000000000001', 'existing@test.dev', now() - interval '3 days', now() - interval '3 days');

create temp table t_ctx as select public.ayna_get_referral_code('a0000000-0000-4000-8000-000000000001') as code;

do $$
declare c text := (select code from t_ctx);
begin
  assert c ~ '^[a-z0-9]{8}$', 'opaque code is 8 chars: ' || c;
  assert public.ayna_get_referral_code('a0000000-0000-4000-8000-000000000001') = c, 'code is stable';
  assert public.ayna_resolve_referral_code(c) = 'a0000000-0000-4000-8000-000000000001', 'new code resolves';
  assert public.ayna_resolve_referral_code('a0000000000') is null, 'garbage does not resolve';
  assert public.ayna_resolve_referral_code('a000000000') = 'a0000000-0000-4000-8000-000000000001', 'legacy uuid-prefix code still resolves';
  raise notice 'ok  referral codes';
end $$;

-- ── account verification ───────────────────────────────────────────────────
do $$
begin
  assert public.ayna_user_is_verified('a0000000-0000-4000-8000-000000000001'), 'confirmed email = verified';
  assert not public.ayna_user_is_verified('a0000000-0000-4000-8000-000000000002'), 'unconfirmed = not verified';
  insert into auth.users (id, phone, phone_confirmed_at) values ('b0000000-0000-4000-8000-0000000000aa', '+15555550100', now());
  assert public.ayna_user_is_verified('b0000000-0000-4000-8000-0000000000aa'), 'confirmed phone = verified';
  insert into auth.users (id, is_anonymous, email_confirmed_at) values ('b0000000-0000-4000-8000-0000000000ab', true, now());
  assert not public.ayna_user_is_verified('b0000000-0000-4000-8000-0000000000ab'), 'anonymous guest never verified';
  raise notice 'ok  verification definition';
end $$;

-- ── feedback validation (database side) ────────────────────────────────────
do $$
declare uid uuid := 'a0000000-0000-4000-8000-000000000001'; ok boolean;
begin
  begin
    insert into public.campaign_feedback (campaign_id, user_id, question_key, question, response)
    values ('free-product-2026', uid, 'like', 'what do you like', 'love it');
    ok := false;
  exception when others then ok := sqlerrm = 'feedback_too_short'; end;
  assert ok, 'short feedback rejected';

  begin
    insert into public.campaign_feedback (campaign_id, user_id, question_key, question, response)
    values ('free-product-2026', uid, 'like', 'what do you like', repeat('a', 200));
    ok := false;
  exception when others then ok := sqlerrm = 'feedback_low_effort'; end;
  assert ok, 'repeated-character feedback rejected';

  begin
    insert into public.campaign_feedback (campaign_id, user_id, question_key, question, response)
    values ('free-product-2026', uid, 'like', 'what do you like', repeat(' ', 200));
    ok := false;
  exception when others then ok := sqlerrm = 'feedback_too_short'; end;
  assert ok, 'whitespace-only feedback rejected';

  insert into public.campaign_feedback (campaign_id, user_id, question_key, question, response) values
  ('free-product-2026', uid, 'like', 'what do you like',
   'The match percentages are actually useful. I compared two pads and the breakdown of why one fit my sensitive skin better made me trust it.');

  begin
    insert into public.campaign_feedback (campaign_id, user_id, question_key, question, response) values
    ('free-product-2026', uid, 'friction', 'what is confusing',
     'the match percentages are actually useful! I compared two pads, and the breakdown of why one fit my sensitive skin better made me trust it');
    ok := false;
  exception when unique_violation then ok := true; end;
  assert ok, 'same answer pasted into a second question rejected';

  assert (select is_complete and char_count >= 120 from public.campaign_feedback where user_id = uid and question_key = 'like'), 'stored with count + status';
  raise notice 'ok  feedback validation';
end $$;

insert into public.campaign_feedback (campaign_id, user_id, question_key, question, response) values
 ('free-product-2026', 'a0000000-0000-4000-8000-000000000001', 'friction', 'what is confusing',
  'Finding my saved products again took a while. The Ecosystem and Saved pages feel similar and I kept opening the wrong one when I wanted to compare.'),
 ('free-product-2026', 'a0000000-0000-4000-8000-000000000001', 'change', 'what would you change',
  'I would add reminders for when a product I use is running low, or a way to note how long a pack lasts so the routine section knows when to nudge me.');

-- ── referrals ───────────────────────────────────────────────────────────────
-- Friends sign up through the link: the sign-up trigger records them.
do $$
declare c text := (select code from t_ctx);
begin
  insert into auth.users (id, email, raw_user_meta_data) values
    ('f0000000-0000-4000-8000-000000000001', 'f1@test.dev', jsonb_build_object('referred_by', c)),
    ('f0000000-0000-4000-8000-000000000002', 'f2@test.dev', jsonb_build_object('referred_by', c)),
    ('f0000000-0000-4000-8000-000000000003', 'f3@test.dev', jsonb_build_object('referred_by', upper(c))),
    ('f0000000-0000-4000-8000-000000000004', 'f4@test.dev', jsonb_build_object('referred_by', c)),
    ('f0000000-0000-4000-8000-000000000009', 'bad@test.dev', jsonb_build_object('referred_by', 'zzzzzzzz'));
  assert (select count(*) from public.referrals where referrer_user_id = 'a0000000-0000-4000-8000-000000000001') = 4, 'signup trigger recorded 4 friends';
  assert (select source from public.referrals where referred_user_id = 'f0000000-0000-4000-8000-000000000001') = 'signup', 'source = signup';
  assert not exists (select 1 from public.referrals where referred_user_id = 'f0000000-0000-4000-8000-000000000009'), 'unknown code ignored, sign-up still succeeded';
  assert exists (select 1 from auth.users where id = 'f0000000-0000-4000-8000-000000000009'), 'bad code never blocks the sign-up';
  raise notice 'ok  sign-up attribution';
end $$;

do $$
declare ok boolean; p jsonb;
begin
  -- 0 verified friends yet
  p := public.campaign_progress('a0000000-0000-4000-8000-000000000001', 'free-product-2026');
  assert (p ->> 'referrals_joined')::int = 4 and (p ->> 'referrals_verified')::int = 0, '4 joined, 0 verified: ' || p::text;
  assert not (p ->> 'eligible')::boolean, 'not eligible with 0 verified';
  assert (p ->> 'verified')::boolean and jsonb_array_length(p -> 'feedback_done') = 3, 'own account verified + 3 feedback';

  update auth.users set email_confirmed_at = now() where id = 'f0000000-0000-4000-8000-000000000001';
  p := public.campaign_progress('a0000000-0000-4000-8000-000000000001', 'free-product-2026');
  assert (p ->> 'referrals_verified')::int = 1 and not (p ->> 'eligible')::boolean, '1 verified';

  update auth.users set email_confirmed_at = now() where id = 'f0000000-0000-4000-8000-000000000001'; -- replayed verification
  update auth.users set phone_confirmed_at = now() where id = 'f0000000-0000-4000-8000-000000000002';
  p := public.campaign_progress('a0000000-0000-4000-8000-000000000001', 'free-product-2026');
  assert (p ->> 'referrals_verified')::int = 2, 'replayed verification does not double count';

  -- existing (pre-campaign) account tries to count: the 7-day client policy
  -- would let it insert, but the campaign never counts it
  insert into public.referrals (referred_user_id, referrer_code) values ('e0000000-0000-4000-8000-000000000001', (select code from t_ctx));
  p := public.campaign_progress('a0000000-0000-4000-8000-000000000001', 'free-product-2026');
  assert (p ->> 'referrals_joined')::int = 4, 'existing account not counted';

  -- self referral
  begin
    insert into public.referrals (referred_user_id, referrer_code) values ('a0000000-0000-4000-8000-000000000001', (select code from t_ctx));
    ok := false;
  exception when others then ok := sqlerrm = 'self_referral'; end;
  assert ok, 'self-referral rejected';

  -- same friend attributed to a second referrer
  begin
    insert into public.referrals (referred_user_id, referrer_code)
    values ('f0000000-0000-4000-8000-000000000001', public.ayna_get_referral_code('a0000000-0000-4000-8000-000000000003'));
    ok := false;
  exception when unique_violation then ok := true; end;
  assert ok, 'a friend can only ever belong to one referrer';

  -- attribution can't be edited
  begin
    update public.referrals set referrer_user_id = 'a0000000-0000-4000-8000-000000000003' where referred_user_id = 'f0000000-0000-4000-8000-000000000001';
    ok := false;
  exception when others then ok := sqlerrm = 'referrals_are_immutable'; end;
  assert ok, 'referrals immutable';

  -- a friend whose referral was recorded long after signup (late attach) doesn't count
  insert into auth.users (id, email, created_at, email_confirmed_at) values
    ('f0000000-0000-4000-8000-000000000005', 'late@test.dev', now() - interval '50 minutes', now());
  update public.campaigns set attribution_window = interval '10 minutes' where id = 'free-product-2026';
  insert into public.referrals (referred_user_id, referrer_code) values ('f0000000-0000-4000-8000-000000000005', (select code from t_ctx));
  p := public.campaign_progress('a0000000-0000-4000-8000-000000000001', 'free-product-2026');
  assert (p ->> 'referrals_joined')::int = 4, 'late attribution outside window not counted';
  update public.campaigns set attribution_window = interval '24 hours' where id = 'free-product-2026';
  delete from public.referrals where referred_user_id = 'f0000000-0000-4000-8000-000000000005';
  raise notice 'ok  referral rules (0/1/2 verified, replay, existing user, self, duplicate, immutable, window)';
end $$;

-- ── spinning before eligible ───────────────────────────────────────────────
do $$
begin
  assert public.campaign_spin('a0000000-0000-4000-8000-000000000001', 'free-product-2026') ->> 'status' = 'not_eligible', 'no spin at 2/3';
  assert public.campaign_spin('a0000000-0000-4000-8000-000000000002', 'free-product-2026') ->> 'status' = 'not_eligible', 'unverified user cannot spin';
  raise notice 'ok  ineligible users cannot spin';
end $$;

-- third friend verifies -> eligible. No inventory yet -> empty wheel.
update auth.users set email_confirmed_at = now() where id = 'f0000000-0000-4000-8000-000000000003';

do $$
declare p jsonb;
begin
  p := public.campaign_progress('a0000000-0000-4000-8000-000000000001', 'free-product-2026');
  assert (p ->> 'eligible')::boolean, 'eligible at 3/3: ' || p::text;
  assert not (p ->> 'inventory_available')::boolean, 'no stock yet';
  assert public.campaign_spin('a0000000-0000-4000-8000-000000000001', 'free-product-2026') ->> 'status' = 'empty', 'empty pool never spins';

  -- campaign switched off
  update public.campaigns set is_active = false where id = 'free-product-2026';
  assert not public.campaign_is_eligible('a0000000-0000-4000-8000-000000000001', 'free-product-2026'), 'inactive campaign = not eligible';
  update public.campaigns set is_active = true where id = 'free-product-2026';
  raise notice 'ok  eligibility, empty pool, inactive campaign';
end $$;

insert into public.campaign_rewards (campaign_id, product_id, inventory_total) values
  ('free-product-2026', 't-prod-a', 1),
  ('free-product-2026', 't-prod-b', 5),
  ('free-product-2026', 't-prod-c', 0);

-- ── spins, respins, claim ───────────────────────────────────────────────────
do $$
declare s jsonb; s2 jsonb; prev uuid; i int; r jsonb; ok boolean;
begin
  -- respins never repeat back-to-back while 2 products are in stock; never offer 0-stock C
  s := public.campaign_spin('a0000000-0000-4000-8000-000000000001', 'free-product-2026');
  assert s ->> 'status' = 'ok', 'spin ok';
  prev := (s ->> 'reward_id')::uuid;
  for i in 1..20 loop
    s2 := public.campaign_spin('a0000000-0000-4000-8000-000000000001', 'free-product-2026');
    assert (s2 ->> 'reward_id')::uuid <> prev, 'respin avoided immediate repeat';
    assert s2 -> 'product' ->> 'id' <> 't-prod-c', 'sold-out product never shown';
    prev := (s2 ->> 'reward_id')::uuid;
  end loop;
  assert (select count(*) from public.campaign_spins where user_id = 'a0000000-0000-4000-8000-000000000001') = 21, 'spins logged';
  assert (select inventory_claimed from public.campaign_rewards where product_id = 't-prod-b') = 0, 'spinning reserves nothing';

  -- claiming something other than the latest spin (API tampering)
  r := public.campaign_claim('a0000000-0000-4000-8000-000000000001', 'free-product-2026',
        (select id from public.campaign_rewards where product_id = 't-prod-c'), (s2 ->> 'spin_id')::bigint, 'tamper-key-000000001');
  assert r ->> 'status' = 'stale_spin', 'cannot claim a product you were not shown: ' || r::text;
  r := public.campaign_claim('a0000000-0000-4000-8000-000000000001', 'free-product-2026',
        (s2 ->> 'reward_id')::uuid, (s ->> 'spin_id')::bigint, 'tamper-key-000000002');
  assert r ->> 'status' = 'stale_spin', 'cannot claim with an old spin id';

  -- ineligible user calling claim directly
  r := public.campaign_claim('a0000000-0000-4000-8000-000000000002', 'free-product-2026',
        (s2 ->> 'reward_id')::uuid, (s2 ->> 'spin_id')::bigint, 'tamper-key-000000003');
  assert r ->> 'status' = 'not_eligible', 'ineligible user cannot claim';

  -- real claim
  r := public.campaign_claim('a0000000-0000-4000-8000-000000000001', 'free-product-2026',
        (s2 ->> 'reward_id')::uuid, (s2 ->> 'spin_id')::bigint, 'claim-key-0000000001');
  assert r ->> 'status' = 'claimed', 'claim: ' || r::text;
  assert (r ->> 'spins_before_claim')::int = 21, 'spin count recorded';
  assert (select sum(inventory_claimed) from public.campaign_rewards) = 1, 'inventory decremented exactly once';

  -- replay of the same request (double click / refresh)
  r := public.campaign_claim('a0000000-0000-4000-8000-000000000001', 'free-product-2026',
        (s2 ->> 'reward_id')::uuid, (s2 ->> 'spin_id')::bigint, 'claim-key-0000000001');
  assert r ->> 'status' = 'already_claimed' and (r ->> 'same_request')::boolean, 'replay returns the same claim';
  assert (select count(*) from public.campaign_claims where user_id = 'a0000000-0000-4000-8000-000000000001') = 1, 'one claim';
  assert (select sum(inventory_claimed) from public.campaign_rewards) = 1, 'replay did not decrement again';

  -- after claiming: no more spins, not eligible, progress shows the claim
  assert public.campaign_spin('a0000000-0000-4000-8000-000000000001', 'free-product-2026') ->> 'status' = 'already_claimed', 'no spins after claim';
  assert public.campaign_progress('a0000000-0000-4000-8000-000000000001', 'free-product-2026') -> 'claim' ->> 'fulfillment_status' = 'needs_address', 'claim visible';

  -- inventory can never go below zero, even by hand
  begin
    update public.campaign_rewards set inventory_claimed = inventory_total + 1 where product_id = 't-prod-a';
    ok := false;
  exception when check_violation then ok := true; end;
  assert ok, 'check constraint blocks negative remaining';
  raise notice 'ok  spins, respins, tamper, claim, replay, post-claim lock';
end $$;

-- ── shipping ────────────────────────────────────────────────────────────────
do $$
declare r jsonb; ok boolean;
begin
  r := public.campaign_save_shipping('a0000000-0000-4000-8000-000000000003', 'free-product-2026', 'X Y', '1 Main St', null, 'Ithaca', 'NY', '14850', 'x@y.co');
  assert r ->> 'status' = 'no_claim', 'no address without a claim';
  begin
    perform public.campaign_save_shipping('a0000000-0000-4000-8000-000000000001', 'free-product-2026', 'Test Person', '1 Main St', '', 'Ithaca', 'ny', 'ABCDE', 'x@y.co');
    ok := false;
  exception when check_violation then ok := true; end;
  assert ok, 'bad ZIP rejected';
  r := public.campaign_save_shipping('a0000000-0000-4000-8000-000000000001', 'free-product-2026', 'Test Person', '1 Main St', 'Apt 2', 'Ithaca', 'ny', '14850', 'X@Y.co');
  assert r ->> 'status' = 'saved', 'saved';
  assert (select state from public.campaign_shipping limit 1) = 'NY', 'state uppercased';
  assert (select fulfillment_status from public.campaign_claims where user_id = 'a0000000-0000-4000-8000-000000000001') = 'ready_to_ship', 'status advanced';
  raise notice 'ok  shipping';
end $$;

-- ── product sells out between spin and claim ────────────────────────────────
-- second referrer qualifies, spins until she sees A (1 unit). Someone else
-- takes A. Her claim fails gracefully and she can spin again.
do $$
declare
  u uuid := 'a0000000-0000-4000-8000-000000000003';
  c text := public.ayna_get_referral_code('a0000000-0000-4000-8000-000000000003');
  s jsonb; r jsonb; i int;
begin
  insert into public.campaign_feedback (campaign_id, user_id, question_key, question, response) values
   ('free-product-2026', u, 'like', 'test question', 'The quiz was quick and the recommendations felt specific to me rather than generic, especially the notes on ingredients to avoid.'),
   ('free-product-2026', u, 'friction', 'test question', 'Some product pages are long and I wanted a quicker way to jump to reviews from other people without scrolling past all the research sections.'),
   ('free-product-2026', u, 'change', 'test question', 'Let me filter Browse by price range and by where I can buy something in person, because I usually want to pick things up the same day.');
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
    ('f1000000-0000-4000-8000-000000000001', 'g1@test.dev', now(), jsonb_build_object('referred_by', c)),
    ('f1000000-0000-4000-8000-000000000002', 'g2@test.dev', now(), jsonb_build_object('referred_by', c)),
    ('f1000000-0000-4000-8000-000000000003', 'g3@test.dev', now(), jsonb_build_object('referred_by', c));
  assert public.campaign_is_eligible(u, 'free-product-2026'), 'second referrer eligible';

  for i in 1..50 loop
    s := public.campaign_spin(u, 'free-product-2026');
    exit when s -> 'product' ->> 'id' = 't-prod-a';
  end loop;
  assert s -> 'product' ->> 'id' = 't-prod-a', 'saw product A';

  update public.campaign_rewards set inventory_claimed = inventory_total where product_id = 't-prod-a'; -- someone else took the last one
  r := public.campaign_claim(u, 'free-product-2026', (s ->> 'reward_id')::uuid, (s ->> 'spin_id')::bigint, 'claim-key-0000000002');
  assert r ->> 'status' = 'out_of_stock', 'graceful out_of_stock: ' || r::text;
  assert (select inventory_remaining from public.campaign_rewards where product_id = 't-prod-a') = 0, 'not negative';
  assert not exists (select 1 from public.campaign_claims where user_id = u), 'no claim created';
  assert public.campaign_is_eligible(u, 'free-product-2026'), 'still eligible after a failed claim';

  for i in 1..10 loop
    s := public.campaign_spin(u, 'free-product-2026');
    assert s -> 'product' ->> 'id' = 't-prod-b', 'sold-out A never offered again';
  end loop;
  raise notice 'ok  sold out between spin and claim';
end $$;

-- ── permissions: browsers can't touch any of this ──────────────────────────
set role authenticated;
set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
do $$
declare ok boolean;
begin
  begin perform 1 from public.campaign_rewards; ok := false; exception when insufficient_privilege then ok := true; end;
  assert ok, 'authenticated cannot read inventory';
  begin perform 1 from public.campaign_feedback; ok := false; exception when insufficient_privilege then ok := true; end;
  assert ok, 'authenticated cannot read feedback';
  begin perform 1 from public.campaign_shipping; ok := false; exception when insufficient_privilege then ok := true; end;
  assert ok, 'authenticated cannot read addresses';
  begin perform 1 from public.campaign_admin_overview; ok := false; exception when insufficient_privilege then ok := true; end;
  assert ok, 'authenticated cannot read the admin view';
  begin perform public.campaign_claim('a0000000-0000-4000-8000-000000000001', 'free-product-2026', gen_random_uuid(), 1, 'x-key-0000000000001'); ok := false;
  exception when insufficient_privilege then ok := true; end;
  assert ok, 'authenticated cannot call claim directly';
  begin perform public.campaign_progress('a0000000-0000-4000-8000-000000000003', 'free-product-2026'); ok := false;
  exception when insufficient_privilege then ok := true; end;
  assert ok, 'authenticated cannot read anyone''s progress via RPC';
  raise notice 'ok  browser roles locked out';
end $$;
reset role;

-- A brand-new Google sign-up uses the existing client insert path. It works,
-- but can't claim the row came from the sign-up form.
insert into auth.users (id, email, email_confirmed_at) values ('d0000000-0000-4000-8000-000000000001', 'oauth@test.dev', now());
create temp table t_code2 as select public.ayna_get_referral_code('a0000000-0000-4000-8000-000000000003') as code;
grant select on t_code2 to authenticated;
set role authenticated;
set request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000001';
do $$
declare ok boolean;
begin
  begin
    insert into public.referrals (referred_user_id, referrer_code, source) values (auth.uid(), (select code from t_code2), 'signup'); ok := false;
  exception when insufficient_privilege then ok := true; end;
  assert ok, 'client cannot pretend a referral came from sign-up';
  begin
    insert into public.referrals (referred_user_id, referrer_code, referrer_user_id) values (auth.uid(), (select code from t_code2), auth.uid()); ok := true;
  exception when others then ok := false; end;
  assert ok, 'fresh OAuth account can attach a referral from the client';
  raise notice 'ok  client attach path (fresh account) works, cannot spoof source';
end $$;
reset role;
do $$ begin
  assert (select referrer_user_id from public.referrals where referred_user_id = 'd0000000-0000-4000-8000-000000000001') = 'a0000000-0000-4000-8000-000000000003',
    'referrer resolved by the database, client-sent referrer_user_id ignored';
end $$;

set role anon;
do $$
declare ok boolean;
begin
  begin perform 1 from public.referral_codes; ok := false; exception when insufficient_privilege then ok := true; end;
  assert ok, 'anon cannot list referral codes';
  begin perform 1 from public.campaign_claims; ok := false; exception when insufficient_privilege then ok := true; end;
  assert ok, 'anon cannot read claims';
  raise notice 'ok  anon locked out';
end $$;
reset role;

select 'campaign behaviour tests passed' as result;
