-- Deactivates "Flutter: Chronic Pain Management" (d-flutter) per explicit
-- request 2026-09-16 — removed from src/data/productsExtended2.js. Nothing
-- here is deleted, matching the convention in deactivate_unverifiable_products.sql:
-- inactive, pending review, recoverable later if needed.
update product_catalog
set is_active = false, review_status = 'pending'
where id = 'd-flutter';
