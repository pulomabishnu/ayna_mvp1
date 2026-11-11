-- Energy and kind of pain in the daily log (founder, Nov 11: "add energy", "ask what kind of pain").
-- Low / Okay / Good, stored 1-3 like sleep and mood. Safe to run more than once.
-- Until this runs, /api/daily-log saves everything except energy (energy stays on her device).
alter table public.user_daily_log
  add column if not exists energy smallint check (energy is null or energy between 1 and 3);
alter table public.user_daily_log
  add column if not exists pain_where text check (pain_where is null or pain_where in ('cramps','back','head','pelvic','breast','other'));
