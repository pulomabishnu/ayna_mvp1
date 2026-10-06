-- Monthly check-ins: one row per signed-in user per calendar month
-- (check_in_month is always the 1st of that month). Backs the website's
-- src/components/MonthlyCheckin.jsx (and the mobile app's
-- MonthlyCheckinScreen.jsx) through src/utils/monthlyCheckinStore.js.
--
-- Idempotent like every other file here: safe to re-run. Apply after
-- health_intakes.sql (no hard dependency; it only references auth.users).
--
-- Answers are one jsonb blob, not a column per question, for the same reason
-- as health_intakes.profile: the question set will keep changing and a blob
-- needs no migration when it does. It holds per-product verdicts
-- (helped / no change / worse), the safety question, and the focus areas.
-- The client reads and writes it directly under RLS; there is no API route.
--
-- Privacy model:
--   * Owner-only. Every policy is auth.uid() = user_id.
--   * Guests are excluded. Community guests are Supabase anonymous sign-ins:
--     role authenticated, but the JWT carries is_anonymous = true. A guest is
--     not an account, so they get no rows here at all (their check-in stays
--     in the browser, as it did before this table existed). Every policy
--     requires not is_anonymous, so a guest can neither read nor write.
--   * anon has no grants.

create table if not exists public.monthly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in_month date not null,
  answers jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  -- Always the 1st, so "this month" is unambiguous and the unique key below
  -- really means one row per month.
  if not exists (select 1 from pg_constraint where conname = 'monthly_checkins_month_is_first') then
    alter table public.monthly_checkins add constraint monthly_checkins_month_is_first
      check (check_in_month = date_trunc('month', check_in_month)::date);
  end if;
  -- An object, and small: a check-in is a few dozen short answers. The cap
  -- stops the table being used as free blob storage.
  if not exists (select 1 from pg_constraint where conname = 'monthly_checkins_answers_shape') then
    alter table public.monthly_checkins add constraint monthly_checkins_answers_shape
      check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) <= 16384);
  end if;
end $$;

-- One check-in per user per month: redoing this month's check-in upserts in
-- place (onConflict 'user_id,check_in_month') instead of adding a row. The
-- index also serves the "latest two months" lookup (user_id equality, then
-- check_in_month order), so no second index is needed.
create unique index if not exists monthly_checkins_user_month_key
  on public.monthly_checkins (user_id, check_in_month);

alter table public.monthly_checkins enable row level security;

-- GRANTs are separate from RLS (see README "Validate locally first"): RLS
-- decides which rows, GRANT decides whether the role may touch the table.
revoke all on public.monthly_checkins from anon;
grant select, insert, update, delete on public.monthly_checkins to authenticated;
grant all on public.monthly_checkins to service_role;

drop policy if exists "monthly_checkins_select_own" on public.monthly_checkins;
create policy "monthly_checkins_select_own"
on public.monthly_checkins
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
);

drop policy if exists "monthly_checkins_insert_own" on public.monthly_checkins;
-- Older name from the mobile branch's draft of this file.
drop policy if exists "monthly_checkins_upsert_own" on public.monthly_checkins;
create policy "monthly_checkins_insert_own"
on public.monthly_checkins
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
);

drop policy if exists "monthly_checkins_update_own" on public.monthly_checkins;
create policy "monthly_checkins_update_own"
on public.monthly_checkins
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
)
with check (
  (select auth.uid()) = user_id
  and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
);

-- Without a DELETE policy every delete is silently a 0-row no-op. Needed for
-- account erasure (see health_intakes.sql).
drop policy if exists "monthly_checkins_delete_own" on public.monthly_checkins;
create policy "monthly_checkins_delete_own"
on public.monthly_checkins
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
);
