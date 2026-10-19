/**
 * Partnership history. Brand partners are recognized here for partner/favorite labels and product-page disclosures.
 * Partnership status must not be used as a personalized recommendation signal.
 * Matched against brand+name, case-insensitively, with word boundaries so e.g. "oboo"
 * doesn't accidentally match inside an unrelated word.
 *
 * Emptied 2026-08-24, refilled 2026-08-25: Neycher signed a real, official partnership
 * confirmed by Aditi. The other 3 brands that were here before the empty (winx, oboo, lola)
 * are still just in discussion, not re-added. Add a brand here only once its partnership is
 * actually contracted, not before.
 *
 * Added 2026-08-27: Connect Pelvic Floor Fitness, confirmed affiliate partnership.
 *
 * Added 2026-09-07: VIO2, confirmed affiliate partnership.
 *
 * Added 2026-09-07: Proov, confirmed affiliate partnership.
 *
 * Added 2026-09-07: Elitone, confirmed affiliate partnership.
 *
 * Added 2026-09-07: My Pelvic Bra, confirmed affiliate partnership.
 *
 * Added 2026-09-11: BUNI, confirmed brand partnership. Direct brand
 * affiliate link pending; current product purchase links use Amazon Associates.
 *
 * Added 2026-09-11: LiM Method, confirmed affiliate partnership. Ayna affiliate
 * links use the ref=Ayna_Health parameter supplied by the partnership team.
 *
 * Added 2026-09-23: Winx Health, SootheHer, gina, confirmed brand partnerships.
 *
 * Added 2026-09-23: LOLA, confirmed affiliate partnership (was still "in
 * discussion" per the note above as of 2026-08-25; contracted since).
 *
 * Liv Labs (Pippa Resistance Spring), NOT a confirmed partner. Its two
 * products stay in the catalog (src/data/brands.js) so they still surface
 * in Discovery/search, but deliberately left out of this allowlist (no
 * "ayna Partner" badge) until a partnership is actually contracted. Distinct
 * from LiM Method above despite the similar name, different company
 * (livlabsfitness.com vs. limmethod.com).
 *
 * Added 2026-10-05: Rèsa, confirmed pre-launch partnership.
 *
 * Confirmed brand partners. Partner status is used only for browse-facing
 * partner labels/disclosures and general Browse promotion; it must never be
 * used as a personalized recommendation signal.
 *
 * Ordered by explicit display priority (set by the team 2026-10-17; the
 * Brand Partnerships page in src/components/BrandPartners.jsx uses the same
 * order). Index position = priority (0 = shown first among partners). This
 * list is the single source of truth for BOTH "is this a partner" and what
 * order partners sort in, so the two can't drift out of sync.
 *
 * The team's order also has GoodCycle (DailyBasis, 10th) and Cool Comforts
 * (VPod, 17th, hidden). They aren't on the site yet, so they're left out
 * until their products are added; slot them back in at those positions then.
 */
export const PARTNER_BRAND_ORDER = [
  // Rèsa (2026-10-05), pre-launch; see PRELAUNCH_PARTNER_PATTERNS below.
  // First "for now" at Eliz's request (2026-10-17), ahead of the team's list.
  /\br[eè]sa\b/,
  /\bbuni\b/, // BUNI Body
  /\blim method\b/, // LiM Method
  /\bwinx\b/, // Winx Health
  /\bmomotaro\b/, // Momotaro Apotheca (partner from 2026-10-17)
  /\bneycher\b/, // Neycher
  /\bsoothe ?her\b/, // SootheHer
  /\balubri\b/, // Alubri (partner from 2026-10-17)
  /\bconnect pelvic floor fitness\b/, // Connect Pelvic Floor Fitness
  /\belitone\b/, // Elitone (includes Elitone URGE)
  /\blola\b/, // LOLA
  /\bproov\b/, // Proov
  /\bgina\b/, // gina
  /\btampon tribe\b/, // Tampon Tribe (partner from 2026-10-17)
  /\bmy pelvic bra\b/, // My Pelvic Bra
  /\bvio2\b/, // VIO2
];

/** Back-compat alias: the redesign's components/tests import this name. */
export const PARTNER_BRAND_PATTERNS = PARTNER_BRAND_ORDER;

/**
 * Display names for the contracted partners above, in the same order, each
 * paired with its matching pattern. Used by the "Our brand partners" strip
 * (src/components/PartnerStrip.jsx). Keep in sync with PARTNER_BRAND_ORDER.
 * Add a brand only once its partnership is actually contracted.
 */
export const PARTNER_BRANDS = [
  'Rèsa', 'BUNI', 'LiM Method', 'Winx Health', 'Momotaro Apotheca', 'Neycher', 'SootheHer', 'Alubri',
  'Connect Pelvic Floor Fitness', 'Elitone', 'LOLA', 'Proov', 'gina', 'Tampon Tribe',
  'My Pelvic Bra', 'VIO2',
].map((name, i) => ({ name, pattern: PARTNER_BRAND_ORDER[i] }));

/**
 * Partners whose product hasn't launched yet. Users can only join a waitlist
 * (Rèsa: a $9.90 early deposit), so these get a visually distinct
 * "ayna Favorite · Waitlist" badge and a no-commission disclosure. A catalog
 * entry can also opt in with `prelaunch: true`.
 */
export const PRELAUNCH_PARTNER_PATTERNS = [
  /\br[eè]sa\b/,
];

export function isPrelaunchPartnerItem(item) {
  if (!isPartnerBrandItem(item)) return false;
  if (item?.prelaunch) return true;
  const text = `${item?.brand || ''} ${item?.name || ''}`.toLowerCase();
  return PRELAUNCH_PARTNER_PATTERNS.some((pattern) => pattern.test(text));
}

/** Browse badge text for a partner item. */
export function getPartnerBadgeLabel(item) {
  return isPrelaunchPartnerItem(item) ? 'ayna partner · Waitlist' : 'ayna partner';
}

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

const PRELAUNCH_PARTNER_DISCLOSURE =
  'This brand is pre-launch, so this is a waitlist, not a purchase: the link takes you to reserve a spot with an early deposit. ayna has partnered with this brand after personally reviewing them, and ayna does not earn a commission on the deposit. Partners do not and cannot influence which products ayna honestly curates for you.';

export function getPartnerDisclosureText(item) {
  return isPrelaunchPartnerItem(item) ? PRELAUNCH_PARTNER_DISCLOSURE : PARTNER_DISCLOSURE;
}

/**
 * The only place partner brands may move up: the Shop / Browse grid, on its
 * default sort, with no text search, while personalization is off. Partners
 * never change match scores, "For you" picks, search results, the AI picks or
 * the chatbot. Website (Discovery.jsx) and app (BrowseScreen.jsx) both ask
 * this, so the rule can't drift between them.
 */
export function partnerBoostAllowed({ personalized = false, hasQuery = false, sort = 'default' } = {}) {
  return sort === 'default' && !hasQuery && !personalized;
}
