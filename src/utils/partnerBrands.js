/**
 * Confirmed brand partners. Partner status is used only for browse-facing
 * partner labels/disclosures and general Browse promotion; it must never be
 * used as a personalized recommendation signal.
 */
export const PARTNER_BRAND_PATTERNS = [
  /\bneycher\b/,
  /\bconnect pelvic floor fitness\b/,
  /\bvio2\b/,
  /\bproov\b/,
  /\belitone\b/,
  /\bmy pelvic bra\b/,
  /\bbuni\b/,
  /\blim method\b/,
];

export function isPartnerBrandItem(item) {
  const text = `${item?.brand || ''} ${item?.name || ''}`.toLowerCase();
  return PARTNER_BRAND_PATTERNS.some((pattern) => pattern.test(text));
}

const PARTNER_DISCLOSURE =
  'ayna has a commercial partnership with this brand and may earn a commission if you buy through our link. Partner status can affect placement in general Browse, but it never changes personalized match scores or personalized recommendation order.';

export function getPartnerDisclosureText() {
  return PARTNER_DISCLOSURE;
}
