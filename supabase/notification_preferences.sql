-- Per-user notification + delivery preferences for "How Ayna reaches you"
-- (src/mobile/screens/profile/ProfileFlow.jsx's PreferencesScreen). One row
-- per user, same shape/conventions as phone_numbers.sql. Written through
-- api/notification-preferences.js with the service-role key (not a direct
-- client upsert like health_intakes) because delivery_channel = 'sms' needs
-- a server-side check against phone_numbers.is_verified before it's allowed
-- to stick — that check can't live in a client-writable table alone.

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notifications_enabled boolean not null default true,
  updates_enabled boolean not null default true,
  night_mode_enabled boolean not null default false,
  newsletter_enabled boolean not null default false,
  delivery_channel text not null default 'push' check (delivery_channel in ('push', 'sms', 'email')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all (see phone_numbers.sql).
grant select, insert, update, delete on public.notification_preferences to authenticated;
grant all on public.notification_preferences to service_role;

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
on public.notification_preferences
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "notification_preferences_upsert_own" on public.notification_preferences;
create policy "notification_preferences_upsert_own"
on public.notification_preferences
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own"
on public.notification_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "notification_preferences_delete_own" on public.notification_preferences;
create policy "notification_preferences_delete_own"
on public.notification_preferences
for delete
to authenticated
using (auth.uid() = user_id);

-- If a verified phone becomes unverified (number changed, re-verification
-- needed) after someone picked "Text message" as their delivery channel,
-- that channel silently goes dead — texts stop arriving with no signal why.
-- api/notification-preferences.js already refuses to SET delivery_channel to
-- 'sms' without a verified phone; this trigger is the other direction,
-- catching the moment a phone that was backing an 'sms' choice stops being
-- verified, wherever that happens (not just through that one API route).
create or replace function public.fallback_delivery_channel_on_unverify()
returns trigger
language plpgsql
as $$
begin
  if (new.is_verified = false and old.is_verified = true) then
    update public.notification_preferences
    set delivery_channel = 'push', updated_at = now()
    where user_id = new.user_id and delivery_channel = 'sms';
  end if;
  return new;
end;
$$;

drop trigger if exists phone_numbers_unverify_fallback on public.phone_numbers;
create trigger phone_numbers_unverify_fallback
after update on public.phone_numbers
for each row execute function public.fallback_delivery_channel_on_unverify();

-- Personalize-with-my-data (Preferences > AI & Personalization) and quiet
-- hours (Preferences > Channels & quiet hours) — added after this table was
-- already live, so these are separate `alter table ... add column if not
-- exists` statements rather than edits to the `create table` above (which
-- only applies on a fresh create; see supabase/README.md's note on why that
-- alone isn't enough once a table already exists in production).
alter table public.notification_preferences
  add column if not exists personalize_with_data_enabled boolean not null default true;

alter table public.notification_preferences
  add column if not exists quiet_hours_enabled boolean not null default false;

-- 'HH:MM' 24-hour local time, compared as plain strings by whatever future
-- sender respects it — no timezone stored here (same as every other local,
-- device-facing time-of-day setting; the alternative, storing a UTC instant,
-- would silently drift wrong every time the user crosses a timezone).
alter table public.notification_preferences
  add column if not exists quiet_hours_start text not null default '22:00';

alter table public.notification_preferences
  add column if not exists quiet_hours_end text not null default '07:00';

alter table public.notification_preferences
  drop constraint if exists notification_preferences_quiet_hours_start_check;
alter table public.notification_preferences
  add constraint notification_preferences_quiet_hours_start_check
  check (quiet_hours_start ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

alter table public.notification_preferences
  drop constraint if exists notification_preferences_quiet_hours_end_check;
alter table public.notification_preferences
  add constraint notification_preferences_quiet_hours_end_check
  check (quiet_hours_end ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

-- Text size (Preferences > Appearance) — index into the client's
-- TEXT_SIZE_STEPS array (src/mobile/hooks/useTextSize.js): 0 Small,
-- 1 Default, 2 Large, 3 Extra large. Synced here so it follows a signed-in
-- user across devices, same as theme would if that were account-scoped;
-- localStorage remains the source of truth while signed out.
alter table public.notification_preferences
  add column if not exists text_size_index smallint not null default 1;

alter table public.notification_preferences
  drop constraint if exists notification_preferences_text_size_index_check;
alter table public.notification_preferences
  add constraint notification_preferences_text_size_index_check
  check (text_size_index between 0 and 3);
