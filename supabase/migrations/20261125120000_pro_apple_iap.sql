-- ayna Pro bought in the iPhone app with Apple in-app purchase (App Review 3.1.1, Nov 25 2026).
-- One row per Apple subscription (original transaction). Written only by the server after it
-- verifies Apple's signed transaction (api/_appleJws.js): from the app right after a purchase or
-- restore, and from App Store Server Notifications for renewals, expiry and refunds.
create table if not exists public.pro_apple_subscriptions (
  original_transaction_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null,
  plan text not null check (plan in ('month', 'year')),
  last_transaction_id text not null,
  purchased_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  auto_renew boolean not null default true,
  environment text not null check (environment in ('Production', 'Sandbox', 'Xcode', 'LocalTesting')),
  updated_at timestamptz not null default now()
);
create index if not exists pro_apple_subscriptions_user_idx on public.pro_apple_subscriptions (user_id);

alter table public.pro_apple_subscriptions enable row level security;
revoke all on public.pro_apple_subscriptions from public, anon, authenticated;
grant all on public.pro_apple_subscriptions to service_role;
grant select on public.pro_apple_subscriptions to authenticated;
drop policy if exists pro_apple_subscriptions_read_own on public.pro_apple_subscriptions;
create policy pro_apple_subscriptions_read_own on public.pro_apple_subscriptions for select to authenticated using ((select auth.uid()) = user_id);

-- Same as before, plus: an Apple subscription that hasn't expired or been refunded makes her Pro.
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
  ), apple as (
    select a.plan, a.expires_at, a.auto_renew from public.pro_apple_subscriptions a
    where a.user_id = p_user_id and a.revoked_at is null and a.expires_at > now()
    order by a.expires_at desc limit 1
  )
  select jsonb_build_object(
    'active', coalesce((select ends_at is null or ends_at > now() from best), false)
      or exists (select 1 from public.pro_focus_grants f where f.user_id = p_user_id and f.expires_at > now())
      or exists (select 1 from apple),
    'hasPurchase', exists (select 1 from terms where ends_at is null or ends_at > now()) or exists (select 1 from apple),
    'temporaryUntil', (select expires_at from public.pro_focus_grants where user_id = p_user_id and expires_at > now()),
    'autoRenew', exists (select 1 from public.pro_subscriptions s where s.user_id = p_user_id and not s.cancel_at_period_end and s.status in ('trialing','active','past_due'))
      or coalesce((select auto_renew from apple), false),
    'plan', coalesce((select plan from best), (select plan from apple)),
    'launchAt', (select launch_at from public.pro_launch where id),
    'termStartsAt', case when (select launch_at from public.pro_launch where id) is null then null else (select starts_at from best) end,
    'termEndsAt', (select ends_at from best),
    'appleExpiresAt', (select expires_at from apple),
    'appleAutoRenew', (select auto_renew from apple)
  );
$$;
