-- Free product pool: prizes that are also listed in Ameera's Vinted shop.
-- Needs 20261015120000_free_product_campaign.sql. Idempotent: safe to re-run.
-- NOT applied automatically; run it once in the Supabase SQL editor.
--
-- Each Vinted listing is one physical unit. A reward product can have several
-- listings (two of the same serum = two units). Every day a check run in the team's browser
-- reads each listing's page (Vinted blocks server-side requests) and records whether it can still be bought:
--   available  can be bought on Vinted        -> counts as a prize unit
--   reserved   someone is buying it           -> not winnable (comes back if released)
--   sold       sold, or the listing is gone   -> not winnable
-- A unit someone wins in the campaign is tied to one listing the moment they
-- claim (trigger below), so delisting that unit on Vinted afterwards never
-- takes a second unit away from the pool.
--
--   inventory_total = units already won + listings still available and not won

create table if not exists public.reward_vinted_listings (
  listing_id bigint primary key,
  reward_product_id uuid not null references public.reward_products (id) on delete cascade,
  status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  claim_id uuid references public.reward_claims (id) on delete set null,
  title text,
  last_checked_at timestamptz,
  status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists reward_vinted_listings_product_idx on public.reward_vinted_listings (reward_product_id);
create unique index if not exists reward_vinted_listings_claim_idx on public.reward_vinted_listings (claim_id) where claim_id is not null;

alter table public.reward_vinted_listings enable row level security;
revoke all on public.reward_vinted_listings from public, anon, authenticated;

-- Recount every Vinted-backed prize from its listings. Never below what has
-- already been won (the campaign's own check enforces that too).
create or replace function public.campaign_vinted_recount(p_campaign text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update public.reward_products rp
     set inventory_total = rp.inventory_claimed + coalesce((
           select count(*) from public.reward_vinted_listings l
            where l.reward_product_id = rp.id and l.status = 'available' and l.claim_id is null), 0),
         updated_at = now()
   where rp.campaign_id = p_campaign
     and exists (select 1 from public.reward_vinted_listings l where l.reward_product_id = rp.id)
     and rp.inventory_total is distinct from rp.inventory_claimed + coalesce((
           select count(*) from public.reward_vinted_listings l
            where l.reward_product_id = rp.id and l.status = 'available' and l.claim_id is null), 0);
$$;

-- A claim on a Vinted-backed prize uses up one available listing.
create or replace function public.campaign_vinted_on_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reward_vinted_listings
     set claim_id = new.id
   where listing_id = (
     select listing_id from public.reward_vinted_listings
      where reward_product_id = new.reward_product_id and claim_id is null
      order by (status = 'available') desc, listing_id
      limit 1
      for update skip locked
   );
  return new;
end
$$;

drop trigger if exists reward_claims_vinted on public.reward_claims;
create trigger reward_claims_vinted
  after insert on public.reward_claims
  for each row execute function public.campaign_vinted_on_claim();

-- Apply one day's check. p_results: [{"listingId": 123, "status": "available"|"reserved"|"sold"|"unknown"}].
-- "unknown" (page could not be read) changes nothing. Returns what changed.
create or replace function public.campaign_vinted_apply(p_campaign text, p_results jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  r jsonb;
  v_id bigint;
  v_status text;
  v_old public.reward_vinted_listings;
  v_changes jsonb := '[]'::jsonb;
  v_checked integer := 0;
begin
  perform pg_advisory_xact_lock(hashtext('campaign_vinted_' || p_campaign));
  for r in select * from jsonb_array_elements(coalesce(p_results, '[]'::jsonb)) loop
    v_id := (r ->> 'listingId')::bigint;
    v_status := r ->> 'status';
    select * into v_old from public.reward_vinted_listings where listing_id = v_id;
    if not found or v_status not in ('available', 'reserved', 'sold') then
      continue;
    end if;
    v_checked := v_checked + 1;
    update public.reward_vinted_listings
       set status = v_status,
           last_checked_at = now(),
           status_changed_at = case when status = v_status then status_changed_at else now() end
     where listing_id = v_id;
    if v_old.status is distinct from v_status then
      v_changes := v_changes || jsonb_build_object(
        'listingId', v_id, 'from', v_old.status, 'to', v_status, 'wonInCampaign', v_old.claim_id is not null,
        'product', (select coalesce(rp.brand || ' ', '') || coalesce(rp.name, '') from public.reward_products rp where rp.id = v_old.reward_product_id));
    end if;
  end loop;
  perform public.campaign_vinted_recount(p_campaign);
  return jsonb_build_object(
    'checked', v_checked,
    'changes', v_changes,
    'available', (select count(*) from public.reward_vinted_listings l join public.reward_products rp on rp.id = l.reward_product_id
                   where rp.campaign_id = p_campaign and l.status = 'available' and l.claim_id is null));
end
$$;

-- Listings to check (the admin page and the daily check read this).
drop function if exists public.campaign_vinted_listings(text);
create or replace function public.campaign_vinted_listings(p_campaign text)
returns table (listing_id bigint, status text, claimed boolean, product text, last_checked_at timestamptz, status_changed_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select l.listing_id, l.status, l.claim_id is not null, coalesce(rp.brand || ' ', '') || coalesce(rp.name, ''), l.last_checked_at, l.status_changed_at
  from public.reward_vinted_listings l
  join public.reward_products rp on rp.id = l.reward_product_id
  where rp.campaign_id = p_campaign
  order by l.listing_id
$$;

revoke all on function public.campaign_vinted_recount(text) from public, anon, authenticated;
revoke all on function public.campaign_vinted_apply(text, jsonb) from public, anon, authenticated;
revoke all on function public.campaign_vinted_listings(text) from public, anon, authenticated;
revoke all on function public.campaign_vinted_on_claim() from public, anon, authenticated;
grant execute on function public.campaign_vinted_apply(text, jsonb) to service_role;
grant execute on function public.campaign_vinted_listings(text) to service_role;
grant execute on function public.campaign_vinted_recount(text) to service_role;
