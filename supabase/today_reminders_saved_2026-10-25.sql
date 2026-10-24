-- Today reminders: add the 'saved' kind ("Something you saved is waiting").
-- "Remind me later" on a saved product. The row still holds only WHEN and
-- which kind of nudge; the product stays on her device.
-- Idempotent: replaces only the kind check constraint; no data is touched.
-- Run after supabase/today_reminders_2026-10-24.sql and
-- supabase/today_reminders_rundown_2026-10-25.sql.
alter table public.today_reminders drop constraint if exists today_reminders_kind_check;
alter table public.today_reminders
  add constraint today_reminders_kind_check check (kind in ('tonight', 'follow_up', 'rundown', 'saved'));
