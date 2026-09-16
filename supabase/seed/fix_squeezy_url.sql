-- Fixes the "Squeezy" pelvic-floor app listing's official/Buy Now link per
-- explicit request 2026-09-16: https://squeezyapp.com/
--
-- Like Yoni Egg and Innovo, this is an AI-discovered listing (id prefix
-- 'disc-') persisted directly into product_catalog by /api/search-suggestions
-- — there's no source file in src/data to edit, so this is the only place to
-- fix it. This environment has no read/write access to the live database, so
-- run this via the Supabase SQL Editor.
--
-- Run this first to see the current (broken) row before fixing it:
-- select id, name, url, where_to_buy, is_active, review_status
-- from product_catalog where name ilike '%squeezy%';

update product_catalog
set
  url = 'https://squeezyapp.com/',
  where_to_buy = '["Brand site"]'::jsonb,
  is_active = true,
  review_status = 'approved'
where name ilike '%squeezy%';
