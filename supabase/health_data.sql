-- Connected health data: wearables, phone health stores, manual uploads.
--
-- Design rules (docs/wearables-ehr-integration.md):
--   * Daily summaries only. No second-by-second samples are stored.
--   * Clients can READ their own rows. Every WRITE goes through the API with
--     the service role, so consent and validation are checked server-side and
--     cannot be skipped by a modified client.
--   * Owners can always DELETE their own metric rows directly, so erasure
--     works even if the API is down.
--   * OAuth tokens are server-only, AES-256-GCM encrypted, never readable by
--     anon/authenticated.
--   * Insights and match signals are computed from these rows at read time and
--     never stored, so deleting rows deletes everything derived from them.
--
-- Separate from user_health_profiles (imported conditions/medications/allergies
-- and the older wearable text summary) and health_intakes (the quiz).
-- Idempotent: safe to re-run.

-- ── Connections: one row per user per source ───────────────────────────────
create table if not exists public.health_connections (
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('apple_health','health_connect','oura','whoop','strava','garmin','manual_import')),
  status text not null default 'connected' check (status in ('connected','paused','needs_reauth','error','disconnected')),
  sync_enabled boolean not null default true,
  -- Consent is per category; only these categories are accepted from this source.
  categories text[] not null default '{}'::text[] check (categories <@ array['sleep','cycle','temperature','heart','activity','recovery']::text[]),
  platform text check (platform is null or platform in ('ios','android','web')),
  -- Preferred source per category when two devices measure the same thing.
  preferred_for text[] not null default '{}'::text[],
  last_synced_at timestamptz,
  -- A short code only (e.g. 'token_expired'), never a provider message or a value.
  last_error_code text check (last_error_code is null or last_error_code ~ '^[a-z_]{1,40}$'),
  notice_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, source)
);

-- ── Consent and deletion log: append-only, no health values ────────────────
create table if not exists public.health_data_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  action text not null check (action in ('consent_granted','consent_updated','consent_withdrawn','sync_paused','sync_resumed','disconnected','data_deleted','all_data_deleted','import_confirmed','import_discarded','records_saved','records_deleted')),
  categories text[] not null default '{}'::text[],
  notice_version text,
  platform text,
  rows_affected integer,
  created_at timestamptz not null default now()
);
create index if not exists health_data_events_user_idx on public.health_data_events (user_id, created_at desc);

-- ── Normalized daily metrics ──────────────────────────────────────────────
create table if not exists public.health_daily_metrics (
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('apple_health','health_connect','oura','strava','garmin','manual_import')),
  -- Who actually measured it ('oura' for an Oura night that came through Apple Health).
  origin text not null check (origin ~ '^[a-z0-9_.-]{1,60}$'),
  metric text not null check (metric ~ '^[a-z_]{1,40}$'),
  day date not null,
  value numeric not null,
  unit text not null,
  method text not null default 'observed' check (method in ('observed','derived','user_entered')),
  import_id uuid,
  notice_version text,
  synced_at timestamptz not null default now(),
  primary key (user_id, source, origin, metric, day)
);
create index if not exists health_daily_metrics_user_day_idx on public.health_daily_metrics (user_id, day desc);

-- ── Manual uploads: the record of an upload, never the file ────────────────
create table if not exists public.health_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  declared_app text check (declared_app is null or char_length(declared_app) <= 60),
  file_kind text not null check (file_kind in ('image','csv','json','txt','pdf','manual')),
  status text not null default 'confirmed' check (status in ('confirmed','discarded')),
  rows_saved integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── "Request another app or wearable" ─────────────────────────────────────
create table if not exists public.health_source_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_name text not null check (char_length(btrim(source_name)) between 1 and 60),
  note text check (note is null or char_length(note) <= 280),
  created_at timestamptz not null default now()
);

-- ── Server-only: encrypted OAuth tokens and one-time OAuth states ─────────
create table if not exists public.health_oauth_tokens (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('oura','whoop','strava','garmin')),
  encrypted_access_token text not null,
  encrypted_refresh_token text,
  encryption_iv text not null,
  encryption_tag text not null,
  refresh_iv text,
  refresh_tag text,
  scopes text[] not null default '{}'::text[],
  expires_at timestamptz,
  provider_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

create table if not exists public.health_oauth_states (
  nonce text primary key check (char_length(nonce) between 8 and 100),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  categories text[] not null default '{}'::text[],
  return_to text not null default 'web' check (return_to in ('web','app')),
  -- Same-site path to send her back to on the website; never a full URL (open-redirect guard).
  return_path text not null default '/' check (return_path ~ '^/[A-Za-z0-9/_.=&?-]{0,200}$' and return_path !~ '^//'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.health_oauth_states add column if not exists return_path text not null default '/';

-- WHOOP (2026-10-18): a connection and token row, never metric rows (WHOOP's
-- terms forbid storing its data; health_daily_metrics deliberately excludes it).
-- WHOOP also requires an 8-character OAuth state. Re-asserted here so an older
-- copy of these tables is upgraded in place.
alter table public.health_connections drop constraint if exists health_connections_source_check;
alter table public.health_connections add constraint health_connections_source_check
  check (source in ('apple_health','health_connect','oura','whoop','strava','garmin','manual_import'));
alter table public.health_oauth_tokens drop constraint if exists health_oauth_tokens_provider_check;
alter table public.health_oauth_tokens add constraint health_oauth_tokens_provider_check
  check (provider in ('oura','whoop','strava','garmin'));
alter table public.health_oauth_states drop constraint if exists health_oauth_states_nonce_check;
alter table public.health_oauth_states add constraint health_oauth_states_nonce_check
  check (char_length(nonce) between 8 and 100);
-- Apple Health Records (2026-10-18): the records themselves stay on her phone;
-- only the fact that she saved or deleted them (types and a count) is logged.
alter table public.health_data_events drop constraint if exists health_data_events_action_check;
alter table public.health_data_events add constraint health_data_events_action_check
  check (action in ('consent_granted','consent_updated','consent_withdrawn','sync_paused','sync_resumed','disconnected','data_deleted','all_data_deleted','import_confirmed','import_discarded','records_saved','records_deleted'));

-- ── Row level security ────────────────────────────────────────────────────
alter table public.health_connections enable row level security;
alter table public.health_data_events enable row level security;
alter table public.health_daily_metrics enable row level security;
alter table public.health_imports enable row level security;
alter table public.health_source_requests enable row level security;
alter table public.health_oauth_tokens enable row level security;
alter table public.health_oauth_states enable row level security;

revoke all on public.health_connections, public.health_data_events, public.health_daily_metrics,
  public.health_imports, public.health_source_requests, public.health_oauth_tokens, public.health_oauth_states from anon;
revoke all on public.health_oauth_tokens, public.health_oauth_states from authenticated;
-- Clients read; the API (service role) writes.
revoke insert, update, delete on public.health_connections, public.health_data_events, public.health_imports from authenticated;
grant select on public.health_connections, public.health_data_events, public.health_imports to authenticated;
grant select, delete on public.health_daily_metrics to authenticated;
revoke insert, update on public.health_daily_metrics from authenticated;
grant select, insert on public.health_source_requests to authenticated;
grant all on public.health_connections, public.health_data_events, public.health_daily_metrics, public.health_imports,
  public.health_source_requests, public.health_oauth_tokens, public.health_oauth_states to service_role;

drop policy if exists "health_connections_select_own" on public.health_connections;
create policy "health_connections_select_own" on public.health_connections for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "health_data_events_select_own" on public.health_data_events;
create policy "health_data_events_select_own" on public.health_data_events for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "health_daily_metrics_select_own" on public.health_daily_metrics;
create policy "health_daily_metrics_select_own" on public.health_daily_metrics for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "health_daily_metrics_delete_own" on public.health_daily_metrics;
create policy "health_daily_metrics_delete_own" on public.health_daily_metrics for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "health_imports_select_own" on public.health_imports;
create policy "health_imports_select_own" on public.health_imports for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "health_source_requests_select_own" on public.health_source_requests;
create policy "health_source_requests_select_own" on public.health_source_requests for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "health_source_requests_insert_own" on public.health_source_requests;
create policy "health_source_requests_insert_own" on public.health_source_requests for insert to authenticated with check ((select auth.uid()) = user_id);

-- health_oauth_tokens / health_oauth_states: RLS on, no policies. Service role only.

-- ── Housekeeping ──────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists health_connections_touch on public.health_connections;
create trigger health_connections_touch before update on public.health_connections
for each row execute function public.touch_updated_at();

drop trigger if exists health_oauth_tokens_touch on public.health_oauth_tokens;
create trigger health_oauth_tokens_touch before update on public.health_oauth_tokens
for each row execute function public.touch_updated_at();

-- Expired OAuth states are useless; schedule with pg_cron:
--   select cron.schedule('purge-health-oauth-states', '*/30 * * * *', $$select public.purge_expired_health_oauth_states()$$);
create or replace function public.purge_expired_health_oauth_states()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from public.health_oauth_states where expires_at < now();
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.purge_expired_health_oauth_states() from public, anon, authenticated;
grant execute on function public.purge_expired_health_oauth_states() to service_role;

comment on table public.health_daily_metrics is 'Normalized daily health summaries from connected sources. Never shared with brands or analytics. Insights are derived at read time, not stored.';
comment on table public.health_oauth_tokens is 'Server-only encrypted OAuth tokens for health data providers.';
