-- Today reminders: add the 'rundown' kind ("Your daily rundown is ready.").
-- Idempotent: replaces only the kind check constraint; no data is touched.
-- Run after supabase/today_reminders_2026-10-24.sql.
alter table public.today_reminders drop constraint if exists today_reminders_kind_check;
alter table public.today_reminders
  add constraint today_reminders_kind_check check (kind in ('tonight', 'follow_up', 'rundown'));
