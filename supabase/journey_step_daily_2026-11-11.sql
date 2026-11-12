-- SUPERSEDED: run supabase/journey_step_daily_ctas_2026-11-11.sql instead (same table, adds the landing buttons).
-- Anonymous journey step counter: how many times each step of the site or
-- app was reached per day, per platform. Written for api/step.js.
-- Same design as the Buy counter (supabase/buy_click_daily_2026-11-10.sql).
-- Idempotent: safe to re-run. Creates one new table and one new function;
-- touches no existing table.
-- NOT applied automatically; a founder runs it once in the Supabase SQL editor.
--
-- What is stored: day (UTC), step, platform, count. Nothing about the person:
-- no IP address, user agent, cookie, account or analytics id. Visitors who
-- chose Keep off, opted out in their account or app, or send Global Privacy
-- Control are never counted.
--
-- Steps:
--   landed                first page load of a visit (website) / app opened from closed (app)
--   sign_up_free_clicked  the "Sign up free" button
--   quiz_started          first quiz question on screen
--   quiz_completed        quiz finished
--   health_connected      a health app or wearable connected (Oura, WHOOP, Apple Health, Health Connect)
--   account_created       a new ayna account
-- Platforms: web, ios_app, android_app.
--
-- Reading the numbers (SQL editor / service role only):
--   select day, step, platform, count from public.journey_step_daily
--   order by day desc, platform,
--     array_position(array['landed','sign_up_free_clicked','quiz_started',
--       'quiz_completed','health_connected','account_created'], step);

create table if not exists public.journey_step_daily (
  day date not null default ((now() at time zone 'utc')::date),
  step text not null check (step in ('landed', 'sign_up_free_clicked', 'quiz_started', 'quiz_completed', 'health_connected', 'account_created')),
  platform text not null check (platform in ('web', 'ios_app', 'android_app')),
  count integer not null default 0 check (count >= 0),
  primary key (day, step, platform)
);

alter table public.journey_step_daily enable row level security;
-- No policies: only the service role (api/step.js) reads or writes.
revoke all on public.journey_step_daily from anon, authenticated;
grant all on public.journey_step_daily to service_role;

-- +1 for today. Unknown steps or platforms are ignored, so made-up values add no rows.
create or replace function public.record_journey_step(p_step text, p_platform text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.journey_step_daily (day, step, platform, count)
  select (now() at time zone 'utc')::date, p_step, p_platform, 1
  where p_step in ('landed', 'sign_up_free_clicked', 'quiz_started', 'quiz_completed', 'health_connected', 'account_created')
    and p_platform in ('web', 'ios_app', 'android_app')
  on conflict (day, step, platform) do update set count = public.journey_step_daily.count + 1
$$;

revoke all on function public.record_journey_step(text, text) from public, anon, authenticated;
grant execute on function public.record_journey_step(text, text) to service_role;
