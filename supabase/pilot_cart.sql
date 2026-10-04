-- Multi-item cart orders with per-item fulfillment. Apply after pilot_orders.sql,
-- pilot_prices.sql and pilot_requests.sql. Safe to run more than once.

create sequence if not exists public.pilot_order_number_seq start 1001;
grant usage, select on sequence public.pilot_order_number_seq to service_role;

-- A cart order has many products, so the order itself no longer points at one.
alter table public.pilot_orders alter column product_id drop not null;
alter table public.pilot_orders add column if not exists order_number bigint not null default nextval('public.pilot_order_number_seq');
alter table public.pilot_orders add column if not exists cart_key text;
alter table public.pilot_orders add column if not exists subtotal_cents integer;
alter table public.pilot_orders add column if not exists service_fee_cents integer;
alter table public.pilot_orders add column if not exists processing_cents integer;
create unique index if not exists pilot_orders_order_number_key on public.pilot_orders(order_number);

alter table public.pilot_fulfillments add column if not exists customer_notified_at timestamptz;
-- Email is only a notification. These show the admin inbox which emails still need a retry.
alter table public.pilot_fulfillments add column if not exists team_notified_at timestamptz;
alter table public.pilot_fulfillments add column if not exists customer_confirmed_at timestamptz;

-- One row per product + option in an order. This is also the per-item fulfillment
-- record: different items can be bought and shipped separately.
create table if not exists public.pilot_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.pilot_orders(id),
  line_no integer not null check (line_no > 0),
  product_id text not null references public.product_catalog(id),
  product_name text not null,
  variant_id text not null default '',
  variant_label text,
  quantity integer not null check (quantity between 1 and 10),
  retailer_url text check (retailer_url is null or retailer_url ~ '^https://'),
  retailer_unit_cents integer not null check (retailer_unit_cents > 0),
  customer_unit_cents integer not null check (customer_unit_cents > 0),
  customer_line_cents integer not null check (customer_line_cents > 0),
  item_status text not null default 'needs_purchase'
    check (item_status in ('needs_purchase','purchased','processing','shipped','delivered','issue','refunded')),
  retailer_name text,
  retailer_order_number text,
  actual_cost_cents integer check (actual_cost_cents is null or actual_cost_cents >= 0),
  purchased_at timestamptz,
  carrier text,
  tracking_number text,
  tracking_url text check (tracking_url is null or tracking_url ~ '^https://'),
  estimated_delivery date,
  shipped_at timestamptz,
  internal_notes text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (order_id, line_no)
);
create index if not exists pilot_order_items_order on public.pilot_order_items(order_id);
alter table public.pilot_order_items enable row level security;
revoke all on public.pilot_order_items from public, anon, authenticated;
grant all on public.pilot_order_items to service_role;
-- Customers may read their own items, but only the customer-safe columns. The
-- retailer link, what the team paid, retailer order numbers and internal notes
-- are never granted to the customer role.
grant select (id, order_id, line_no, product_id, product_name, variant_id, variant_label, quantity,
  customer_unit_cents, customer_line_cents, item_status, carrier, tracking_number, tracking_url,
  estimated_delivery, shipped_at, created_at)
  on public.pilot_order_items to authenticated;
drop policy if exists pilot_read_own_items on public.pilot_order_items;
create policy pilot_read_own_items on public.pilot_order_items for select to authenticated using (
  exists (select 1 from public.pilot_orders o where o.id = order_id and o.user_id = (select auth.uid()))
);

-- Carry earlier single-product orders (and their tracking) into the item model.
insert into public.pilot_order_items(order_id, line_no, product_id, product_name, variant_id, variant_label, quantity,
    retailer_url, retailer_unit_cents, customer_unit_cents, customer_line_cents, item_status, carrier, tracking_number, tracking_url, shipped_at)
  select o.id, 1, o.product_id, o.product_name, coalesce(o.variant_id, ''), null, 1, -- earlier orders already carry the option in product_name
    o.retailer_url,
    case when o.stripe_price_id ~ '^retailer:[0-9]+$' then substr(o.stripe_price_id, 10)::integer else o.amount end,
    o.amount, o.amount,
    case when f.status = 'shipped' then 'shipped' else 'needs_purchase' end,
    f.carrier, f.tracking_number, f.tracking_url, f.shipped_at
  from public.pilot_orders o
  left join public.pilot_fulfillments f on f.order_id = o.id
  where o.product_id is not null
    and not exists (select 1 from public.pilot_order_items i where i.order_id = o.id);

-- Creates an order and all of its items atomically. A retry of the same browser
-- attempt returns the same order; a different cart under the same attempt is refused.
create or replace function public.pilot_create_order(
  p_user_id uuid, p_attempt_id uuid, p_name text, p_vendor text, p_currency text, p_cart_key text,
  p_subtotal integer, p_fee integer, p_processing integer, p_amount integer, p_items jsonb
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare existing public.pilot_orders; new_id uuid;
begin
  select * into existing from public.pilot_orders where user_id = p_user_id and attempt_id = p_attempt_id for update;
  if found then
    if existing.cart_key is distinct from p_cart_key then raise exception 'cart mismatch'; end if;
    return existing.id;
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'invalid items';
  end if;
  if p_amount is distinct from p_subtotal + p_fee + p_processing
    or p_amount is distinct from (select sum((i->>'customer_line_cents')::integer) from jsonb_array_elements(p_items) i) + p_processing
    or p_subtotal is distinct from (select sum((i->>'retailer_unit_cents')::integer * (i->>'quantity')::integer) from jsonb_array_elements(p_items) i)
  then raise exception 'order totals do not add up'; end if;
  begin
    insert into public.pilot_orders(user_id, attempt_id, product_id, product_name, stripe_price_id, amount, currency, vendor_name,
        cart_key, subtotal_cents, service_fee_cents, processing_cents)
      values(p_user_id, p_attempt_id, null, p_name, 'cart', p_amount, p_currency, p_vendor,
        p_cart_key, p_subtotal, p_fee, p_processing)
      returning id into new_id;
  exception when unique_violation then
    select * into existing from public.pilot_orders where user_id = p_user_id and attempt_id = p_attempt_id;
    if existing.cart_key is distinct from p_cart_key then raise exception 'cart mismatch'; end if;
    return existing.id;
  end;
  insert into public.pilot_order_items(order_id, line_no, product_id, product_name, variant_id, variant_label, quantity,
      retailer_url, retailer_unit_cents, customer_unit_cents, customer_line_cents)
    select new_id, (i->>'line_no')::integer, i->>'product_id', i->>'product_name', coalesce(i->>'variant_id', ''), i->>'variant_label',
      (i->>'quantity')::integer, nullif(i->>'retailer_url', ''), (i->>'retailer_unit_cents')::integer,
      (i->>'customer_unit_cents')::integer, (i->>'customer_line_cents')::integer
    from jsonb_array_elements(p_items) i;
  return new_id;
end;
$$;
revoke all on function public.pilot_create_order(uuid,uuid,text,text,text,text,integer,integer,integer,integer,jsonb) from public, anon, authenticated;
grant execute on function public.pilot_create_order(uuid,uuid,text,text,text,text,integer,integer,integer,integer,jsonb) to service_role;

-- Make the new function and tables visible to the API immediately.
notify pgrst, 'reload schema';
