/**
 * Brand partners are pinned to the top of Discovery's default (browsing) sort, and get an
 * "Ayna Partner" label in the product modal. Matched against brand+name, case-insensitively,
 * with word boundaries so e.g. "oboo" doesn't accidentally match inside an unrelated word.
 *
 * Emptied 2026-08-24, refilled 2026-08-25: Neycher signed a real, official partnership —
 * confirmed by Aditi. The other 3 brands that were here before the empty (winx, oboo, lola)
 * are still just in discussion, not re-added. Add a brand here only once its partnership is
 * actually contracted, not before.
 */
export const PARTNER_BRAND_PATTERNS = [/\bneycher\b/, /\bconnect pelvic floor fitness\b/];

export function isPartnerBrandItem(item) {
  const text = `${item?.brand || ''} ${item?.name || ''}`.toLowerCase();
  return PARTNER_BRAND_PATTERNS.some((re) => re.test(text));
}
