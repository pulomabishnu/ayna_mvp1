-- Turns off live catalog rows for products that no longer exist (checked
-- 2026-10-02). Idempotent: safe to re-run. Rows are kept, just hidden.
--
-- d-menolabs: MenoLife by MenoLabs is no longer on the US App Store.
-- p-neycher-botanical-vulva-balm: Neycher no longer sells this balm (it isn't
--   in helloneycher.com's product list), and its old link goes to a parked
--   domain. It was dropped from the bundled catalog on 2026-09-05, but the
--   live row stayed active.
update public.product_catalog
set is_active = false
where id in ('d-menolabs', 'p-neycher-botanical-vulva-balm');

-- Text corrections found in the same audit (exact-phrase replacements, so
-- re-running changes nothing further).

-- Hers is a Hims & Hers Health, Inc. brand, not Ro's.
update public.product_catalog
set summary = 'The women''s brand of Hims & Hers Health, Inc. Online visits with licensed providers and prescription or over-the-counter treatments delivered, for concerns including sexual health, skin care, and mental health.'
where id = 'd-hers'
  and summary like 'Ro''s brand for women.%';

-- Inito has no 510(k) clearance (FDA-listed Class I, exempt).
update public.product_catalog
set effectiveness = replace(effectiveness, 'The device has FDA 510(k) clearance and is supported by', 'It is FDA-listed as a Class I device (exempt from premarket clearance) and is supported by')
where id = 'd-initio';

-- Menstrual cups and discs are Class II but exempt from 510(k); Nixit is
-- registered under that category with no clearance number.
update public.product_catalog
set effectiveness = replace(effectiveness, 'menstrual discs are FDA-cleared for up to 12 hours of wear', 'menstrual cups and discs are FDA-regulated Class II devices exempt from premarket clearance, typically labeled for up to 12 hours of wear')
where id = 'p-nixit';

-- Intimate Rose dilators are 510(k)-cleared (K231430, K241748); the "most
-- widely FDA-compliant" line was unsourced marketing language.
update public.product_catalog
set effectiveness = replace(effectiveness, 'holds FDA 510(k) clearance and is noted as the most widely FDA-compliant dilator brand,', 'holds FDA 510(k) clearance for its vaginal dilators (K231430, K241748),')
where id = 'p-intimate-rose';
