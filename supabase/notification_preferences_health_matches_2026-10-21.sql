-- Run once in the Supabase SQL editor (safe to re-run).
-- Adds the "Use my health data in my matches" switch (src/health/matchPref.js,
-- api/notification-preferences.js). Until this runs, the switch shows as on
-- and turning it off says it could not be saved.
alter table public.notification_preferences
  add column if not exists health_data_in_matches_enabled boolean not null default true;
