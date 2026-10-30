-- Gift box: the monthly focus group winner picks their own box.
--
-- The team lists the products (/admin/gift), makes a one-time link per winner
-- with a spending limit, and the winner shops /gift/<link>: add to cart, check
-- out for free with their shipping address. The link locks after one order.
-- Admins can also check out from /gift (signed in) with no limit.
--
-- Products normally come from the team's Google Sheet: the site re-reads it
-- every few minutes (and on "Sync now") and upserts by the sheet's id column.
--
-- Idempotent: safe to re-run. NOT applied automatically; run it once in the
-- Supabase SQL editor.
--
-- Design
--   * The backend is the only reader and writer (api/giftbox.js,
--     api/giftbox-admin.js, service_role key). RLS is on with no client
--     policies, so the browser can never read the tables or the links.
--   * Prices are never taken from the browser. giftbox_checkout re-prices the
--     cart from giftbox_products, checks the limit, writes the order and locks
--     the link in one transaction (row lock on the link, so a double click or
--     two tabs can never place two orders).

-- ── Tables ───────────────────────────────────────────────────────────────────

create table if not exists public.giftbox_products (
  id uuid primary key default gen_random_uuid(),
  -- The row's "id" in the team's Google Sheet (api/_giftboxSheet.js). Null for
  -- products added by hand on /admin/gift.
  sheet_id text unique check (sheet_id is null or sheet_id ~ '^[A-Za-z0-9_.-]{1,80}$'),
  category text not null default '' check (char_length(category) <= 60),
  brand text not null default '' check (char_length(brand) <= 120),
  name text not null check (char_length(name) between 1 and 200),
  notes text not null default '' check (char_length(notes) <= 2000),
  -- Retail value in US cents. This is what counts against a winner's limit.
  price_cents integer not null check (price_cents between 0 and 1000000),
  image_url text check (image_url is null or char_length(image_url) <= 2000),
  product_url text check (product_url is null or char_length(product_url) <= 2000),
  max_per_order integer not null default 1 check (max_per_order between 1 and 20),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.giftbox_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique check (token ~ '^[A-Za-z0-9_-]{20,64}$'),
  winner_name text not null check (char_length(winner_name) between 1 and 120),
  winner_email text check (winner_email is null or char_length(winner_email) <= 254),
  label text not null default '' check (char_length(label) <= 120),
  budget_cents integer not null check (budget_cents between 100 and 1000000),
  status text not null default 'open' check (status in ('open', 'redeemed', 'revoked')),
  expires_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  redeemed_at timestamptz
);

create table if not exists public.giftbox_orders (
  id uuid primary key default gen_random_uuid(),
  -- One order per link (several admin orders have no link: null is allowed many times).
  invite_id uuid unique references public.giftbox_invites (id) on delete set null,
  kind text not null check (kind in ('winner', 'admin')),
  placed_by text not null check (char_length(placed_by) between 1 and 254),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  total_cents integer not null check (total_cents >= 0),
  budget_cents integer,
  ship_name text not null check (char_length(ship_name) between 1 and 120),
  ship_email text not null check (char_length(ship_email) between 3 and 254),
  ship_phone text check (ship_phone is null or char_length(ship_phone) <= 40),
  address_line1 text not null check (char_length(address_line1) between 1 and 200),
  address_line2 text check (address_line2 is null or char_length(address_line2) <= 200),
  city text not null check (char_length(city) between 1 and 100),
  state text not null check (char_length(state) between 1 and 60),
  postal_code text not null check (char_length(postal_code) between 3 and 20),
  note text check (note is null or char_length(note) <= 1000),
  status text not null default 'new' check (status in ('new', 'preparing', 'shipped', 'delivered', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Re-run safety if an earlier copy of this file was applied before the sheet columns existed.
alter table public.giftbox_products add column if not exists sheet_id text unique;
alter table public.giftbox_products add column if not exists category text not null default '';

create index if not exists giftbox_orders_created_idx on public.giftbox_orders (created_at desc);
create index if not exists giftbox_invites_created_idx on public.giftbox_invites (created_at desc);

alter table public.giftbox_products enable row level security;
alter table public.giftbox_invites enable row level security;
alter table public.giftbox_orders enable row level security;

revoke all on public.giftbox_products, public.giftbox_invites, public.giftbox_orders from anon, authenticated;
grant select, insert, update, delete on public.giftbox_products, public.giftbox_invites, public.giftbox_orders to service_role;

-- ── Checkout ─────────────────────────────────────────────────────────────────
-- p_token: the winner's link (null for an admin order).
-- p_admin: the admin's email (null for a winner order). api/giftbox.js sets it
--          only after checking the session against ADMIN_EMAILS.
-- p_items: [{ "id": "<product uuid>", "qty": 1 }, ...] (ids unique, validated by the API).
-- p_ship:  { name, email, phone, line1, line2, city, state, postal, note }.

create or replace function public.giftbox_checkout(p_token text, p_admin text, p_items jsonb, p_ship jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.giftbox_invites;
  v_total integer := 0;
  v_items jsonb := '[]'::jsonb;
  v_count integer := 0;
  v_order uuid;
  r record;
begin
  if p_token is not null then
    select * into v_inv from public.giftbox_invites where token = p_token for update;
    if not found or v_inv.status = 'revoked' then
      return jsonb_build_object('ok', false, 'error', 'invalid_link');
    end if;
    if v_inv.status = 'redeemed' then
      return jsonb_build_object('ok', false, 'error', 'already_used');
    end if;
    if v_inv.expires_at is not null and v_inv.expires_at < now() then
      return jsonb_build_object('ok', false, 'error', 'expired');
    end if;
  elsif p_admin is null then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'error', 'empty_cart');
  end if;

  for r in
    select p.*, (i ->> 'qty')::integer as qty
    from jsonb_array_elements(p_items) i
    join public.giftbox_products p on p.id = (i ->> 'id')::uuid
  loop
    if not r.is_active then
      return jsonb_build_object('ok', false, 'error', 'unavailable', 'productId', r.id);
    end if;
    if r.qty < 1 or r.qty > r.max_per_order then
      return jsonb_build_object('ok', false, 'error', 'too_many', 'productId', r.id);
    end if;
    v_count := v_count + 1;
    v_total := v_total + r.price_cents * r.qty;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id', r.id, 'brand', r.brand, 'name', r.name, 'qty', r.qty, 'priceCents', r.price_cents, 'imageUrl', r.image_url));
  end loop;

  if v_count <> jsonb_array_length(p_items) then
    return jsonb_build_object('ok', false, 'error', 'unavailable');
  end if;

  if p_token is not null and v_total > v_inv.budget_cents then
    return jsonb_build_object('ok', false, 'error', 'over_budget', 'totalCents', v_total, 'budgetCents', v_inv.budget_cents);
  end if;

  insert into public.giftbox_orders (
    invite_id, kind, placed_by, items, total_cents, budget_cents,
    ship_name, ship_email, ship_phone, address_line1, address_line2, city, state, postal_code, note)
  values (
    v_inv.id,
    case when p_token is null then 'admin' else 'winner' end,
    coalesce(p_admin, v_inv.winner_name),
    v_items, v_total, v_inv.budget_cents,
    p_ship ->> 'name', p_ship ->> 'email', nullif(p_ship ->> 'phone', ''),
    p_ship ->> 'line1', nullif(p_ship ->> 'line2', ''), p_ship ->> 'city', p_ship ->> 'state', p_ship ->> 'postal',
    nullif(p_ship ->> 'note', ''))
  returning id into v_order;

  if p_token is not null then
    update public.giftbox_invites set status = 'redeemed', redeemed_at = now() where id = v_inv.id;
  end if;

  return jsonb_build_object('ok', true, 'orderId', v_order, 'totalCents', v_total, 'items', v_items);
end;
$$;

revoke all on function public.giftbox_checkout(text, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.giftbox_checkout(text, text, jsonb, jsonb) to service_role;
