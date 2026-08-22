/**
 * Brand partners are pinned to the top of Discovery's default (browsing) sort, and get an
 * "Ayna Partner" label in the product modal. Matched against brand+name, case-insensitively,
 * with word boundaries so e.g. "oboo" doesn't accidentally match inside an unrelated word.
 */
export const PARTNER_BRAND_PATTERNS = [/\bwinx(?:\s*health)?\b/, /\bneycher\b/, /\boboo\b/, /\blola\b/];

export function isPartnerBrandItem(item) {
  const text = `${item?.brand || ''} ${item?.name || ''}`.toLowerCase();
  return PARTNER_BRAND_PATTERNS.some((re) => re.test(text));
}
