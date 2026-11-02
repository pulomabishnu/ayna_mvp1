-- Free product spinner: the prize pool is the gift box sheet.
--
-- Same products as /gift (the team's Google Sheet "ayna gift box products",
-- synced into giftbox_products by api/_giftboxSheet.js). Every product with
-- show = yes is in the spinner; show = no takes it out. Each one can be won as
-- many times as its "max" column (1 for most). Up to 3 spins per person.
--
-- Run AFTER 20261015120000_free_product_campaign.sql, 20261021120000_vinted_pool_sync.sql
-- and 20261030120000_gift_box.sql. Idempotent: safe to re-run. NOT applied
-- automatically; run it once in the Supabase SQL editor.
--
-- How it works
--   * reward_campaigns.pool_source = 'giftbox' turns this on for a campaign.
--   * campaign_sync_giftbox_pool(campaign) mirrors giftbox_products into
--     reward_products (one row per gift box product, linked by
--     giftbox_product_id): name, brand, category, photo, link, shown or not,
--     and units = max (never below what has already been claimed). Reward rows
--     that are not from the sheet are switched off (never deleted, so past
--     spins and claims keep their product).
--   * api/campaign.js runs it when someone opens or spins (after re-reading the
--     sheet at most every 5 minutes), and /admin/campaign has "Sync now".
--   * Claims still take units only inside campaign_claim, so two people can
--     never win the same last unit.
--   * campaign_admin_test_spin lets admins try the spinner on /admin/campaign
--     without saving a spin or using up a unit.

do $$
begin
  if to_regclass('public.reward_products') is null then
    raise exception 'Apply supabase/migrations/20261015120000_free_product_campaign.sql first.';
  end if;
  if to_regclass('public.giftbox_products') is null then
    raise exception 'Apply supabase/migrations/20261030120000_gift_box.sql first.';
  end if;
end $$;

alter table public.reward_campaigns add column if not exists pool_source text not null default 'manual';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reward_campaigns_pool_source_check') then
    alter table public.reward_campaigns add constraint reward_campaigns_pool_source_check check (pool_source in ('manual', 'giftbox'));
  end if;
end $$;

alter table public.reward_products add column if not exists giftbox_product_id uuid references public.giftbox_products (id) on delete set null;
create unique index if not exists reward_products_giftbox_uniq
  on public.reward_products (campaign_id, giftbox_product_id) where giftbox_product_id is not null;

-- ── Sync ─────────────────────────────────────────────────────────────────────

create or replace function public.campaign_sync_giftbox_pool(p_campaign text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  c public.reward_campaigns;
  v_adopted integer := 0;
  v_added integer := 0;
  v_updated integer := 0;
  v_off integer := 0;
begin
  select * into c from public.reward_campaigns where id = p_campaign;
  if not found then return jsonb_build_object('ok', false, 'error', 'campaign_not_found'); end if;
  if c.pool_source <> 'giftbox' then return jsonb_build_object('ok', true, 'skipped', 'pool_source_manual'); end if;

  -- One sync at a time per campaign (two server instances can call this together).
  perform pg_advisory_xact_lock(hashtextextended('campaign_giftbox_pool:' || p_campaign, 0));

  -- 1. A reward-only item with exactly the same brand + name becomes the sheet product's row.
  with g as (
    select gp.id, nullif(left(btrim(gp.brand), 80), '') as brand, left(btrim(gp.name), 160) as name
    from public.giftbox_products gp
    where not exists (select 1 from public.reward_products rp where rp.campaign_id = p_campaign and rp.giftbox_product_id = gp.id)
  )
  update public.reward_products rp
     set giftbox_product_id = g.id, updated_at = now()
    from g
   where rp.campaign_id = p_campaign
     and rp.product_id is null
     and rp.giftbox_product_id is null
     and g.brand is not null
     and lower(rp.brand) = lower(g.brand)
     and lower(rp.name) = lower(g.name);
  get diagnostics v_adopted = row_count;

  -- 2. New rows for shown sheet products that have none yet. A brand + name that
  --    clashes with another row is skipped rather than failing the sync.
  insert into public.reward_products (campaign_id, giftbox_product_id, name, brand, category, image_url, product_url, inventory_total, is_active)
  select p_campaign, gp.id,
         left(btrim(gp.name), 160),
         coalesce(nullif(left(btrim(gp.brand), 80), ''), 'ayna'),
         nullif(left(btrim(gp.category), 40), ''),
         case when gp.image_url ~ '^https://' then gp.image_url end,
         case when gp.product_url ~ '^https://' then gp.product_url end,
         gp.max_per_order,
         true
    from public.giftbox_products gp
   where gp.is_active
     and not exists (select 1 from public.reward_products rp where rp.campaign_id = p_campaign and rp.giftbox_product_id = gp.id)
  on conflict do nothing;
  get diagnostics v_added = row_count;

  -- 3. Linked rows follow the sheet.
  update public.reward_products rp
     set name = left(btrim(gp.name), 160),
         brand = coalesce(nullif(left(btrim(gp.brand), 80), ''), 'ayna'),
         category = nullif(left(btrim(gp.category), 40), ''),
         image_url = case when gp.image_url ~ '^https://' then gp.image_url end,
         product_url = case when gp.product_url ~ '^https://' then gp.product_url end,
         inventory_total = greatest(rp.inventory_claimed, gp.max_per_order),
         is_active = gp.is_active,
         updated_at = now()
    from public.giftbox_products gp
   where rp.campaign_id = p_campaign
     and rp.giftbox_product_id = gp.id
     and (rp.name is distinct from left(btrim(gp.name), 160)
       or rp.brand is distinct from coalesce(nullif(left(btrim(gp.brand), 80), ''), 'ayna')
       or rp.category is distinct from nullif(left(btrim(gp.category), 40), '')
       or rp.image_url is distinct from case when gp.image_url ~ '^https://' then gp.image_url end
       or rp.product_url is distinct from case when gp.product_url ~ '^https://' then gp.product_url end
       or rp.inventory_total is distinct from greatest(rp.inventory_claimed, gp.max_per_order)
       or rp.is_active is distinct from gp.is_active);
  get diagnostics v_updated = row_count;

  -- 4. Anything not from the sheet (old PR haul / Vinted rows, catalog products,
  --    a row whose gift box product was deleted) leaves the spinner.
  update public.reward_products rp
     set is_active = false, updated_at = now()
   where rp.campaign_id = p_campaign
     and rp.is_active
     and (rp.giftbox_product_id is null
       or not exists (select 1 from public.giftbox_products gp where gp.id = rp.giftbox_product_id));
  get diagnostics v_off = row_count;

  return jsonb_build_object(
    'ok', true,
    'adopted', v_adopted,
    'added', v_added,
    'updated', v_updated,
    'switchedOff', v_off,
    'inPool', (select count(*) from public.campaign_available_products(p_campaign))
  );
end
$$;

-- The Vinted listing recount must not fight the sheet over a sheet product's units.
do $$
begin
  if to_regclass('public.reward_vinted_listings') is not null then
    execute $f$
      create or replace function public.campaign_vinted_recount(p_campaign text)
      returns void
      language sql
      volatile
      security definer
      set search_path = public
      as $body$
        update public.reward_products rp
           set inventory_total = rp.inventory_claimed + coalesce((
                 select count(*) from public.reward_vinted_listings l
                  where l.reward_product_id = rp.id and l.status = 'available' and l.claim_id is null), 0),
               updated_at = now()
         where rp.campaign_id = p_campaign
           and rp.giftbox_product_id is null
           and exists (select 1 from public.reward_vinted_listings l where l.reward_product_id = rp.id)
           and rp.inventory_total is distinct from rp.inventory_claimed + coalesce((
                 select count(*) from public.reward_vinted_listings l
                  where l.reward_product_id = rp.id and l.status = 'available' and l.claim_id is null), 0);
      $body$
    $f$;
  end if;
end $$;

-- ── Admin test spin ──────────────────────────────────────────────────────────
-- Picks like campaign_spin (something not landed on yet when possible), but
-- saves nothing and never touches inventory. p_exclude: reward product ids the
-- tester already landed on in this test.

create or replace function public.campaign_admin_test_spin(p_campaign text, p_exclude uuid[] default '{}')
returns jsonb
language sql
volatile
security definer
set search_path = public
as $$
  select public.campaign_product_json(a.id)
  from public.campaign_available_products(p_campaign) a
  order by (a.id = any(coalesce(p_exclude, '{}'::uuid[]))), random()
  limit 1
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'campaign_sync_giftbox_pool(text)',
    'campaign_admin_test_spin(text, uuid[])'
  ]
  loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

-- ── Turn it on ───────────────────────────────────────────────────────────────
update public.reward_campaigns
   set pool_source = 'giftbox', max_spins = 3, updated_at = now()
 where id = 'free-product-2026';

select public.campaign_sync_giftbox_pool('free-product-2026');
