-- Combined catalog fixes requested 2026-09-16. Run this whole file once in
-- the Supabase SQL Editor. Safe to re-run (idempotent).
--
-- 1) Deactivate "Flutter: Chronic Pain Management" (d-flutter) — removed
--    from src/data/productsExtended2.js.
-- 2) Deactivate the AI-discovered "Yoni Egg" and "Innovo" listings — these
--    only ever existed in product_catalog (id prefix 'disc-'), never in
--    src/data, so there's no source file for them.
-- 3) Fix the AI-discovered "Squeezy" listing's official/Buy Now link to the
--    real official site and re-approve it.
--
-- Nothing is deleted for (1)/(2) — matches the deactivate_unverifiable_products.sql
-- convention: inactive, pending review, recoverable later if a source is found.
--
-- Want to see what each step will touch before running it? Uncomment the
-- matching select below and run it first:
-- select id, name, category, is_active, review_status from product_catalog where id = 'd-flutter';
-- select id, name, category, is_active, review_status from product_catalog where name ilike '%yoni%' or name ilike '%innovo%';
-- select id, name, url, where_to_buy, is_active, review_status from product_catalog where name ilike '%squeezy%';

-- 1) Flutter
update product_catalog
set is_active = false, review_status = 'pending'
where id = 'd-flutter';

-- 2) Yoni Egg + Innovo
update product_catalog
set is_active = false, review_status = 'pending'
where name ilike '%yoni%' or name ilike '%innovo%';

-- 3) Squeezy — fix broken link, re-approve
update product_catalog
set
  url = 'https://squeezyapp.com/',
  where_to_buy = '["Brand site"]'::jsonb,
  is_active = true,
  review_status = 'approved'
where name ilike '%squeezy%';
