-- Run once in the Supabase SQL editor (safe to re-run).
-- Adds "Let Ask ayna use my cycle and sleep data" (src/health/askHealthPref.js,
-- api/notification-preferences.js). Opt-in: default false. Until this runs,
-- the switch still works on each device (localStorage) and reads as off from
-- the account. notification_preferences already has owner-only RLS.
alter table public.notification_preferences
  add column if not exists ask_health_data_enabled boolean not null default false;
