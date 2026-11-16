-- Hair and a short note in the daily log (founder, Nov 16). Safe to run more than once; drops nothing.
-- Until this runs, /api/daily-log saves everything except hair and note (they stay on her device).
alter table public.user_daily_log
  add column if not exists hair smallint check (hair is null or hair between 1 and 3);
alter table public.user_daily_log
  add column if not exists note text check (note is null or char_length(note) <= 280);
