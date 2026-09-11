/**
 * Brand partners are pinned to the top of Discovery's default (browsing) sort, and get an
 * "Ayna Partner" label in the product modal. Matched against brand+name, case-insensitively,
 * with word boundaries so e.g. "oboo" doesn't accidentally match inside an unrelated word.
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
 */
export const PARTNER_BRAND_PATTERNS = [/\bneycher\b/, /\bconnect pelvic floor fitness\b/, /\bvio2\b/, /\bproov\b/, /\belitone\b/, /\bmy pelvic bra\b/, /\bbuni\b/];

export function isPartnerBrandItem(item) {
  const text = `${item?.brand || ''} ${item?.name || ''}`.toLowerCase();
  return PARTNER_BRAND_PATTERNS.some((re) => re.test(text));
}

// Brands where "personally spoken with" would overstate how the partnership
// was vetted — these get the softer "personally vetted" phrasing instead.
// Per user direction 2026-09-07 for Connect Pelvic Floor Fitness and My
// Pelvic Bra specifically; every other partner brand keeps the default text.
const VETTED_ONLY_PATTERNS = [/\bconnect pelvic floor fitness\b/, /\bmy pelvic bra\b/];

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
