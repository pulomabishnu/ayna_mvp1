-- One analytics id per account, shared by every device (web + app).
-- PostHog's distinct_id = analytics_id. PostHog never gets the Supabase id or
-- email; the team matches accounts to PostHog by joining this table in Supabase.
-- Each account can read and create only its own row; nobody can change it.
-- Idempotent and additive.
create table if not exists public.account_analytics (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  analytics_id text not null unique check (analytics_id ~ '^ayna_[A-Za-z0-9_-]{8,80}$'),
  created_at timestamptz not null default now()
);
alter table public.account_analytics enable row level security;

drop policy if exists account_analytics_select_own on public.account_analytics;
create policy account_analytics_select_own on public.account_analytics
  for select to authenticated using (user_id = auth.uid());

drop policy if exists account_analytics_insert_own on public.account_analytics;
create policy account_analytics_insert_own on public.account_analytics
  for insert to authenticated with check (user_id = auth.uid());

revoke all on public.account_analytics from anon;
grant select, insert on public.account_analytics to authenticated;
