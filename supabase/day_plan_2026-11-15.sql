-- Day plan sync (2026-11-15): her medications, doses, activities and check-ins on every device.
--
-- user_day_plan: one private row per account holding the plan as JSON
--   (src/health/planSync.js cleans and merges it; /api/day-plan reads and writes it
--   with her own session, so the owner-only RLS below applies).
-- What she entered from her prescriber. ayna never changes a dose. Never shared with brands
-- or analytics. Deleting the account cascades. Idempotent: safe to re-run. No data is dropped.

create table if not exists public.user_day_plan (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan jsonb not null default '{}'::jsonb check (jsonb_typeof(plan) = 'object' and pg_column_size(plan) < 1048576),
  source text not null default 'self_report' check (source = 'self_report'),
  updated_at timestamptz not null default now()
);

alter table public.user_day_plan enable row level security;
revoke all on public.user_day_plan from anon;
grant select, insert, update, delete on public.user_day_plan to authenticated;
grant all on public.user_day_plan to service_role;

drop policy if exists "user_day_plan_select_own" on public.user_day_plan;
create policy "user_day_plan_select_own" on public.user_day_plan for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "user_day_plan_insert_own" on public.user_day_plan;
create policy "user_day_plan_insert_own" on public.user_day_plan for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "user_day_plan_update_own" on public.user_day_plan;
create policy "user_day_plan_update_own" on public.user_day_plan for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "user_day_plan_delete_own" on public.user_day_plan;
create policy "user_day_plan_delete_own" on public.user_day_plan for delete to authenticated using ((select auth.uid()) = user_id);

comment on table public.user_day_plan is 'Her day plan: medications she entered, doses she marked, her activities and check-ins. Self-reports. Never shared with brands or analytics.';
