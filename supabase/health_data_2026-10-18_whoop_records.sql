-- Run once on databases that already ran health_data.sql before Oct 18, 2026.
-- (health_data.sql itself now includes this, so a fresh run needs nothing else.)
-- Lets WHOOP connections and tokens exist, and logs Apple Health Records
-- consent (records_saved / records_deleted; the records stay on her phone).
-- WHOOP data itself is never stored:
-- health_daily_metrics still does not accept source 'whoop'.
alter table public.health_connections drop constraint if exists health_connections_source_check;
alter table public.health_connections add constraint health_connections_source_check
  check (source in ('apple_health','health_connect','oura','whoop','strava','garmin','manual_import'));
alter table public.health_oauth_tokens drop constraint if exists health_oauth_tokens_provider_check;
alter table public.health_oauth_tokens add constraint health_oauth_tokens_provider_check
  check (provider in ('oura','whoop','strava','garmin'));
alter table public.health_oauth_states drop constraint if exists health_oauth_states_nonce_check;
alter table public.health_oauth_states add constraint health_oauth_states_nonce_check
  check (char_length(nonce) between 8 and 100);
alter table public.health_data_events drop constraint if exists health_data_events_action_check;
alter table public.health_data_events add constraint health_data_events_action_check
  check (action in ('consent_granted','consent_updated','consent_withdrawn','sync_paused','sync_resumed','disconnected','data_deleted','all_data_deleted','import_confirmed','import_discarded','records_saved','records_deleted'));
