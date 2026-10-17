-- Email settings (Oct 16): which notification emails each person wants.
-- One row per account, readable and writable only by that account (RLS).
-- No emails are sent from this table yet; the sending job will read it.
-- Idempotent: safe to run more than once. Additive only.
create table if not exists public.email_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb check (jsonb_typeof(prefs) = 'object'),
  unsubscribed_all boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.email_preferences enable row level security;

drop policy if exists email_preferences_select_own on public.email_preferences;
create policy email_preferences_select_own on public.email_preferences
  for select to authenticated using (user_id = auth.uid());

drop policy if exists email_preferences_insert_own on public.email_preferences;
create policy email_preferences_insert_own on public.email_preferences
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists email_preferences_update_own on public.email_preferences;
create policy email_preferences_update_own on public.email_preferences
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on public.email_preferences to authenticated;
