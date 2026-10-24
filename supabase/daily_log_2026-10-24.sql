-- Daily log and tries (2026-10-24).
--
-- user_daily_log: one row per user per day from the daily log card
--   (src/health/dailyLog.js). Pain, flow, PMS, sleep, mood, skin. A null
--   column means "not logged", never "none" (pain 0 is "None").
-- user_tries: one row per thing she tries (a product or an action) and what
--   she reported (src/health/outcomes.js). Status (pending / due / recorded)
--   is derived at read time and not stored.
--
-- Why new tables and not health_daily_metrics: those rows are numeric
-- device summaries written only by the service role after consent checks.
-- These are her own reports, written by her through /api/daily-log with her
-- own session (RLS applies), so the owner-only pattern of monthly_checkins
-- fits better. Provenance is fixed: source 'self_report', method 'manual'.
--
-- Health data: never shared with brands or analytics. Owners can read,
-- write and delete only their own rows. Deleting the account cascades.
-- Idempotent: safe to re-run. No data is dropped.

create table if not exists public.user_daily_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  pain smallint check (pain is null or pain between 0 and 3),
  flow text check (flow is null or flow in ('none','spotting','light','medium','heavy')),
  pms smallint check (pms is null or pms between 0 and 3),
  sleep smallint check (sleep is null or sleep between 1 and 3),
  mood smallint check (mood is null or mood between 1 and 3),
  skin smallint check (skin is null or skin between 1 and 3),
  -- When each field was last set on her device, so two devices merge per field.
  field_at jsonb not null default '{}'::jsonb check (jsonb_typeof(field_at) = 'object'),
  source text not null default 'self_report' check (source = 'self_report'),
  method text not null default 'manual' check (method = 'manual'),
  -- When she last changed this day (her device's clock), used for merging.
  updated_at timestamptz not null,
  synced_at timestamptz not null default now(),
  constraint user_daily_log_user_day_key unique (user_id, day)
);
create index if not exists user_daily_log_user_day_idx on public.user_daily_log (user_id, day desc);

create table if not exists public.user_tries (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (id ~ '^[A-Za-z0-9:_.-]{1,120}$'),
  kind text not null check (kind in ('product','action')),
  ref text not null check (char_length(ref) between 1 and 200),
  need text check (need is null or char_length(need) <= 120),
  intervention_kind text check (intervention_kind is null or intervention_kind ~ '^[a-z_]{1,40}$'),
  started_day date not null,
  horizon_days integer not null check (horizon_days between 1 and 365),
  outcome text check (outcome is null or outcome in ('helpful','no_change','worse','side_effect','unsure','stopped')),
  recorded_day date,
  note text check (note is null or char_length(note) <= 280),
  removed boolean not null default false,
  source text not null default 'self_report' check (source = 'self_report'),
  method text not null default 'manual' check (method = 'manual'),
  updated_at timestamptz not null,
  synced_at timestamptz not null default now(),
  constraint user_tries_user_id_key unique (user_id, id)
);
create index if not exists user_tries_user_started_idx on public.user_tries (user_id, started_day desc);

alter table public.user_daily_log enable row level security;
alter table public.user_tries enable row level security;

revoke all on public.user_daily_log, public.user_tries from anon;
grant select, insert, update, delete on public.user_daily_log, public.user_tries to authenticated;
grant all on public.user_daily_log, public.user_tries to service_role;

drop policy if exists "user_daily_log_select_own" on public.user_daily_log;
create policy "user_daily_log_select_own" on public.user_daily_log for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "user_daily_log_insert_own" on public.user_daily_log;
create policy "user_daily_log_insert_own" on public.user_daily_log for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "user_daily_log_update_own" on public.user_daily_log;
create policy "user_daily_log_update_own" on public.user_daily_log for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "user_daily_log_delete_own" on public.user_daily_log;
create policy "user_daily_log_delete_own" on public.user_daily_log for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "user_tries_select_own" on public.user_tries;
create policy "user_tries_select_own" on public.user_tries for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "user_tries_insert_own" on public.user_tries;
create policy "user_tries_insert_own" on public.user_tries for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "user_tries_update_own" on public.user_tries;
create policy "user_tries_update_own" on public.user_tries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "user_tries_delete_own" on public.user_tries;
create policy "user_tries_delete_own" on public.user_tries for delete to authenticated using ((select auth.uid()) = user_id);

comment on table public.user_daily_log is 'Her daily self-reports (pain, flow, PMS, sleep, mood, skin). source self_report, method manual. Null means not logged. Never shared with brands or analytics.';
comment on table public.user_tries is 'Products and actions she tried and what she reported. Status is derived from started_day + horizon_days. Self-reports, not proof of effect.';
