-- Schema self-check. Run AFTER applying the migrations, against the same
-- database the app points at. Raises on the first problem it finds.
--
--   psql "$SUPABASE_DB_URL" -f supabase/_verify.sql
--   -- or paste into the Supabase SQL editor
--
-- This exists because the app fails in specific, SILENT ways when a piece of
-- this schema is missing: quotas fail open, phone verification 500s, and
-- ecosystem writes are rejected with an opaque message. Each assertion names the
-- consequence so a failure is actionable.

-- ── Part 1: objects exist ────────────────────────────────────────────────────
do $$
declare
  missing text[] := '{}';
begin
  if to_regclass('public.user_ecosystems') is null then
    missing := array_append(missing, 'TABLE user_ecosystems — ecosystem cannot be saved or loaded');
  end if;
  if to_regclass('public.user_reviews') is null then
    missing := array_append(missing, 'TABLE user_reviews — ratings/reviews cannot be saved');
  end if;
  if to_regclass('public.user_learning_memory') is null then
    missing := array_append(missing, 'TABLE user_learning_memory — learning signals cannot be saved');
  end if;
  if to_regclass('public.user_ai_usage') is null then
    missing := array_append(missing, 'TABLE user_ai_usage — AI quotas fail OPEN (unmetered spend)');
  end if;
  if to_regclass('public.user_ecosystem_builds') is null then
    missing := array_append(missing, 'TABLE user_ecosystem_builds — ecosystem build quota fails OPEN');
  end if;
  if to_regclass('public.pending_phone_verifications') is null then
    missing := array_append(missing, 'TABLE pending_phone_verifications — phone verification 500s');
  end if;
  if to_regclass('public.health_intakes') is null then
    missing := array_append(missing, 'TABLE health_intakes — intake cannot be saved');
  end if;
  if to_regclass('public.phone_numbers') is null then
    missing := array_append(missing, 'TABLE phone_numbers — phone verification cannot complete');
  end if;
  if to_regclass('public.sms_conversations') is null then
    missing := array_append(missing, 'TABLE sms_conversations — SMS transcript cannot be written');
  end if;

  -- Functions the API calls by name. A missing one is not a crash: the app
  -- logs and degrades, which is exactly why this check matters.
  if to_regprocedure('public.consume_ai_usage(uuid,text,text,integer)') is null then
    missing := array_append(missing, 'FUNCTION consume_ai_usage() — chat/insights quotas fail OPEN');
  end if;
  if to_regprocedure('public.refund_ai_usage(uuid,text,text)') is null then
    missing := array_append(missing, 'FUNCTION refund_ai_usage() — failed generations keep the charge');
  end if;
  if to_regprocedure('public.claim_ecosystem_build(uuid,text,integer)') is null then
    missing := array_append(missing, 'FUNCTION claim_ecosystem_build() — build quota fails OPEN');
  end if;
  if to_regprocedure('public.release_ecosystem_build(uuid,text)') is null then
    missing := array_append(missing, 'FUNCTION release_ecosystem_build() — failed builds burn the lifetime quota');
  end if;
  if to_regprocedure('public.claim_otp_attempt(uuid,integer)') is null then
    missing := array_append(missing, 'FUNCTION claim_otp_attempt() — /api/phone-verify-confirm returns 500 on EVERY attempt');
  end if;

  -- Composite keys the upserts target. Without them `onConflict:
  -- "user_id,product_id"` raises 42P10 and every write fails.
  if to_regclass('public.user_ecosystems') is not null
     and not exists (
       select 1 from pg_constraint
       where conrelid = 'public.user_ecosystems'::regclass
         and contype in ('p', 'u')
         and array_length(conkey, 1) = 2
     ) then
    missing := array_append(missing, 'CONSTRAINT user_ecosystems(user_id, product_id) — every upsert raises 42P10');
  end if;
  if to_regclass('public.user_reviews') is not null
     and not exists (
       select 1 from pg_constraint
       where conrelid = 'public.user_reviews'::regclass
         and contype in ('p', 'u')
         and array_length(conkey, 1) = 2
     ) then
    missing := array_append(missing, 'CONSTRAINT user_reviews(user_id, product_id) — every upsert raises 42P10');
  end if;

  -- ecosystemStore.clearEcosystemForUser needs UPDATE *and* DELETE. Under RLS a
  -- missing policy is a silent 0-row no-op, not an error.
  if to_regclass('public.user_ecosystems') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'user_ecosystems' and cmd in ('UPDATE', 'ALL')
    ) then
      missing := array_append(missing, 'POLICY user_ecosystems UPDATE — clearing the ecosystem silently does nothing');
    end if;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'user_ecosystems' and cmd in ('DELETE', 'ALL')
    ) then
      missing := array_append(missing, 'POLICY user_ecosystems DELETE — removing a product silently does nothing');
    end if;
  end if;

  -- SECURITY: the OTP table must NOT be client-readable. A SELECT policy here is
  -- the account-takeover path — the attacker owns the row created for the
  -- victim's number, so RLS hands them code_hash to crack offline.
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pending_phone_verifications'
      and cmd in ('SELECT', 'ALL')
      and 'authenticated' = any(roles)
  ) then
    missing := array_append(missing, 'SECURITY: pending_phone_verifications is readable by authenticated users — DROP that policy');
  end if;

  if array_length(missing, 1) > 0 then
    raise exception E'Schema verification FAILED:\n  - %', array_to_string(missing, E'\n  - ');
  end if;

  raise notice 'Schema objects: OK';
end $$;

-- ── Part 2: the functions return the shape the JavaScript destructures ───────
-- api/_usageLimit.js reads row.allowed / row.used. A shape mismatch there is
-- caught as an error and degrades the quota to fail-open, so existence alone is
-- not enough to verify.
do $$
declare
  uid uuid;
  v_allowed boolean;
  v_used integer;
begin
  select id into uid from auth.users limit 1;
  if uid is null then
    raise notice 'No auth.users row — skipping behavioural checks (run again after a signup).';
    return;
  end if;

  -- Use a throwaway period so real counters are untouched.
  delete from public.user_ai_usage where user_id = uid and period = 'verify:probe';

  select allowed, used into v_allowed, v_used
    from public.consume_ai_usage(uid, 'verify:probe', 'chat', 1);
  if v_allowed is distinct from true or v_used is distinct from 1 then
    raise exception 'consume_ai_usage returned (allowed=%, used=%); expected (true, 1)', v_allowed, v_used;
  end if;

  select allowed into v_allowed
    from public.consume_ai_usage(uid, 'verify:probe', 'chat', 1);
  if v_allowed is distinct from false then
    raise exception 'consume_ai_usage did not enforce the limit on the second call (allowed=%)', v_allowed;
  end if;

  perform public.refund_ai_usage(uid, 'verify:probe', 'chat');
  delete from public.user_ai_usage where user_id = uid and period = 'verify:probe';

  delete from public.user_ecosystem_builds where user_id = uid and build_id = 'verify:probe-build';

  select allowed into v_allowed
    from public.claim_ecosystem_build(uid, 'verify:probe-build', 999);
  if v_allowed is distinct from true then
    raise exception 'claim_ecosystem_build returned allowed=%; expected true', v_allowed;
  end if;

  -- Idempotence is what makes multi-batch generation and retry-after-failure
  -- safe; if this regresses, a retry costs the user another lifetime build.
  select allowed into v_allowed
    from public.claim_ecosystem_build(uid, 'verify:probe-build', 999);
  if v_allowed is distinct from true then
    raise exception 'claim_ecosystem_build is NOT idempotent for a repeated build_id';
  end if;

  perform public.release_ecosystem_build(uid, 'verify:probe-build');
  delete from public.user_ecosystem_builds where user_id = uid and build_id = 'verify:probe-build';

  raise notice 'Function contracts: OK';
end $$;
