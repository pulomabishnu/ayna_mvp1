-- Apply after pilot_orders.sql. Only the server-side service role may read/write.
create table if not exists public.pilot_product_prices (
  product_id text primary key references public.product_catalog(id),
  amount integer not null check (amount between 50 and 50000),
  currency text not null default 'usd' check (currency = 'usd'),
  retailer_url text not null check (retailer_url ~ '^https://'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.pilot_product_prices enable row level security;
revoke all on public.pilot_product_prices from public, anon, authenticated;
grant all on public.pilot_product_prices to service_role;
