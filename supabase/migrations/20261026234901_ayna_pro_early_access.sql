-- One-time prepaid Pro: immediate access; the paid term begins at launch.
-- Launch defaults to Jan 1, 2027 at midnight Eastern; confirm before opening sales.
begin;
create table if not exists public.pro_launch (
  id boolean primary key default true check (id),
  launch_at timestamptz
);
insert into public.pro_launch (id, launch_at) values (true, '2027-01-01T05:00:00Z') on conflict do nothing;

create table if not exists public.pro_purchases (
  session_id text primary key,
  payment_intent_id text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('month', 'year')),
  paid_at timestamptz not null,
  price_id text not null,
  subscription_id text,
  term_starts_at timestamptz,
  term_ends_at timestamptz,
  livemode boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists pro_purchases_user_idx on public.pro_purchases(user_id);
create table if not exists public.pro_payment_revocations (
  payment_intent_id text primary key,
  reason text not null check (reason in ('refund', 'dispute')),
  revoked_at timestamptz not null
);

create table if not exists public.pro_subscriptions (
  subscription_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id text not null,
  plan text not null check (plan in ('month', 'year')),
  status text not null,
  cancel_at_period_end boolean not null default false
);
create index if not exists pro_subscriptions_user_idx on public.pro_subscriptions(user_id);
create table if not exists public.pro_focus_grants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  expires_at timestamptz not null
);
alter table public.pro_subscriptions enable row level security;
alter table public.pro_focus_grants enable row level security;
revoke all on public.pro_subscriptions, public.pro_focus_grants from public, anon, authenticated;
grant all on public.pro_subscriptions, public.pro_focus_grants to service_role;
grant select on public.pro_subscriptions, public.pro_focus_grants to authenticated;
drop policy if exists pro_subscriptions_read_own on public.pro_subscriptions;
create policy pro_subscriptions_read_own on public.pro_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists pro_focus_grants_read_own on public.pro_focus_grants;
create policy pro_focus_grants_read_own on public.pro_focus_grants for select to authenticated using ((select auth.uid()) = user_id);

alter table public.pro_launch enable row level security;
alter table public.pro_purchases enable row level security;
alter table public.pro_payment_revocations enable row level security;
revoke all on public.pro_launch, public.pro_purchases, public.pro_payment_revocations from public, anon, authenticated;
grant select on public.pro_purchases to authenticated;
drop policy if exists pro_purchases_read_own on public.pro_purchases;
create policy pro_purchases_read_own on public.pro_purchases for select to authenticated
  using ((select auth.uid()) = user_id);
grant all on public.pro_launch, public.pro_purchases, public.pro_payment_revocations to service_role;

create or replace function public.pro_access_status(p_user_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with terms as (
    select p.plan, p.paid_at,
      coalesce(p.term_starts_at, greatest(p.paid_at, l.launch_at)) as starts_at,
      coalesce(p.term_ends_at, case when l.launch_at is null then null else
        ((greatest(p.paid_at, l.launch_at) at time zone 'UTC') +
          case when p.plan = 'year' then interval '1 year' else interval '1 month' end) at time zone 'UTC'
      end) as ends_at
    from public.pro_purchases p cross join public.pro_launch l
    where p.user_id = p_user_id
      and not exists (select 1 from public.pro_payment_revocations r where r.payment_intent_id = p.payment_intent_id)
  ), best as (
    select * from terms order by ends_at desc nulls first limit 1
  )
  select jsonb_build_object(
    'active', coalesce((select ends_at is null or ends_at > now() from best), false)
      or exists (select 1 from public.pro_focus_grants f where f.user_id = p_user_id and f.expires_at > now()),
    'hasPurchase', exists (select 1 from terms where ends_at is null or ends_at > now()),
    'temporaryUntil', (select expires_at from public.pro_focus_grants where user_id = p_user_id and expires_at > now()),
    'autoRenew', exists (select 1 from public.pro_subscriptions s where s.user_id = p_user_id and not s.cancel_at_period_end and s.status in ('trialing','active','past_due')),
    'plan', (select plan from best),
    'launchAt', (select launch_at from public.pro_launch where id),
    'termStartsAt', case when (select launch_at from public.pro_launch where id) is null then null else (select starts_at from best) end,
    'termEndsAt', (select ends_at from best)
  );
$$;
revoke all on function public.pro_access_status(uuid) from public, anon, authenticated;
grant execute on function public.pro_access_status(uuid) to service_role;
commit;
