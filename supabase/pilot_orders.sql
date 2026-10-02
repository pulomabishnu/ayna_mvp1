-- One-product TEST pilot. Apply after product_catalog.sql. No catalog updates.
create table if not exists public.pilot_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  attempt_id uuid not null,
  product_id text not null references public.product_catalog(id),
  product_name text not null,
  stripe_price_id text not null,
  stripe_session_id text unique,
  amount integer not null check (amount > 0),
  currency text not null,
  vendor_name text not null,
  status text not null default 'pending' check (status in ('pending','paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique(user_id, attempt_id)
);
create table if not exists public.pilot_fulfillments (
  order_id uuid primary key references public.pilot_orders(id),
  vendor_name text not null,
  status text not null default 'awaiting_fulfillment' check (status in ('awaiting_fulfillment','shipped')),
  shipping jsonb not null,
  customer_email text,
  carrier text,
  tracking_number text,
  tracking_url text,
  created_at timestamptz not null default now(),
  shipped_at timestamptz,
  updated_by uuid references auth.users(id)
);
create index if not exists pilot_orders_user_created on public.pilot_orders(user_id, created_at desc);
alter table public.pilot_orders enable row level security;
alter table public.pilot_fulfillments enable row level security;
revoke all on public.pilot_orders, public.pilot_fulfillments from public, anon, authenticated;
grant select on public.pilot_orders, public.pilot_fulfillments to authenticated;
grant all on public.pilot_orders, public.pilot_fulfillments to service_role;
drop policy if exists pilot_read_own_orders on public.pilot_orders;
create policy pilot_read_own_orders on public.pilot_orders for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists pilot_read_own_tracking on public.pilot_fulfillments;
create policy pilot_read_own_tracking on public.pilot_fulfillments for select to authenticated using (
  exists (select 1 from public.pilot_orders o where o.id = order_id and o.user_id = (select auth.uid()))
);
-- Atomic payment + durable admin notification. The fulfillment row IS the admin
-- inbox item. Retries lock the same order and cannot duplicate/reset tracking.
create or replace function public.pilot_record_payment(
  p_order_id uuid, p_session_id text, p_amount integer, p_currency text,
  p_user_id uuid, p_shipping jsonb, p_email text
) returns void language plpgsql security invoker set search_path = '' as $$
declare o public.pilot_orders;
begin
  select * into o from public.pilot_orders where id = p_order_id for update;
  if not found then raise exception 'unknown pilot order'; end if;
  if p_amount is distinct from o.amount or p_currency is distinct from o.currency
    or p_user_id is distinct from o.user_id
    or p_session_id is null
    or (o.stripe_session_id is not null and o.stripe_session_id <> p_session_id)
    then raise exception 'payment mismatch'; end if;
  if o.status = 'paid' then return; end if;
  update public.pilot_orders set status = 'paid', paid_at = now(), stripe_session_id = p_session_id where id = o.id;
  insert into public.pilot_fulfillments(order_id, vendor_name, shipping, customer_email)
    values(o.id, o.vendor_name, p_shipping, p_email);
end;
$$;
revoke all on function public.pilot_record_payment(uuid,text,integer,text,uuid,jsonb,text) from public, anon, authenticated;
grant execute on function public.pilot_record_payment(uuid,text,integer,text,uuid,jsonb,text) to service_role;
