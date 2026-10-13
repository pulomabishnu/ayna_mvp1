-- Invite links and the "Brought 3 friends" badge.
-- Written for src/utils/badges.js. Idempotent: safe to re-run.
-- NOT applied automatically; run it once in the Supabase SQL editor.
--
-- How it works
--   * Every account has a personal invite code: the first 10 hex characters of
--     its user id (public.ayna_referral_code). The link is https://<site>/?ref=<code>.
--   * When someone opens that link and then creates a NEW account, the client
--     stores the code in user_metadata.referred_by and inserts one row here.
--   * public.my_referral_stats() returns, for the signed-in user's code, how
--     many people joined (joined) and how many of those posted at least once
--     in Community (qualified). The badge needs qualified >= 3.
--   * No one can read anybody else's referral rows; the stats function only
--     returns counts for the caller's own code.

create or replace function public.ayna_referral_code(uid uuid)
returns text
language sql
immutable
as $$
  select substr(replace(uid::text, '-', ''), 1, 10)
$$;

-- auth.users is not readable by the authenticated role, so the "fresh
-- account" check runs as a security definer helper.
create or replace function public.ayna_account_is_new()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users u where u.id = auth.uid() and u.created_at > now() - interval '7 days'
  )
$$;
revoke all on function public.ayna_account_is_new() from public, anon;
grant execute on function public.ayna_account_is_new() to authenticated;

create table if not exists public.referrals (
  referred_user_id uuid primary key references auth.users (id) on delete cascade,
  referrer_code text not null check (referrer_code ~ '^[a-z0-9]{6,20}$'),
  created_at timestamptz not null default now()
);

create index if not exists referrals_referrer_code_idx on public.referrals (referrer_code);

alter table public.referrals enable row level security;

revoke all on public.referrals from anon, authenticated;
grant select, insert on public.referrals to authenticated;

drop policy if exists referrals_insert_self on public.referrals;
create policy referrals_insert_self on public.referrals
  for insert to authenticated
  with check (
    referred_user_id = auth.uid()
    -- never your own code
    and referrer_code <> public.ayna_referral_code(auth.uid())
    -- only a fresh account can be attributed (created in the last 7 days)
    and public.ayna_account_is_new()
  );

drop policy if exists referrals_select_self on public.referrals;
create policy referrals_select_self on public.referrals
  for select to authenticated
  using (referred_user_id = auth.uid());

-- Counts for the caller's own invite code. security definer so it can count
-- rows that belong to other users without exposing them.
create or replace function public.my_referral_stats()
returns table (joined integer, qualified integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*)::integer as joined,
    count(*) filter (
      where exists (select 1 from public.community_posts p where p.author_id = r.referred_user_id)
    )::integer as qualified
  from public.referrals r
  where auth.uid() is not null
    and r.referrer_code = public.ayna_referral_code(auth.uid())
$$;

revoke all on function public.my_referral_stats() from public, anon;
grant execute on function public.my_referral_stats() to authenticated;
