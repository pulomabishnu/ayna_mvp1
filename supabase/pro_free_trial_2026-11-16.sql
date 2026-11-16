-- Nov 16 (founder): a 1-week free ayna Pro trial, no card, that she opts into. One per account, ever.
-- Access itself uses pro_focus_grants (expires_at = now + 7 days); this table only remembers the trial was used.
-- Idempotent; drops nothing.
create table if not exists public.pro_trials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  started_at timestamptz not null default now()
);
alter table public.pro_trials enable row level security;
revoke all on public.pro_trials from public, anon, authenticated;
grant all on public.pro_trials to service_role;
