-- Supersedes 2026-09-22_honeypot_herbal_pads_ayna_summary.sql — do NOT run
-- that file after this one (or if you already ran it, run this to correct
-- it).
--
-- That earlier migration folded a balanced caveat into `effectiveness` by
-- hand, as a one-off fix for this single product. This repo has since
-- shipped the general fix: ProductModal.jsx's ayna Summary card now pulls
-- `safety.opinionAlerts` in automatically for every product whenever it
-- isn't already covered by a flagged-recall safety banner (see
-- src/utils/productSafetyAlert.js). Honey Pot Herbal Pads' opinionAlerts
-- (set by the 2026-09-20 evidence migration) already carries this same
-- caveat, so leaving the hand-edited `effectiveness` text in place would
-- just duplicate it in the same card. This reverts `effectiveness` to its
-- original, non-redundant performance-only text.
--
-- Uses dollar-quoting, not '...' string literals, to avoid single-quote
-- escaping issues when this is copy/pasted through a chat client.
-- Idempotent: safe to re-run.

update public.product_catalog
set
  effectiveness = $eff$Good absorption with added herbal comfort. Many users report cramp relief from cooling herbs.$eff$
where id = 'p-honeypot-pad';
