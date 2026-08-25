-- Deactivates 3 products that could not be verified as real, purchasable
-- items during the 2026-08-24 Buy Now audit — found while trying to source
-- a working Buy Now link for each after their prior link was removed as
-- dead/dangerous.
--
--   - Biotics Research "Women's Essentials": Biotics Research is a real
--     supplement brand, but this exact product is not in their current
--     10-product "Female" category lineup (BioDoph-Fem, Equi-Fem,
--     Cytozyme-F, Hormone Balance & Protect, ... checked live). Looks
--     invented under a real brand name.
--   - Sensatone "Digital Compact Pelvic Floor Stimulator": no working
--     domain found (5 variants tried), and zero results for the brand name
--     "Sensatone" in an Amazon search for pelvic floor stimulators.
--   - Pause Well-Aging "Fascia Stimulating Tool": same — not found on
--     Amazon under "Pause" or "Well-Aging"; its brand domain
--     (pausewellaging.com) has separately expired and now redirects to a
--     gambling site (fixed earlier this session by clearing its dead
--     whereToBuy entry — this goes further and deactivates the listing
--     itself). Already flagged as unverifiable in an earlier pass (no live
--     image sourced either) but left active rather than pulled.
--
-- None of the three carry discovery_meta, suggesting they predate the
-- current discovery pipeline's search-grounding + recall-check + pending-
-- review safety gate entirely.
--
-- Sets the same safe state anything unverified gets today: inactive,
-- pending human review. Nothing here is deleted — a human can still
-- confirm and re-approve any of these later via
-- scripts/review-discovered-products.mjs if a real source is found.
update product_catalog
set is_active = false, review_status = 'pending'
where id in (
  'disc-biotics-research-biotics-research-women-s-essentials',
  'disc-sensatone-sensatone-digital-compact-pelvic-floor-stimulator',
  'p-pause-serum'
);
