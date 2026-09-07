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
