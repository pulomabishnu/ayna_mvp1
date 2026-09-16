-- Deactivates the AI-discovered "Yoni Egg" and "Innovo" pelvic-floor listings
-- per explicit request 2026-09-16. Neither is a curated src/data product —
-- both were generated at runtime by the /api/search-suggestions discovery
-- pipeline and persisted into product_catalog (id prefix 'disc-'), so there
-- is no source file to edit; this is the only place they exist.
--
-- Matched by name (not a hardcoded id) since this script can't query the
-- live table to confirm exact ids/duplicates before running. Review the
-- SELECT output before the UPDATE if you want to confirm which rows match.
--
-- Matches the deactivate_unverifiable_products.sql / deactivate_flutter.sql
-- convention: nothing is deleted, just set inactive and pending review.

-- Run this first to see what will be affected:
-- select id, name, category, is_active from product_catalog
-- where name ilike '%yoni%' or name ilike '%innovo%';

update product_catalog
set is_active = false, review_status = 'pending'
where name ilike '%yoni%' or name ilike '%innovo%';
