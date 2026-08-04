-- Behavioural regression tests for the schema.
--
-- _verify.sql answers "is everything present and does it return the right
-- shape". This file answers "does it actually DO the right thing" — RLS
-- isolation, the account-takeover fix, quota atomicity, build idempotence, and
-- the ecosystem-clear data-loss fix.
--
-- Raises on the first failure, so it is safe in CI:
--   psql "$DB" -v ON_ERROR_STOP=1 -f supabase/_behaviour_test.sql
--
-- Requires two seeded auth.users rows (the harness in scripts/test-migrations.sh
-- creates them). Writes only to its own test rows and cleans up after itself.

\set A '00000000-0000-4000-8000-0000000000fa'
\set B '00000000-0000-4000-8000-0000000000fb'

insert into auth.users (id, email) values (:'A','beh-a@test.local'), (:'B','beh-b@test.local')
on conflict (id) do nothing;

-- Clean slate for repeat runs.
delete from public.user_ecosystems where user_id in (:'A', :'B');
delete from public.user_ai_usage where user_id = :'A';
delete from public.user_ecosystem_builds where user_id = :'A';
delete from public.pending_phone_verifications where user_id = :'A';

do $$
declare
  v_allowed boolean;
  v_used integer;
  v_hash text;
  v_locked boolean;
  n integer;
  a uuid := '00000000-0000-4000-8000-0000000000fa';
  b uuid := '00000000-0000-4000-8000-0000000000fb';
begin
  -- ── RLS isolation ─────────────────────────────────────────────────────────
  insert into public.user_ecosystems (user_id, product_id, product_name, in_ecosystem, is_tracked, is_omitted)
  values (a,'t-p1','plain',   true,  false, false),
         (a,'t-p2','tracked', true,  true,  false),
         (a,'t-p3','hidden',  true,  false, true),
         (b,'t-p9','B secret',true,  false, false);

  -- ── clearEcosystemForUser: must preserve tracked/omitted ─────────────────
  -- The old implementation deleted whole rows, so editing a health profile also
  -- erased the products a user had explicitly HIDDEN, and the LLM re-recommended
  -- them. This mirrors ecosystemStore.clearEcosystemForUser exactly.
  update public.user_ecosystems set in_ecosystem = false, updated_at = now()
   where user_id = a and in_ecosystem = true;
  delete from public.user_ecosystems
   where user_id = a and in_ecosystem = false and is_tracked = false and is_omitted = false;

  select count(*) into n from public.user_ecosystems where user_id = a and product_id = 't-p1';
  if n <> 0 then raise exception 'clear did not remove the plain ecosystem row'; end if;
  select count(*) into n from public.user_ecosystems where user_id = a and is_omitted;
  if n <> 1 then raise exception 'clear DESTROYED the hidden product (data loss regression)'; end if;
  select count(*) into n from public.user_ecosystems where user_id = a and is_tracked;
  if n <> 1 then raise exception 'clear DESTROYED the tracked product (data loss regression)'; end if;

  -- ── Quota: atomic, enforced, refundable ──────────────────────────────────
  select allowed, used into v_allowed, v_used from public.consume_ai_usage(a,'beh','chat',2);
  if not v_allowed or v_used <> 1 then raise exception 'first consume wrong: %/%', v_allowed, v_used; end if;
  select allowed, used into v_allowed, v_used from public.consume_ai_usage(a,'beh','chat',2);
  if not v_allowed or v_used <> 2 then raise exception 'second consume wrong'; end if;
  select allowed, used into v_allowed, v_used from public.consume_ai_usage(a,'beh','chat',2);
  if v_allowed then raise exception 'limit NOT enforced — quota over-served'; end if;
  if v_used <> 2 then raise exception 'blocked consume must not increment'; end if;

  -- refund returns the POST-decrement count.
  select public.refund_ai_usage(a,'beh','chat') into n;
  if n <> 1 then raise exception 'refund returned %, expected 1', n; end if;
  select allowed into v_allowed from public.consume_ai_usage(a,'beh','chat',2);
  if not v_allowed then raise exception 'refund did not free a slot — failed generations stay charged'; end if;

  -- A zero/negative limit must grant nothing (the INSERT branch skips the check).
  select allowed into v_allowed from public.consume_ai_usage(a,'beh-zero','chat',0);
  if v_allowed then raise exception 'a limit of 0 granted a use'; end if;

  -- ── Ecosystem build: idempotent per build, capped across builds ───────────
  select allowed into v_allowed from public.claim_ecosystem_build(a,'beh-build-1',1);
  if not v_allowed then raise exception 'first build claim denied'; end if;
  select allowed into v_allowed from public.claim_ecosystem_build(a,'beh-build-1',1);
  if not v_allowed then raise exception 'same build_id denied — multi-batch and retry would burn the quota'; end if;
  select allowed into v_allowed from public.claim_ecosystem_build(a,'beh-build-2',1);
  if v_allowed then raise exception 'lifetime build limit is bypassable'; end if;
  perform public.release_ecosystem_build(a,'beh-build-1');
  select allowed into v_allowed from public.claim_ecosystem_build(a,'beh-build-2',1);
  if not v_allowed then raise exception 'release did not restore the build — a failed build bricks the account'; end if;

  -- ── OTP attempt cap ──────────────────────────────────────────────────────
  insert into public.pending_phone_verifications (user_id, phone_number, code_hash, expires_at)
  values (a,'+15551234567','H', now() + interval '10 min')
  on conflict (user_id) do update set attempts = 0, code_hash = 'H', expires_at = now() + interval '10 min';

  select code_hash into v_hash from public.claim_otp_attempt(a, 2);
  if v_hash is distinct from 'H' then raise exception 'first attempt did not return the hash'; end if;
  perform public.claim_otp_attempt(a, 2);
  select locked_out into v_locked from public.claim_otp_attempt(a, 2);
  if not v_locked then raise exception 'attempt cap NOT enforced — brute force is open'; end if;
  select count(*) into n from public.pending_phone_verifications where user_id = a;
  if n <> 0 then raise exception 'lockout left a crackable hash on disk'; end if;

  -- Expired codes are rejected even while under the cap.
  insert into public.pending_phone_verifications (user_id, phone_number, code_hash, expires_at)
  values (a,'+15551234567','H', now() - interval '1 min');
  if not (select expired from public.claim_otp_attempt(a, 5)) then
    raise exception 'an expired code was not reported as expired';
  end if;

  raise notice 'Behaviour: OK';
end $$;

-- ── RLS, which must run as the actual roles ─────────────────────────────────
begin;
  set local role authenticated;
  set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000fa';
  do $$
  declare n integer;
  begin
    select count(*) into n from public.user_ecosystems;
    -- A cleared 't-p1' plus B's row must both be invisible: 2 of A's remain.
    if n <> 2 then raise exception 'RLS leak: authenticated user sees % rows, expected 2', n; end if;
    select count(*) into n from public.pending_phone_verifications;
    if n <> 0 then raise exception 'SECURITY: OTP code_hash is readable by the client — account takeover path is OPEN'; end if;
    if has_function_privilege('authenticated','public.refund_ai_usage(uuid,text,text)','execute') then
      raise exception 'SECURITY: a browser session can call refund_ai_usage and mint quota';
    end if;
    raise notice 'RLS (authenticated): OK';
  end $$;
commit;

begin;
  set local role anon;
  do $$
  declare n integer;
  begin
    select count(*) into n from public.user_ecosystems;
    if n <> 0 then raise exception 'RLS leak: anon can read user ecosystems'; end if;
    select count(*) into n from public.product_catalog;
    if n = 0 then raise exception 'catalog not readable signed-out — Discovery would be empty'; end if;
    raise notice 'RLS (anon): OK';
  end $$;
commit;

-- Cleanup.
delete from public.user_ecosystems where user_id in (:'A', :'B');
delete from public.user_ai_usage where user_id = :'A';
delete from public.user_ecosystem_builds where user_id = :'A';
delete from public.pending_phone_verifications where user_id = :'A';

select 'behaviour tests passed' as status;
