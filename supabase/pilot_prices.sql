-- Apply after pilot_orders.sql. Only the server-side service role may read/write.
create table if not exists public.pilot_product_prices (
  product_id text not null references public.product_catalog(id),
  variant_id text not null default '',
  variant_label text,
  amount integer not null check (amount between 50 and 50000),
  currency text not null default 'usd' check (currency = 'usd'),
  retailer_url text not null check (retailer_url ~ '^https://'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  primary key (product_id, variant_id)
);
-- Also upgrades an earlier single-product draft if it was applied separately.
alter table public.pilot_product_prices add column if not exists variant_id text not null default '';
alter table public.pilot_product_prices add column if not exists variant_label text;
alter table public.pilot_product_prices drop constraint if exists pilot_product_prices_pkey;
alter table public.pilot_product_prices add constraint pilot_product_prices_pkey primary key (product_id, variant_id);
alter table public.pilot_product_prices enable row level security;
revoke all on public.pilot_product_prices from public, anon, authenticated;
grant all on public.pilot_product_prices to service_role;
alter table public.pilot_orders add column if not exists retailer_url text;
alter table public.pilot_orders add column if not exists variant_id text;
alter table public.pilot_orders add column if not exists variant_label text;
alter table public.pilot_fulfillments add column if not exists retailer_order_number text;
