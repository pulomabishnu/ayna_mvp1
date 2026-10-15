-- Ayna Commerce Engine: product -> offer -> variant, provider events,
-- commissions, the Amazon review worksheet, and safety rails on the pilot.
-- Apply after product_catalog.sql. Safe to run more than once. Nothing here
-- deletes or rewrites existing catalog rows.
--
-- Rules enforced in the database (not just in app code):
--   * An Amazon offer is affiliate_redirect only: never managed checkout,
--     manual fulfilment, provider ordering, or ayna/Stripe payment.
--   * An Amazon price can only come from Creators API, and Amazon prices are
--     never kept in the audit log (no price history).
--   * Prices are non-negative and always carry a currency.
--   * A variant always belongs to the same product as its offer.

-- ---------------------------------------------------------------------------
-- Partners (source of truth mirrored by src/data/brandPartners.js)
-- ---------------------------------------------------------------------------
create table if not exists public.commerce_partners (
  id text primary key,                         -- slug, e.g. 'neycher'
  name text not null,
  match_patterns text[] not null,              -- word-boundary patterns on "<brand> <name>"
  display_rank integer not null,
  since date not null,
  prelaunch boolean not null default false,
  route jsonb not null default '{"type":"brand_page"}'::jsonb,
  -- null until a wholesale/dropship/written agreement exists.
  managed_checkout jsonb,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  check (managed_checkout is null or (
    managed_checkout->>'type' in ('wholesale','dropship','written_permission')
    and coalesce(managed_checkout->>'reference','') <> ''
    and (managed_checkout->>'approvedAt') ~ '^\d{4}-\d{2}-\d{2}$'))
);
alter table public.commerce_partners enable row level security;
revoke all on public.commerce_partners from public, anon, authenticated;
grant select (id, name, display_rank, prelaunch, active) on public.commerce_partners to anon, authenticated;
grant all on public.commerce_partners to service_role;
drop policy if exists commerce_partners_public_read on public.commerce_partners;
create policy commerce_partners_public_read on public.commerce_partners for select to anon, authenticated using (active);

insert into public.commerce_partners(id, name, match_patterns, display_rank, since, prelaunch, route) values
  ('buni', 'BUNI', array['buni'], 0, '2026-09-11', false, '{"type":"ref_param","hosts":["bunibody.com"],"param":"ref","value":"oxaevspm"}'),
  ('sootheher', 'SootheHer', array['soothe ?her'], 1, '2026-09-23', false, '{"type":"per_product_link"}'),
  ('neycher', 'Neycher', array['neycher'], 2, '2026-08-25', false, '{"type":"per_product_link"}'),
  ('winx', 'Winx Health', array['winx'], 3, '2026-09-23', false, '{"type":"brand_page"}'),
  ('gina', 'gina', array['gina'], 4, '2026-09-23', false, '{"type":"brand_page"}'),
  ('elitone', 'Elitone', array['elitone'], 5, '2026-09-07', false, '{"type":"ref_param","hosts":["elitone.com"],"param":"af","value":"aynahealth"}'),
  ('proov', 'Proov', array['proov'], 6, '2026-09-07', false, '{"type":"per_product_link"}'),
  ('vio2', 'VIO2', array['vio2'], 7, '2026-09-07', false, '{"type":"per_product_link"}'),
  ('my-pelvic-bra', 'My Pelvic Bra', array['my pelvic bra'], 8, '2026-09-07', false, '{"type":"per_product_link"}'),
  ('connect-pff', 'Connect Pelvic Floor Fitness', array['connect pelvic floor fitness'], 9, '2026-08-27', false, '{"type":"per_product_link"}'),
  ('lola', 'LOLA', array['lola'], 10, '2026-09-23', false, '{"type":"brand_page"}'),
  ('lim-method', 'LiM Method', array['lim method'], 11, '2026-09-11', false, '{"type":"ref_param","hosts":["limmethod.com"],"param":"ref","value":"Ayna_Health"}'),
  ('resa', 'Rèsa', array['r[eè]sa'], 12, '2026-10-05', true, '{"type":"brand_page"}')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Offers: one row per place a product can be bought.
-- ---------------------------------------------------------------------------
create table if not exists public.commerce_offers (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.product_catalog(id),
  provider text not null check (provider in ('amazon_associates','shopmy','shopify_collabs','impact','brand_affiliate','brand_direct','retailer','shoppable','direct_partner_checkout','app_or_service','unknown')),
  commerce_method text not null check (commerce_method in ('affiliate_redirect','external_redirect','external_service','provider_checkout','managed_checkout','none')),
  payment_provider text not null default 'external_merchant' check (payment_provider in ('stripe','shoppable','external_merchant')),
  merchant_name text,
  merchant_domain text,
  destination_url text check (destination_url is null or destination_url ~ '^https://'),   -- what the shopper's click opens (tracked)
  canonical_url text check (canonical_url is null or canonical_url ~ '^https://'),         -- the merchant's own product page
  purchasing_url text check (purchasing_url is null or purchasing_url ~ '^https://'),      -- only if ayna may order it
  asin text check (asin is null or asin ~ '^[A-Z0-9]{10}$'),
  parent_asin text check (parent_asin is null or parent_asin ~ '^[A-Z0-9]{10}$'),
  provider_product_id text,
  sku text, upc text, ean text,
  currency text,
  regular_price_cents integer check (regular_price_cents is null or regular_price_cents >= 0),
  sale_price_cents integer check (sale_price_cents is null or sale_price_cents >= 0),
  current_price_cents integer check (current_price_cents is null or current_price_cents >= 0),
  price_source text not null default 'unknown' check (price_source in ('amazon_creators_api','shoppable_product_api','merchant_feed','merchant_api','zinc','manual_verification','legacy_import','unknown')),
  price_verified_at timestamptz,
  availability text not null default 'UNKNOWN' check (availability in ('AVAILABLE','LOW_STOCK','OUT_OF_STOCK','UNAVAILABLE','UNKNOWN','DISCONTINUED')),
  availability_verified_at timestamptz,
  seller_name text,
  affiliate_redirect boolean not null default false,
  managed_checkout_allowed boolean not null default false,
  manual_fulfillment_allowed boolean not null default false,
  provider_ordering_allowed boolean not null default false,
  partner_id text references public.commerce_partners(id),
  is_primary boolean not null default false,
  fallback_offer_id uuid references public.commerce_offers(id),
  selection_reason text,
  verification_method text check (verification_method is null or verification_method in ('provider_api','merchant_api','merchant_page','affiliate_destination','structured_feed','human_verified','asin_extracted_only','unable_to_verify')),
  confidence text check (confidence is null or confidence in ('exact','high','medium','low','manual_review_required')),
  audit_status text,
  audit_notes text,
  requires_manual_review boolean not null default true,
  active boolean not null default true,
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((regular_price_cents is null and sale_price_cents is null and current_price_cents is null) or (currency is not null and currency ~ '^[A-Z]{3}$')),
  -- Amazon Associates: shopper click to Amazon checkout, nothing else.
  constraint commerce_offers_amazon_redirect_only check (
    provider <> 'amazon_associates' or (
      commerce_method = 'affiliate_redirect' and payment_provider = 'external_merchant'
      and not managed_checkout_allowed and not manual_fulfillment_allowed and not provider_ordering_allowed
      and purchasing_url is null)),
  -- Amazon prices: Creators API only.
  constraint commerce_offers_amazon_price_source check (
    provider <> 'amazon_associates' or current_price_cents is null or price_source = 'amazon_creators_api'),
  -- Managed checkout needs a provider that can take payment.
  check (not managed_checkout_allowed or payment_provider in ('stripe','shoppable'))
);
create index if not exists commerce_offers_product on public.commerce_offers(product_id) where active;
create unique index if not exists commerce_offers_one_primary on public.commerce_offers(product_id) where is_primary and active;
alter table public.commerce_offers enable row level security;
revoke all on public.commerce_offers from public, anon, authenticated;
-- Shoppers may read what the UI shows; agreements, provider metadata and audit notes stay server-side.
grant select (id, product_id, provider, commerce_method, payment_provider, merchant_name, merchant_domain, destination_url,
  asin, currency, regular_price_cents, sale_price_cents, current_price_cents, price_source, price_verified_at,
  availability, availability_verified_at, is_primary, selection_reason, active)
  on public.commerce_offers to anon, authenticated;
grant all on public.commerce_offers to service_role;
drop policy if exists commerce_offers_public_read on public.commerce_offers;
create policy commerce_offers_public_read on public.commerce_offers for select to anon, authenticated using (active);

-- ---------------------------------------------------------------------------
-- Variants: the exact purchasable option within an offer.
-- ---------------------------------------------------------------------------
create table if not exists public.commerce_variants (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.commerce_offers(id) on delete cascade,
  product_id text not null references public.product_catalog(id),
  ayna_variant_id text,                 -- id used by the product page option list
  provider_variant_id text,             -- Shopify variant id, Target TCIN, ...
  asin text check (asin is null or asin ~ '^[A-Z0-9]{10}$'),
  sku text, upc text,
  variant_title text,
  size text, color text, scent text, flavor text, strength text, absorbency text,
  count integer check (count is null or count > 0),
  pack_quantity integer check (pack_quantity is null or pack_quantity > 0),
  volume text, weight text, format text, purchase_mode text check (purchase_mode is null or purchase_mode in ('one_time','subscription')),
  image_url text,                       -- never an Amazon image file; Amazon image URLs are not stored here
  currency text,
  regular_price_cents integer check (regular_price_cents is null or regular_price_cents >= 0),
  sale_price_cents integer check (sale_price_cents is null or sale_price_cents >= 0),
  current_price_cents integer check (current_price_cents is null or current_price_cents >= 0),
  price_source text not null default 'unknown',
  price_verified_at timestamptz,
  availability text not null default 'UNKNOWN' check (availability in ('AVAILABLE','LOW_STOCK','OUT_OF_STOCK','UNAVAILABLE','UNKNOWN','DISCONTINUED')),
  availability_verified_at timestamptz,
  canonical_url text check (canonical_url is null or canonical_url ~ '^https://'),
  destination_url text check (destination_url is null or destination_url ~ '^https://'),
  active boolean not null default true,
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offer_id, ayna_variant_id),
  check ((regular_price_cents is null and sale_price_cents is null and current_price_cents is null) or (currency is not null and currency ~ '^[A-Z]{3}$'))
);
create index if not exists commerce_variants_offer on public.commerce_variants(offer_id);

create or replace function public.commerce_variant_guard() returns trigger language plpgsql security invoker set search_path = '' as $$
declare o public.commerce_offers;
begin
  select * into o from public.commerce_offers where id = new.offer_id;
  if not found then raise exception 'variant offer not found'; end if;
  if o.product_id is distinct from new.product_id then raise exception 'variant belongs to a different product than its offer'; end if;
  if o.provider = 'amazon_associates' and new.current_price_cents is not null and new.price_source <> 'amazon_creators_api' then
    raise exception 'Amazon variant prices may only come from Creators API';
  end if;
  if o.provider = 'amazon_associates' and new.image_url is not null then
    raise exception 'Do not store Amazon images on variants; use brand or ayna imagery';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists commerce_variant_guard on public.commerce_variants;
create trigger commerce_variant_guard before insert or update on public.commerce_variants for each row execute function public.commerce_variant_guard();

alter table public.commerce_variants enable row level security;
revoke all on public.commerce_variants from public, anon, authenticated;
grant select (id, offer_id, product_id, ayna_variant_id, asin, variant_title, size, color, scent, flavor, strength, absorbency,
  count, pack_quantity, volume, weight, format, purchase_mode, image_url, currency, regular_price_cents, sale_price_cents,
  current_price_cents, price_source, price_verified_at, availability, availability_verified_at, destination_url, active)
  on public.commerce_variants to anon, authenticated;
grant all on public.commerce_variants to service_role;
drop policy if exists commerce_variants_public_read on public.commerce_variants;
create policy commerce_variants_public_read on public.commerce_variants for select to anon, authenticated using (active);

-- ---------------------------------------------------------------------------
-- Audit log: what each check found. Amazon rows never carry prices.
-- ---------------------------------------------------------------------------
create table if not exists public.commerce_audit_log (
  id bigint generated always as identity primary key,
  product_id text not null,
  offer_id uuid references public.commerce_offers(id),
  provider text,
  old_status text,
  new_status text,
  issues text[] not null default '{}',
  severity text check (severity is null or severity in ('CRITICAL','HIGH','MEDIUM','LOW')),
  old_price_cents integer,
  new_price_cents integer,
  price_changed boolean,
  check_source text not null,            -- 'catalog_audit_2026-10-15', 'shopify_feed_sync', 'human', ...
  automatic boolean not null default true,
  notes text,
  checked_at timestamptz not null default now(),
  constraint commerce_audit_no_amazon_price_history check (provider is distinct from 'amazon_associates' or (old_price_cents is null and new_price_cents is null))
);
create index if not exists commerce_audit_log_product on public.commerce_audit_log(product_id, checked_at desc);
alter table public.commerce_audit_log enable row level security;
revoke all on public.commerce_audit_log from public, anon, authenticated;
grant all on public.commerce_audit_log to service_role;

-- ---------------------------------------------------------------------------
-- Amazon human review: current state per ASIN, no history. Prices are not
-- stored: Associates policy allows showing Amazon prices only from Creators
-- API or an Amazon-served link, so a human-read price can't be displayed and
-- isn't kept.
-- ---------------------------------------------------------------------------
create table if not exists public.amazon_offer_reviews (
  product_id text not null references public.product_catalog(id),
  ayna_variant_id text not null default '',
  asin text not null check (asin ~ '^[A-Z0-9]{10}$'),
  exact_product boolean,
  exact_variant boolean,
  verified_size_count text,
  availability_seen text check (availability_seen is null or availability_seen in ('AVAILABLE','OUT_OF_STOCK','UNAVAILABLE','UNKNOWN')),
  image_matches boolean,
  notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_by_email text,
  verification_method text not null default 'human' check (verification_method = 'human'),
  reviewed_at timestamptz not null default now(),
  primary key (product_id, ayna_variant_id)
);
alter table public.amazon_offer_reviews enable row level security;
revoke all on public.amazon_offer_reviews from public, anon, authenticated;
grant all on public.amazon_offer_reviews to service_role;

-- ---------------------------------------------------------------------------
-- Provider events: idempotent webhooks (Stripe, Shoppable, Zinc, networks).
-- ---------------------------------------------------------------------------
create table if not exists public.commerce_provider_events (
  provider text not null,
  event_id text not null,
  event_type text not null,
  object_id text,
  received_at timestamptz not null default now(),
  primary key (provider, event_id)
);
alter table public.commerce_provider_events enable row level security;
revoke all on public.commerce_provider_events from public, anon, authenticated;
grant all on public.commerce_provider_events to service_role;

-- ---------------------------------------------------------------------------
-- Commissions: only what a network REPORTS. Clicks are never revenue.
-- ---------------------------------------------------------------------------
create table if not exists public.commerce_commissions (
  id bigint generated always as identity primary key,
  provider text not null,
  transaction_ref text not null,
  product_id text,
  offer_id uuid references public.commerce_offers(id),
  gmv_cents integer check (gmv_cents is null or gmv_cents >= 0),
  commission_cents integer check (commission_cents is null or commission_cents >= 0),
  currency text not null default 'USD',
  status text not null check (status in ('reported','locked','paid','reversed')),
  reported_at timestamptz not null,
  paid_at timestamptz,
  unique (provider, transaction_ref)
);
alter table public.commerce_commissions enable row level security;
revoke all on public.commerce_commissions from public, anon, authenticated;
grant all on public.commerce_commissions to service_role;

-- ---------------------------------------------------------------------------
-- Pilot ("Buy on ayna", PR #33) safety rails, if those tables exist here:
--   * no Amazon item may enter a manual-fulfilment order or price list;
--   * existing Amazon price rows are taken out of live checkout (not deleted);
--   * payment and fulfilment get separate statuses plus the real hold deadline.
-- ---------------------------------------------------------------------------
create or replace function public.commerce_reject_amazon_retailer() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.retailer_url ~* '^https?://([a-z0-9-]+\.)*(amazon\.[a-z.]+|amzn\.(to|com)|a\.co)(/|$)' then
    raise exception 'Amazon items are affiliate-redirect only and cannot be bought by ayna for a customer (Amazon Associates agreement)';
  end if;
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.pilot_order_items') is not null then
    drop trigger if exists pilot_order_items_no_amazon on public.pilot_order_items;
    create trigger pilot_order_items_no_amazon before insert or update of retailer_url on public.pilot_order_items
      for each row execute function public.commerce_reject_amazon_retailer();
  end if;
  if to_regclass('public.pilot_product_prices') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pilot_product_prices' and column_name = 'live_approved') then
      execute $q$update public.pilot_product_prices set live_approved = false
        where retailer_url ~* '^https?://([a-z0-9-]+\.)*(amazon\.[a-z.]+|amzn\.(to|com)|a\.co)(/|$)'$q$;
    end if;
    drop trigger if exists pilot_product_prices_no_amazon on public.pilot_product_prices;
    -- Existing rows are left in place (marked not live above); new or edited rows may not point at Amazon.
    create trigger pilot_product_prices_no_amazon before insert or update of retailer_url on public.pilot_product_prices
      for each row execute function public.commerce_reject_amazon_retailer();
  end if;
  if to_regclass('public.pilot_orders') is not null then
    alter table public.pilot_orders add column if not exists payment_intent_id text;
    alter table public.pilot_orders add column if not exists payment_status text not null default 'none'
      check (payment_status in ('none','authorized','captured','partially_captured','canceled','expired','refund_pending','refunded'));
    alter table public.pilot_orders add column if not exists authorized_amount_cents integer check (authorized_amount_cents is null or authorized_amount_cents > 0);
    alter table public.pilot_orders add column if not exists max_approved_total_cents integer check (max_approved_total_cents is null or max_approved_total_cents > 0);
    alter table public.pilot_orders add column if not exists authorized_at timestamptz;
    alter table public.pilot_orders add column if not exists capture_before timestamptz;
    alter table public.pilot_orders add column if not exists captured_amount_cents integer check (captured_amount_cents is null or captured_amount_cents >= 0);
    alter table public.pilot_orders add column if not exists tax_configuration text not null default 'TAX_CONFIGURATION_PENDING';
  end if;
end;
$$;

notify pgrst, 'reload schema';
