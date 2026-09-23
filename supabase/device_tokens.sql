-- Push-notification device tokens (APNs for now; platform column leaves room
-- for FCM/Android later). One row per physical device token — a user can
-- have several (old phone + new phone, reinstalled app), so this is NOT a
-- user_id-primary-key table like notification_preferences.sql/phone_numbers.sql.
-- Written through api/device-tokens.js after a real Supabase JWT is verified
-- (see api/_usageLimit.js's verifyUser) — a device never gets to claim an
-- arbitrary user_id itself.
--
-- Registration only for now (src/mobile/hooks/usePushNotifications.js) —
-- nothing in this codebase sends a push yet. That step needs the APNs
-- auth key wired in server-side and is deliberately out of scope here.
--
-- NOTE on reassignment + RLS: the upsert-on-device_token below (a device
-- changing hands reassigns the existing row's user_id, see api/device-
-- tokens.js) only actually works through the service-role client, which
-- bypasses RLS. Postgres gates an UPDATE's candidate rows through the
-- SELECT policy too (AND semantics) — so under the RLS-constrained local-
-- dev fallback (verifyUserWithRls, used only without a service-role key),
-- a caller can never even see a row it doesn't already own, and reassigning
-- one under that fallback silently updates 0 rows rather than erroring.
-- That's an accepted, narrow gap in the local-only fallback path, not the
-- deployed one — loosening the SELECT policy to close it would leak every
-- user's device token to every other authenticated user, which is worse.
create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_token text not null,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A device_token is unique to one physical device+app install, regardless of
-- which account is signed in on it — api/device-tokens.js upserts on this
-- constraint, so signing out and into a different account on the same
-- device reassigns the existing row's user_id instead of erroring on a
-- duplicate or leaving a stale row pointed at the previous account.
create unique index if not exists device_tokens_device_token_key
on public.device_tokens (device_token);

create index if not exists device_tokens_user_id_idx
on public.device_tokens (user_id);

alter table public.device_tokens enable row level security;

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all (see phone_numbers.sql).
grant select, insert, update, delete on public.device_tokens to authenticated;
grant all on public.device_tokens to service_role;

drop policy if exists "device_tokens_select_own" on public.device_tokens;
create policy "device_tokens_select_own"
on public.device_tokens
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "device_tokens_upsert_own" on public.device_tokens;
create policy "device_tokens_upsert_own"
on public.device_tokens
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "device_tokens_update_own" on public.device_tokens;
create policy "device_tokens_update_own"
on public.device_tokens
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Without a DELETE policy every delete is silently blocked (RLS returns 0
-- rows affected, not an error) — same reasoning as phone_numbers.sql. A
-- device changing hands or a user revoking push access needs a real path
-- to remove its token, even though nothing calls it yet.
drop policy if exists "device_tokens_delete_own" on public.device_tokens;
create policy "device_tokens_delete_own"
on public.device_tokens
for delete
to authenticated
using (auth.uid() = user_id);
