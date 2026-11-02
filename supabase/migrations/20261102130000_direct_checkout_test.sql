-- Apply only to the Ayna storefront Supabase project after product_catalog is seeded.
create table if not exists public.checkout_suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  order_email text not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.product_catalog
  add column if not exists checkout_supplier_id uuid references public.checkout_suppliers(id),
  add column if not exists checkout_enabled boolean not null default false,
  add column if not exists checkout_sku text,
  add column if not exists checkout_price_cents integer check (checkout_price_cents > 0);

create table if not exists public.checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  supplier_id uuid not null references public.checkout_suppliers(id),
  stripe_session_id text unique,
  items jsonb not null,
  subtotal_cents integer not null check (subtotal_cents > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.checkout_orders (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.checkout_attempts(id),
  user_id uuid not null references auth.users(id),
  supplier_id uuid not null references public.checkout_suppliers(id),
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  subtotal_cents integer not null,
  shipping_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null,
  currency text not null default 'usd',
  shipping_name text not null,
  shipping_address jsonb not null,
  customer_email text,
  status text not null default 'paid' check (status in ('paid','fulfilling','shipped','cancelled','refunded')),
  tracking_number text,
  tracking_url text,
  supplier_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.checkout_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.checkout_orders(id),
  product_id text not null references public.product_catalog(id),
  supplier_id uuid not null references public.checkout_suppliers(id),
  sku text not null,
  product_name text not null,
  quantity integer not null check (quantity between 1 and 10),
  unit_price_cents integer not null check (unit_price_cents > 0),
  unique(order_id, product_id)
);

create index if not exists checkout_orders_user_idx on public.checkout_orders(user_id, created_at desc);
create index if not exists checkout_order_items_order_idx on public.checkout_order_items(order_id);

alter table public.checkout_suppliers enable row level security;
alter table public.checkout_attempts enable row level security;
alter table public.checkout_orders enable row level security;
alter table public.checkout_order_items enable row level security;
-- All checkout reads and writes go through server handlers using the service role.
revoke all on public.checkout_suppliers, public.checkout_attempts, public.checkout_orders, public.checkout_order_items from anon, authenticated;
grant all on public.checkout_suppliers, public.checkout_attempts, public.checkout_orders, public.checkout_order_items to service_role;

-- The existing public catalog policy exposes rows to clients. Sensitive wholesale data stays out of it.
-- Activation is deliberately manual after fulfillment terms, price and test mailbox are checked.
insert into public.checkout_suppliers (name, order_email, active)
values ('SootheHer test fulfillment', 'test@example.invalid', false)
on conflict (name) do nothing;

-- One product from a signed partner with a two-item catalog set. It remains
-- disabled until Ayna confirms direct fulfillment terms and runs the test.
update public.product_catalog p set
  checkout_supplier_id = s.id,
  checkout_sku = 'SOOTHEHER-GEL-PAD-REFILLS-TEST',
  checkout_price_cents = 1199
from public.checkout_suppliers s
where p.id = 'p-sootheher-gel-pad-refills'
  and p.brand = 'SootheHer'
  and s.name = 'SootheHer test fulfillment'
  and p.checkout_supplier_id is null;
