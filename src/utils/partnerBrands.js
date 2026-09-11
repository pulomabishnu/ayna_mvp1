/**
 * Brand partners are recognized here for partner/favorite labels and product-page disclosures.
 * Partnership status must not be used as a personalized recommendation signal.
 * Matched against brand+name, case-insensitively, with word boundaries so e.g. "oboo"
 * doesn't accidentally match inside an unrelated word.
 *
 * Emptied 2026-08-24, refilled 2026-08-25: Neycher signed a real, official partnership —
 * confirmed by Aditi. The other 3 brands that were here before the empty (winx, oboo, lola)
 * are still just in discussion, not re-added. Add a brand here only once its partnership is
 * actually contracted, not before.
 *
 * Added 2026-08-27: Connect Pelvic Floor Fitness — confirmed affiliate partnership.
 *
 * Added 2026-09-07: VIO2 — confirmed affiliate partnership.
 *
 * Added 2026-09-07: Proov — confirmed affiliate partnership.
 *
 * Added 2026-09-07: Elitone — confirmed affiliate partnership.
 *
 * Added 2026-09-07: My Pelvic Bra — confirmed affiliate partnership.
 *
 * Added 2026-09-11: BUNI — confirmed brand partnership. Direct brand
 * affiliate link pending; current product purchase links use Amazon Associates.
 *
 * Added 2026-09-11: LiM Method — confirmed affiliate partnership. Ayna affiliate
 * links use the ref=Ayna_Health parameter supplied by the partnership team.
 */
export const PARTNER_BRAND_PATTERNS = [/\bneycher\b/, /\bconnect pelvic floor fitness\b/, /\bvio2\b/, /\bproov\b/, /\belitone\b/, /\bmy pelvic bra\b/, /\bbuni\b/, /\blim method\b/];

export function isPartnerBrandItem(item) {
  const text = `${item?.brand || ''} ${item?.name || ''}`.toLowerCase();
  return PARTNER_BRAND_PATTERNS.some((re) => re.test(text));
}

// Brands where "personally spoken with" would overstate how the partnership
// was vetted — these get the softer "personally vetted" phrasing instead.
const VETTED_ONLY_PATTERNS = [/\bconnect pelvic floor fitness\b/, /\bmy pelvic bra\b/, /\blim method\b/];

const DEFAULT_PARTNER_DISCLOSURE =
  "ayna has personally spoken with this brand and vetted their claims. We earn commission on purchases, and encourage buying through ayna to support women-owned businesses.";
const VETTED_ONLY_DISCLOSURE =
  "ayna has personally vetted this brand's claims. We earn commission on purchases, and encourage buying through ayna to support women-owned businesses.";

/** The disclosure sentence shown next to the "ayna Partner" pill for a given product. */
export function getPartnerDisclosureText(item) {
  const text = `${item?.brand || ''} ${item?.name || ''}`.toLowerCase();
  return VETTED_ONLY_PATTERNS.some((re) => re.test(text))
    ? VETTED_ONLY_DISCLOSURE
    : DEFAULT_PARTNER_DISCLOSURE;
}
