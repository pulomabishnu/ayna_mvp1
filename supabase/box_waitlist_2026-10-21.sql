-- box_waitlist_2026-10-21.sql
-- "Monthly box" waitlist (api/box-waitlist.js). NOT auto-run: a founder pastes
-- this into the Supabase SQL Editor. Idempotent, deletes nothing.
-- Only the server (service role) reads or writes it; the browser never does.

create table if not exists public.box_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 6 and 254),
  wants text check (wants is null or char_length(wants) <= 300),
  source text check (source is null or source in ('you', 'app-you', 'shop', 'app-shop')),
  platform text not null default 'web' check (platform in ('web', 'app')),
  created_at timestamptz not null default now()
);

alter table public.box_waitlist enable row level security;
revoke all on public.box_waitlist from public, anon, authenticated;
grant all on public.box_waitlist to service_role;
-- Deliberately no policies: only api/box-waitlist.js (service role) touches it.

-- Check after running:
--   select count(*) from public.box_waitlist;
