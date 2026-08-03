-- Ephemeral OTP state for phone verification, used while Twilio Verify is
-- unavailable (e.g. trial accounts that can't provision a Verify Service).
--
-- SECURITY: this table is now SERVER-ONLY. It is read and written exclusively
-- with the service-role key by api/phone-verify-send.js and
-- api/phone-verify-confirm.js, which scope every query to the user id taken
-- from the verified JWT.
--
-- It previously had a "select own" policy, which was an account-takeover path:
-- an attacker starts verification for the VICTIM's phone number, so the pending
-- row is created under the ATTACKER's user_id and RLS happily hands them their
-- own row — including code_hash. The hash was an unsalted
-- sha256(`${user_id}:${code}`) over a 10^6 keyspace with a user_id they already
-- know, so it fell to an offline brute force in under 2 seconds (measured).
-- They then confirmed the code and bound someone else's number to their account.
--
-- Two changes close it: no client-readable policy (below), and an HMAC with a
-- server-side pepper (see api/_otp.js) so the hash cannot be attacked offline
-- even if a row does leak.
create table if not exists public.pending_phone_verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone_number text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists pending_phone_verifications_expires_at_idx
on public.pending_phone_verifications (expires_at);

alter table public.pending_phone_verifications enable row level security;

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all. Explicit here so the schema
-- does not depend on a project's default-privilege configuration.
-- SERVER-ONLY. No grant to anon/authenticated by design: that is the
-- account-takeover path. service_role bypasses RLS but still needs the GRANT.
grant all on public.pending_phone_verifications to service_role;

-- RLS enabled with NO policies for `authenticated` denies all client access.
-- The service-role key bypasses RLS, so the API still works.
drop policy if exists "pending_phone_verifications_select_own" on public.pending_phone_verifications;
drop policy if exists "pending_phone_verifications_upsert_own" on public.pending_phone_verifications;
drop policy if exists "pending_phone_verifications_update_own" on public.pending_phone_verifications;
drop policy if exists "pending_phone_verifications_delete_own" on public.pending_phone_verifications;

-- ── Atomic attempt claim ─────────────────────────────────────────────────────
-- The old flow read `attempts`, then wrote back `attempts + 1` from the
-- application. N concurrent guesses all read the same value and all wrote n+1,
-- so the 5-attempt cap was unenforceable under concurrency. This increments and
-- returns the row in a single statement.
drop function if exists public.claim_otp_attempt(uuid, integer);

create or replace function public.claim_otp_attempt(
  p_user_id uuid,
  p_max_attempts integer
)
returns table (
  found boolean,
  locked_out boolean,
  expired boolean,
  phone_number text,
  code_hash text,
  attempts integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.pending_phone_verifications%rowtype;
  hit boolean := false;
begin
  update public.pending_phone_verifications p
  set attempts = p.attempts + 1
  where p.user_id = p_user_id
  returning p.* into r;

  hit := r.user_id is not null;

  if not hit then
    return query select false, false, false, null::text, null::text, 0;
    return;
  end if;

  -- Past the cap: drop the row outright rather than leaving a crackable hash
  -- sitting there until it expires.
  if r.attempts > p_max_attempts then
    delete from public.pending_phone_verifications where user_id = p_user_id;
    return query select true, true, false, null::text, null::text, r.attempts;
    return;
  end if;

  if r.expires_at < now() then
    return query select true, false, true, r.phone_number, null::text, r.attempts;
    return;
  end if;

  return query select true, false, false, r.phone_number, r.code_hash, r.attempts;
end;
$$;

revoke all on function public.claim_otp_attempt(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_otp_attempt(uuid, integer) to service_role;

-- ── Housekeeping ─────────────────────────────────────────────────────────────
-- Abandoned verifications (user closes the tab, never enters the code) were
-- never collected, so the table accumulated unverified phone numbers plus a
-- hash for each, indefinitely. Schedule via pg_cron:
--   select cron.schedule('purge-otp', '*/15 * * * *',
--     $$select public.purge_expired_phone_verifications()$$);
create or replace function public.purge_expired_phone_verifications()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  n integer;
begin
  delete from public.pending_phone_verifications
  where expires_at < now() - interval '1 hour';
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.purge_expired_phone_verifications() from public, anon, authenticated;
grant execute on function public.purge_expired_phone_verifications() to service_role;
