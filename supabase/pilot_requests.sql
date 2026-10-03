-- Test-mode requests for physical products that have no confirmed checkout price.
-- Apply after pilot_prices.sql. No payment or fulfillment is created here.
create table if not exists public.pilot_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  product_id text not null references public.product_catalog(id),
  product_name text not null,
  variant_id text not null default '',
  variant_label text,
  customer_email text,
  status text not null default 'requested' check (status in ('requested','quoted')),
  created_at timestamptz not null default now(),
  quoted_at timestamptz,
  unique (user_id, product_id, variant_id)
);
create index if not exists pilot_requests_created on public.pilot_requests(created_at desc);
alter table public.pilot_requests enable row level security;
revoke all on public.pilot_requests from public, anon, authenticated;
grant select on public.pilot_requests to authenticated;
grant all on public.pilot_requests to service_role;
drop policy if exists pilot_read_own_requests on public.pilot_requests;
create policy pilot_read_own_requests on public.pilot_requests for select to authenticated using (user_id = (select auth.uid()));
