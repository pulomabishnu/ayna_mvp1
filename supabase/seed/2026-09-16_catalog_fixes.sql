-- Combined catalog fixes requested 2026-09-16. Run this whole file once in
-- the Supabase SQL Editor. Safe to re-run (idempotent).
--
-- SUPERSEDES the first version of this file: that version matched Yoni and
-- Innovo on `name ilike '%yoni%'/'%innovo%'`, which matched ZERO rows —
-- confirmed live via a read of the public /api/products endpoint on
-- 2026-09-16, both rows' `name` column is literally "Pelvic Floor Trainer"
-- (the exact generic-name bug fixed in api/discover-products.js /
-- api/search-suggestions.js this same session); "Yoni"/"Innovo" only live in
-- `brand`. Rewritten below to match by exact `id`, read from that same live
-- response, so this version is guaranteed to hit the right rows.
--
-- 1) Deactivate "Flutter: Chronic Pain Management" (d-flutter) — already
--    confirmed gone from the live catalog (this run's read-only check),
--    kept here only so this file stays a complete, safe-to-rerun record.
-- 2) Deactivate the AI-discovered "Yoni" (disc-yoni-pelvic-floor-trainer)
--    and "Innovo" (disc-innovo-pelvic-floor-trainer) listings. Both only
--    ever existed in product_catalog (id prefix 'disc-'), never in
--    src/data, so there's no source file for them.
-- 3) The AI-discovered "Squeezy" listing (disc-squeezy-pelvic-floor-
--    exerciser-with-app) already has the correct url (squeezyapp.com) as of
--    this read — no url fix needed after all. Its `name` was the same
--    generic-name bug ("Pelvic Floor Exerciser with App" instead of a real
--    product name), fixed here to "Squeezy Pelvic Floor App".
--
-- Nothing is deleted for (1)/(2) — matches the deactivate_unverifiable_products.sql
-- convention: inactive, pending review, recoverable later if a source is found.
--
-- Want to see current state before running? Uncomment and run first:
-- select id, name, brand, category, url, is_active, review_status from product_catalog
-- where id in ('d-flutter', 'disc-yoni-pelvic-floor-trainer', 'disc-innovo-pelvic-floor-trainer', 'disc-squeezy-pelvic-floor-exerciser-with-app');

-- 1) Flutter
update product_catalog
set is_active = false, review_status = 'pending'
where id = 'd-flutter';

-- 2) Yoni + Innovo
update product_catalog
set is_active = false, review_status = 'pending'
where id in ('disc-yoni-pelvic-floor-trainer', 'disc-innovo-pelvic-floor-trainer');

-- 3) Squeezy — fix generic name to the real app name
update product_catalog
set name = 'Squeezy Pelvic Floor App'
where id = 'disc-squeezy-pelvic-floor-exerciser-with-app';
