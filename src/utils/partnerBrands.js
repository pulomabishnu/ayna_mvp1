/**
 * Confirmed brand partners. Partner status is used only for browse-facing
 * partner labels/disclosures and general Browse promotion; it must never be
 * used as a personalized recommendation signal.
 *
 * Ordered by explicit display priority (requested 2026-09-16) — this is a
 * temporary manual order, not a final ranking; each brand's full catalog and
 * a real ranking are still to come. Index position = priority (0 = shown
 * first among partners). This list is now the single source of truth for
 * BOTH "is this a partner" (previously a separate PARTNER_BRAND_PATTERNS)
 * and what order partners sort in, so the two can't drift out of sync.
 *
 * The trailing entries after LOLA are confirmed partners the 2026-09-16
 * priority order didn't explicitly rank — they stay partners (still get the
 * "ayna Favorite" badge and the partner pin) but sort after the ranked ones,
 * in whichever order they'd otherwise fall.
 */
export const PARTNER_BRAND_ORDER = [
  /\bbuni\b/, // BUNI Body
  /\bsoothe ?her\b/, // SootheHer
  /\bneycher\b/, // Neycher
  /\bwinx\b/, // Winx Health
  /\bgina\b/, // gina
  /\belitone\b/, // Elitone (includes Elitone URGE)
  /\bproov\b/, // Proov
  /\bvio2\b/, // VIO2
  /\bmy pelvic bra\b/, // My Pelvic Bra
  /\bconnect pelvic floor fitness\b/, // Connect PFF
  /\blola\b/, // LOLA
  // Confirmed partners not given an explicit rank in the 2026-09-16 order —
  // sort after everything above.
  /\blim method\b/,
];

export function isPartnerBrandItem(item) {
  const text = `${item?.brand || ''} ${item?.name || ''}`.toLowerCase();
  return PARTNER_BRAND_ORDER.some((pattern) => pattern.test(text));
}

/**
 * @returns {number | null} the display-priority index for a partner item
 *   (0 = highest priority), or null if the item isn't a partner at all.
 */
export function getPartnerBrandRank(item) {
  const text = `${item?.brand || ''} ${item?.name || ''}`.toLowerCase();
  const idx = PARTNER_BRAND_ORDER.findIndex((pattern) => pattern.test(text));
  return idx === -1 ? null : idx;
}

const PARTNER_DISCLOSURE =
  'ayna has chosen to commercially partner with this brand after personally reviewing them, and ayna may earn a commission if you buy through their link. ayna Partners appear at the top of the Browse page only if you have personalization turned off. Partners do not and cannot influence which products ayna honestly curates for you.';

export function getPartnerDisclosureText() {
  return PARTNER_DISCLOSURE;
}
