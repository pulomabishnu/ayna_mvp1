-- Full-catalog follow-up to the pelvic-floor review, 2026-09-16. Manually
-- read all 148 live AI-discovered listings (not just an exact-label regex
-- match) across every category, then verified anything suspicious with a
-- live web check before deciding fix vs. deactivate. Two failure patterns
-- found outside pelvic-floor:
--
-- FABRICATED / UNVERIFIABLE:
-- 1) "Vitex | Menstrual Cramp Relief Supplement" (disc-vitex-menstrual-
--    cramp-relief-supplement) — "Vitex" is an herb (chasteberry), not a
--    company; no real brand called Vitex sells this. The catalog already
--    correctly carries this ingredient under its real seller twice
--    (p-vitex "Gaia Herbs Vitex Berry", disc-gaia-herbs-vitex-chasteberry-
--    supplement) — this row invented a company out of the ingredient name.
--    Deactivating.
-- 2) "Gaia Herbs | Women's Hormone Balance Tea" (disc-gaia-herbs-women-s-
--    hormone-balance-tea) — Gaia Herbs sells capsules/liquid phyto-caps for
--    this (e.g. "Menopause Support Daytime", "Vitex Berry"), not tea; no
--    matching tea product found. Deactivating.
-- 3) "Traditional Medicinals | Women's Hormone Balance Tea"
--    (disc-traditional-medicinals-women-s-hormone-balance-tea) — Traditional
--    Medicinals is a real tea company, but no product under this exact name
--    could be confirmed. Deactivating rather than guessing at a real name.
--
-- DUPLICATES (same underlying product listed twice, once under a real name
-- and once under a generic descriptor — keeping the properly-named row):
-- 4) MaryRuth Organics Women's Multivitamin Liquid — keeping
--    disc-maryruth-organics-maryruth-organics-women-s-multivitamin-liquid,
--    deactivating disc-maryruth-organics-women-s-multivitamin-liquid.
-- 5) Ovira wearable period pain relief — keeping
--    disc-ovira-ovira-wearable-period-pain-relief, deactivating
--    disc-ovira-wearable-period-pain-relief-device.
-- 6) Thorne Berberine — keeping disc-thorne-berberine-500-mg (the real
--    product is "Berberine-500"), deactivating disc-thorne-berberine.
-- 7) Thorne NAC — keeping disc-thorne-nac-n-acetyl-cysteine-600-mg,
--    deactivating disc-thorne-nac-n-acetyl-cysteine.
-- 8) Vital Proteins Collagen Peptides — keeping the more complete
--    disc-vital-proteins-women-s-collagen-peptides-powder, deactivating
--    disc-vital-proteins-women-s-collagen-peptides.
-- 9) "Pamprin | Period Pain Relief Tablets" (disc-pamprin-period-pain-
--    relief-tablets) — likely the same product as the properly-named
--    disc-pamprin-pamprin-max, but I could not fully confirm they're
--    identical SKUs (Pamprin sells more than one formula). Lower confidence
--    than 4-8 above; deactivating as an unverified generic name rather than
--    a certain duplicate.
--
-- RENAME (real brand + real product, generic name):
-- 10) "Wise Woman Herbals | Menopause Support Supplement"
--     (disc-wise-woman-herbals-menopause-support-supplement) — their actual
--     flagship menopause product is "Women's Menocaps". Renaming.
--
-- NOT independently re-verified: the remaining ~125 discovered listings
-- (Tampax, LELO, Knix, Thinx, Centrum, OLLY, Thorne's other products,
-- Vital Proteins Powder, Womanizer, We-Vibe Chorus, Boppy, Tempur-Pedic,
-- etc.) are mainstream brands with names that match their real product
-- lines on inspection — high confidence, but not each individually
-- web-verified the way the flagged items above were.

update product_catalog
set is_active = false, review_status = 'pending'
where id in (
  'disc-vitex-menstrual-cramp-relief-supplement',
  'disc-gaia-herbs-women-s-hormone-balance-tea',
  'disc-traditional-medicinals-women-s-hormone-balance-tea',
  'disc-maryruth-organics-women-s-multivitamin-liquid',
  'disc-ovira-wearable-period-pain-relief-device',
  'disc-thorne-berberine',
  'disc-thorne-nac-n-acetyl-cysteine',
  'disc-vital-proteins-women-s-collagen-peptides',
  'disc-pamprin-period-pain-relief-tablets'
);

update product_catalog
set name = 'Wise Woman Herbals Women''s Menocaps'
where id = 'disc-wise-woman-herbals-menopause-support-supplement';
