-- Anonymous match outcome samples for calibration (matching P1, Oct 29 2026).
--
-- When someone reports how a product in her routine went (Helped, No change,
-- Worse...), the app writes ONE anonymous row: the match band she saw, the
-- percent rounded down to 10s, the outcome and the engine version. No user
-- id, no product id, no need, no timestamp finer than the day: nothing that
-- can be tied back to her. Used by src/matching/calibration.js to check that
-- Strong matches help more often than Good ones, and Good more than Partial.
--
-- Anyone signed in (or a guest) may insert; nobody can read through the API.
-- The team reads it in the SQL editor:
--   select band, count(*) n,
--          round(avg((outcome = 'helpful')::int)::numeric, 2) helped_rate
--   from public.match_outcome_samples
--   where outcome <> 'unsure' group by band order by band;
--
-- Idempotent. Not applied automatically: run once in the Supabase SQL editor.

create table if not exists public.match_outcome_samples (
  id bigint generated always as identity primary key,
  band text not null check (band in ('strong', 'good', 'partial')),
  percent_bucket smallint not null check (percent_bucket between 0 and 90 and percent_bucket % 10 = 0),
  outcome text not null check (outcome in ('helpful', 'no_change', 'worse', 'side_effect', 'stopped')),
  engine text not null check (char_length(engine) <= 40),
  day date not null default current_date
);

alter table public.match_outcome_samples enable row level security;
drop policy if exists match_outcome_samples_insert on public.match_outcome_samples;
create policy match_outcome_samples_insert on public.match_outcome_samples
  for insert to anon, authenticated with check (true);
-- No select / update / delete policy: rows are write-only from the app.
revoke select, update, delete on public.match_outcome_samples from anon, authenticated;
grant insert on public.match_outcome_samples to anon, authenticated;
