/**
 * Brand partners are pinned to the top of Discovery's default (browsing) sort, and get an
 * "Ayna Partner" label in the product modal. Matched against brand+name, case-insensitively,
 * with word boundaries so e.g. "oboo" doesn't accidentally match inside an unrelated word.
 *
 * Emptied 2026-08-24: none of these are signed, official partnerships — they were all still
 * in discussion — so neither the label nor the ranking pin has a real basis right now. Refill
 * this list (brand by brand) once a partnership is actually contracted, not before.
 */
export const PARTNER_BRAND_PATTERNS = [];

export function isPartnerBrandItem(item) {
  const text = `${item?.brand || ''} ${item?.name || ''}`.toLowerCase();
  return PARTNER_BRAND_PATTERNS.some((re) => re.test(text));
}
