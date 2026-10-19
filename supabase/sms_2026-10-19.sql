-- Per-feature text message opt-ins + a minimal consent/audit log.
--
-- Additive and idempotent: safe to re-run. Does not alter or drop anything in
-- phone_numbers, pending_phone_verifications or sms_conversations; the phone
-- number, its verification and the carrier STOP state stay in phone_numbers.
--
-- Read by: api/_smsStore.js, api/sms.js, api/sms-webhook.js, api/sms-reminders.js.
-- Every write goes through the service role; she can only read her own rows.

-- ── sms_preferences ─────────────────────────────────────────────────────────
-- One row per person. Every feature defaults OFF and is an explicit opt-in.
-- A person with a verified phone_numbers row but NO row here verified on the
-- website before these settings existed (see api/_smsStore.js, LEGACY).
create table if not exists public.sms_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reminders boolean not null default false,
  orders boolean not null default false,
  chat boolean not null default false,
  health_details boolean not null default false,
  stopped_at timestamptz,
  consent_text_version text,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sms_preferences_reminders_idx
on public.sms_preferences (user_id)
where reminders = true and stopped_at is null;

alter table public.sms_preferences enable row level security;

grant select on public.sms_preferences to authenticated;
grant all on public.sms_preferences to service_role;

drop policy if exists "sms_preferences_select_own" on public.sms_preferences;
create policy "sms_preferences_select_own"
on public.sms_preferences for select
to authenticated using ((select auth.uid()) = user_id);

-- ── sms_events ──────────────────────────────────────────────────────────────
-- Consent and send log. NEVER holds a message body or a phone number.
-- kind: phone_verified | prefs_saved | phone_removed | stop | start |
--       chat_reply | chat_off_notice | chat_limit_notice | reminder | order_<status>
-- detail: booleans / a type label only (e.g. {"type":"checkin"}), no health values.
create table if not exists public.sms_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sms_events_user_kind_created_idx
on public.sms_events (user_id, kind, created_at desc);

alter table public.sms_events enable row level security;

grant select on public.sms_events to authenticated;
grant all on public.sms_events to service_role;

drop policy if exists "sms_events_select_own" on public.sms_events;
create policy "sms_events_select_own"
on public.sms_events for select
to authenticated using ((select auth.uid()) = user_id);
