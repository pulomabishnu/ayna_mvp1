-- Free product campaign: end-to-end check that is safe to run on PRODUCTION.
-- Paste into the Supabase SQL Editor and Run. It creates pretend accounts,
-- walks every sign-up path through the real triggers, policies and counting
-- functions, then throws an error on purpose so Postgres undoes EVERYTHING.
-- Nothing is left behind. The error message IS the report:
--   "LIVE CHECK PASSED" + one line per case, or "LIVE CHECK FAILED" + the lines.

do $$
declare
  c constant text := 'free-product-2026';
  started timestamptz;
  r uuid := gen_random_uuid();          -- the person sharing the link
  rc text;
  f_email uuid := gen_random_uuid();    -- signs up with email + password
  f_phone uuid := gen_random_uuid();    -- signs up with a phone number
  f_google uuid := gen_random_uuid();   -- signs up with Google (browser records the code)
  f_dup1 uuid := gen_random_uuid();     -- the same friend twice (gmail dots / +tags)
  f_dup2 uuid := gen_random_uuid();
  f_alias uuid := gen_random_uuid();    -- the sharer's own second inbox
  f_before uuid := gen_random_uuid();   -- account made before the campaign launched
  f_old uuid := gen_random_uuid();      -- account older than 7 days
  f_self uuid := gen_random_uuid();     -- uses their own code
  f_late uuid := gen_random_uuid();     -- never confirms
  s text;
  n integer;
  p jsonb;
  report text := '';
  ok boolean := true;
  tag text := 'lc' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
begin
  select starts_at into started from public.reward_campaigns where id = c;
  if started is null then raise exception 'LIVE CHECK FAILED: campaign % has not been launched', c; end if;

  -- The sharer: an existing, verified gmail account.
  insert into auth.users (id, email, created_at, email_confirmed_at)
  values (r, tag || '.ref@gmail.com', now() - interval '60 days', now() - interval '60 days');
  rc := public.ayna_referral_code(r);

  -- 1. Email sign-up from the link: the form sends referred_by in metadata.
  insert into auth.users (id, email, created_at, raw_user_meta_data)
  values (f_email, tag || '-email@example.com', now(), jsonb_build_object('referred_by', rc));
  s := (select status from public.campaign_referral_rows(c, r) where referred_user_id = f_email);
  ok := ok and s is not distinct from 'unverified';
  report := report || format(E'\n1  email sign-up, not confirmed yet      -> %s (want unverified)', coalesce(s, 'NOT RECORDED'));

  -- 2. She taps the confirmation link (any device): only email_confirmed_at changes.
  update auth.users set email_confirmed_at = now() where id = f_email;
  s := (select status from public.campaign_referral_rows(c, r) where referred_user_id = f_email);
  ok := ok and s is not distinct from 'verified';
  report := report || format(E'\n2  ...after confirming her email          -> %s (want verified)', coalesce(s, 'NOT RECORDED'));

  -- 3. Phone sign-up from the link, code confirmed by text.
  insert into auth.users (id, phone, created_at, raw_user_meta_data, phone_confirmed_at)
  values (f_phone, '1555' || lpad((floor(random() * 1e7))::text, 7, '0'), now(), jsonb_build_object('referred_by', rc), now());
  s := (select status from public.campaign_referral_rows(c, r) where referred_user_id = f_phone);
  ok := ok and s is not distinct from 'verified';
  report := report || format(E'\n3  phone sign-up, code confirmed          -> %s (want verified)', coalesce(s, 'NOT RECORDED'));

  -- 4. Google sign-up: no metadata at sign-up. The browser inserts the row
  --    as the signed-in user, through the row-level security policy.
  insert into auth.users (id, email, created_at, email_confirmed_at)
  values (f_google, tag || '-google@example.com', now(), now());
  perform set_config('request.jwt.claims', json_build_object('sub', f_google, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', f_google::text, true);
  perform set_config('role', 'authenticated', true);
  insert into public.referrals (referred_user_id, referrer_code) values (f_google, rc);
  perform set_config('role', 'postgres', true);
  s := (select status from public.campaign_referral_rows(c, r) where referred_user_id = f_google);
  ok := ok and s is not distinct from 'verified';
  report := report || format(E'\n4  Google sign-up (browser records it)    -> %s (want verified)', coalesce(s, 'NOT RECORDED'));

  -- 5. Never confirms her email.
  insert into auth.users (id, email, created_at, raw_user_meta_data)
  values (f_late, tag || '-late@example.com', now(), jsonb_build_object('referred_by', rc));
  s := (select status from public.campaign_referral_rows(c, r) where referred_user_id = f_late);
  ok := ok and s is not distinct from 'unverified';
  report := report || format(E'\n5  never confirms                         -> %s (want unverified, does not count)', coalesce(s, 'NOT RECORDED'));

  -- 6. The same friend twice (gmail ignores dots and +tags).
  insert into auth.users (id, email, created_at, email_confirmed_at, raw_user_meta_data)
  values (f_dup1, tag || '.dup@gmail.com', now(), now(), jsonb_build_object('referred_by', rc));
  insert into auth.users (id, email, created_at, email_confirmed_at, raw_user_meta_data)
  values (f_dup2, tag || 'dup+2@gmail.com', now() + interval '1 second', now(), jsonb_build_object('referred_by', rc));
  s := (select string_agg(status, ',' order by joined_at) from public.campaign_referral_rows(c, r) where referred_user_id in (f_dup1, f_dup2));
  ok := ok and s is not distinct from 'verified,duplicate';
  report := report || format(E'\n6  same friend twice                      -> %s (want verified,duplicate)', coalesce(s, 'NOT RECORDED'));

  -- 7. The sharer's own other inbox.
  insert into auth.users (id, email, created_at, email_confirmed_at, raw_user_meta_data)
  values (f_alias, tag || '.ref+alt@gmail.com', now(), now(), jsonb_build_object('referred_by', rc));
  s := (select status from public.campaign_referral_rows(c, r) where referred_user_id = f_alias);
  ok := ok and s is not distinct from 'same_person';
  report := report || format(E'\n7  sharer''s own second inbox             -> %s (want same_person)', coalesce(s, 'NOT RECORDED'));

  -- 8. Account created before launch (within 7 days, so a row is written) never counts.
  insert into auth.users (id, email, created_at, email_confirmed_at, raw_user_meta_data)
  values (f_before, tag || '-before@example.com', least(started, now()) - interval '1 minute', now(), jsonb_build_object('referred_by', rc));
  s := (select status from public.campaign_referral_rows(c, r) where referred_user_id = f_before);
  ok := ok and (s is null or s = 'existing');
  report := report || format(E'\n8  account made before launch            -> %s (want existing or not recorded)', coalesce(s, 'not recorded'));

  -- 9. Old account adds a code later, and someone using their own code: no row at all.
  insert into auth.users (id, email, created_at, email_confirmed_at)
  values (f_old, tag || '-old@example.com', now() - interval '30 days', now() - interval '30 days');
  update auth.users set raw_user_meta_data = jsonb_build_object('referred_by', rc) where id = f_old;
  insert into auth.users (id, email, created_at, email_confirmed_at)
  values (f_self, tag || '-self@example.com', now(), now());
  update auth.users set raw_user_meta_data = jsonb_build_object('referred_by', public.ayna_referral_code(f_self)) where id = f_self;
  n := (select count(*) from public.referrals where referred_user_id in (f_old, f_self));
  ok := ok and n = 0;
  report := report || format(E'\n9  old account / own code rows            -> %s (want 0)', n);

  -- 10. The sharer: 4 counted friends (1, 3, 4, 6) and 3 answers unlocks the reward.
  p := public.campaign_progress(c, r);
  report := report || format(E'\n10 before answers: verified friends=%s, eligible=%s', p ->> 'referralsVerified', p ->> 'eligible');
  ok := ok and (p ->> 'referralsVerified')::int = 4 and not (p ->> 'eligible')::boolean;
  perform public.campaign_save_feedback(c, r, 'like', 'q1', 'I like that every product shows why it matched me and what the evidence actually says, which makes it way easier to trust the picks.', true);
  perform public.campaign_save_feedback(c, r, 'friction', 'q2', 'The quiz felt long on my phone and I was not sure which questions were optional, so I almost stopped halfway through the health part.', true);
  perform public.campaign_save_feedback(c, r, 'change', 'q3', 'I would add a way to compare two products side by side with price per month, because I keep opening tabs to figure out which is cheaper.', true);
  p := public.campaign_progress(c, r);
  ok := ok and (p ->> 'eligible')::boolean and (p ->> 'verified')::boolean;
  report := report || format(E'\n   after 3 answers: verified account=%s, eligible=%s (want true, true)', p ->> 'verified', p ->> 'eligible');

  -- 11. An unverified sharer is never eligible, whatever her friends do.
  update auth.users set email_confirmed_at = null where id = r;
  p := public.campaign_progress(c, r);
  ok := ok and not (p ->> 'eligible')::boolean;
  report := report || format(E'\n11 sharer not verified                    -> eligible=%s (want false)', p ->> 'eligible');

  raise exception '%', (case when ok then 'LIVE CHECK PASSED' else 'LIVE CHECK FAILED' end) || report
    || E'\n(This error is on purpose: it undoes every pretend account. Nothing was saved.)';
end
$$;
