-- Follow-up catalog fixes 2026-09-16, found by scanning the whole live
-- catalog for the generic-name pattern (category label instead of a real
-- product name) after the Vella report. Verified each brand/product with a
-- live web check before deciding fix vs. deactivate:
--
-- 1) "Vella" (disc-vella-pelvic-floor-exerciser, $55-75, url
--    vellahealth.com) — vellahealth.com does not resolve (DNS failure) and
--    a web search turns up no real "Vella" pelvic floor product anywhere.
--    Deactivating: appears to be a fully hallucinated brand+product.
-- 2) "We-Vibe" pelvic floor exerciser (disc-we-vibe-pelvic-floor-exerciser,
--    $149, url we-vibe.com/products/we-vibe-kegel) — We-Vibe is a real
--    brand, but that product URL redirects to their general storefront;
--    We-Vibe doesn't make a pelvic floor exerciser. Deactivating: real
--    brand, fabricated product (the exact anti-hallucination failure mode
--    the discovery prompt already warns against — "never combine a real
--    brand with a product it doesn't actually make").
-- 3) "Pelvic Partner" (disc-pelvic-partner-pelvic-partner-pelvic-floor-trainer,
--    $149-179, url pelvicpartner.com) — PelvicPartner is a real German
--    physiotherapy practice/training academy; they do not sell a device.
--    Same fabricated-product pattern as (2). Deactivating.
-- 4) "New Chapter Menopause Support" (disc-new-chapter-menopause-support,
--    $25-35, url newchapter.com/collections/menopause-supplements) — New
--    Chapter is real and does sell a menopause supplement, just not under
--    that generic name; their actual product is "Estrotone Menopause
--    Support" ($32/30-day). Fixing the name rather than deactivating, since
--    the brand+product is real, just misnamed by the same generic-name bug.
--
-- 5) "Minna Life | Smart Kegel Exerciser" (disc-minna-life-smart-kegel-
--    exerciser) — Minna Life is real and does make a biofeedback Kegel
--    device, but its actual product name is "kGoal", not "Smart Kegel
--    Exerciser" (generic-name bug again) — and this catalog already has
--    that exact product properly named as "kGoal Classic" (disc-kgoal-
--    kgoal-classic, brand kGoal). Deactivating as a duplicate rather than
--    renaming, to avoid creating two listings for the same device.
-- 6) "Intimate Rose | Vaginal Weights" (disc-intimate-rose-vaginal-weights)
--    — real brand and product, just not their exact product name (it's
--    marketed as "Kegel Weights"). Fixing the name.
--
-- Not touched here: "Lunapads Period Underwear" (disc-lunapads-lunapads-
-- period-underwear) is a different issue, not a name/hallucination bug —
-- Lunapads rebranded to Aisle in 2020 and was acquired by Somedays in 2024,
-- so the brand name itself is stale. Flagging for a separate decision
-- (rename to Aisle, or deactivate) rather than guessing here.

update product_catalog
set is_active = false, review_status = 'pending'
where id in (
  'disc-vella-pelvic-floor-exerciser',
  'disc-we-vibe-pelvic-floor-exerciser',
  'disc-pelvic-partner-pelvic-partner-pelvic-floor-trainer',
  'disc-minna-life-smart-kegel-exerciser'
);

update product_catalog
set name = 'New Chapter Estrotone Menopause Support'
where id = 'disc-new-chapter-menopause-support';

update product_catalog
set name = 'Intimate Rose Kegel Weights'
where id = 'disc-intimate-rose-vaginal-weights';
