-- Fixes the default "ayna Summary" card for The Honey Pot Herbal Pads.
-- That card is built from summary + effectiveness only (see
-- src/components/ProductModal.jsx summarySentences) and, before this change,
-- both fields were purely positive/performance text -- so the first thing a
-- user saw read as unqualified praise even though this SAME product already
-- had a well-documented split-opinion pattern, a clinician caution, and
-- peer-reviewed literature on file (see the 2026-09-20 evidence migrations).
-- This folds that balance into `effectiveness`, the field that already feeds
-- both the summary card and the "Product notes" line in how-to-use content.
--
-- Uses dollar-quoting, not '...' string literals, to avoid single-quote
-- escaping issues when this is copy/pasted through a chat client.
-- Idempotent: safe to re-run.

update public.product_catalog
set
  effectiveness = $eff$Good absorption, and many users report cramp relief from the cooling herbs — but reviews are split, with a similar share finding the sensation too intense or irritating. Clinicians caution that vulvar skin is more permeable than skin elsewhere, so lavender and peppermint (this pad’s herbs) are more likely to cause allergic or irritant contact dermatitis here, a risk borne out in peer-reviewed dermatology literature and in a consumer-submitted FDA report describing a severe reaction to this pad. Consider a patch test.$eff$
where id = 'p-honeypot-pad';
