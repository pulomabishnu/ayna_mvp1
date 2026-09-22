-- One row per user per calendar month (check_in_month is always the 1st of
-- that month) — a lightweight monthly re-ask that only re-opens what's
-- likely to have actually changed since intake (symptoms, flow, pain,
-- medications), plus the one signal intake structurally can't ask: whether
-- last month's recommendations actually helped. See
-- src/mobile/screens/MonthlyCheckinScreen.jsx for the question flow this
-- backs, and src/utils/monthlyCheckinStore.js for how it's read/written.
--
-- Answers are stored as one jsonb blob (not a column per question) — same
-- reasoning as health_intakes.sql's `profile` column: the question set is
-- expected to evolve, and a jsonb blob doesn't need a migration every time
-- a step's options change. Accessed directly from the client via RLS (no
-- serverless endpoint) — same pattern as health_intakes.sql, since a user
-- only ever reads/writes their own check-ins, never another user's.
create table if not exists public.monthly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in_month date not null,
  answers jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One check-in per user per month — redoing the same month's check-in (the
-- person backs out and retakes it) upserts in place instead of piling up
-- duplicate history rows for that month.
create unique index if not exists monthly_checkins_user_month_key
on public.monthly_checkins (user_id, check_in_month);

-- Fetching "last month's" check-in for pre-fill is always a most-recent-
-- before-this-month lookup, not an exact-month match.
create index if not exists monthly_checkins_user_id_month_idx
on public.monthly_checkins (user_id, check_in_month desc);

alter table public.monthly_checkins enable row level security;

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all (see phone_numbers.sql).
grant select, insert, update, delete on public.monthly_checkins to authenticated;
grant all on public.monthly_checkins to service_role;

drop policy if exists "monthly_checkins_select_own" on public.monthly_checkins;
create policy "monthly_checkins_select_own"
on public.monthly_checkins
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "monthly_checkins_upsert_own" on public.monthly_checkins;
create policy "monthly_checkins_upsert_own"
on public.monthly_checkins
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "monthly_checkins_update_own" on public.monthly_checkins;
create policy "monthly_checkins_update_own"
on public.monthly_checkins
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Without a DELETE policy every delete is silently blocked (RLS returns 0
-- rows affected, not an error) — same reasoning as phone_numbers.sql /
-- device_tokens.sql. Needed for the same account-deletion/erasure path
-- health_intakes.sql calls out, even though nothing calls it yet.
drop policy if exists "monthly_checkins_delete_own" on public.monthly_checkins;
create policy "monthly_checkins_delete_own"
on public.monthly_checkins
for delete
to authenticated
using (auth.uid() = user_id);
