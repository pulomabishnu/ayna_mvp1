/**
 * ayna brand partners: the single source of truth for who is a partner and
 * how their products are bought. Signing a brand = add a row here (and the
 * matching row in public.commerce_partners, see supabase/commerce_engine.sql);
 * no routing code changes.
 *
 * Partner status is used ONLY for (1) the partner badge/disclosure, (2) the
 * non-personalized Browse ordering, and (3) commerce routing (partner route
 * before Amazon). It is never a personalized-recommendation signal.
 *
 * Fields
 *   name        display name (Our brand partners strip)
 *   match       word-boundary pattern(s) matched against "<brand> <name>",
 *               lowercased. Kept as strings so this file is plain data.
 *   since       date the partnership was contracted
 *   prelaunch   waitlist only, no purchase yet
 *   route       how a partner product link earns ayna credit:
 *                 { type: 'ref_param', hosts, param, value } adds a query
 *                 parameter on the partner's own site (works on any page, so
 *                 an exact size link keeps credit);
 *                 { type: 'per_product_link' } the product's affiliateUrl
 *                 (ShopMy, Shopify Collabs, Impact, the brand's own link);
 *                 { type: 'brand_page' } no tracked link supplied yet.
 *   managedCheckout  null until a wholesale/dropship/written agreement exists:
 *               { type: 'wholesale'|'dropship'|'written_permission',
 *                 reference: '<contract id/link>', approvedAt: 'YYYY-MM-DD',
 *                 allowsPurchasingProvider: false }
 *
 * Order = explicit display priority (2026-09-16), unranked partners last.
 * History lives in git; see the comments in src/utils/partnerBrands.js.
 */
export const BRAND_PARTNERS = [
  { name: 'BUNI', match: ['buni'], since: '2026-09-11', route: { type: 'ref_param', hosts: ['bunibody.com'], param: 'ref', value: 'oxaevspm' }, managedCheckout: null },
  { name: 'SootheHer', match: ['soothe ?her'], since: '2026-09-23', route: { type: 'per_product_link' }, managedCheckout: null },
  { name: 'Neycher', match: ['neycher'], since: '2026-08-25', route: { type: 'per_product_link' }, managedCheckout: null },
  { name: 'Winx Health', match: ['winx'], since: '2026-09-23', route: { type: 'brand_page' }, managedCheckout: null },
  { name: 'gina', match: ['gina'], since: '2026-09-23', route: { type: 'brand_page' }, managedCheckout: null },
  { name: 'Elitone', match: ['elitone'], since: '2026-09-07', route: { type: 'ref_param', hosts: ['elitone.com'], param: 'af', value: 'aynahealth' }, managedCheckout: null },
  { name: 'Proov', match: ['proov'], since: '2026-09-07', route: { type: 'per_product_link' }, managedCheckout: null },
  { name: 'VIO2', match: ['vio2'], since: '2026-09-07', route: { type: 'per_product_link' }, managedCheckout: null },
  { name: 'My Pelvic Bra', match: ['my pelvic bra'], since: '2026-09-07', route: { type: 'per_product_link' }, managedCheckout: null },
  { name: 'Connect Pelvic Floor Fitness', match: ['connect pelvic floor fitness'], since: '2026-08-27', route: { type: 'per_product_link' }, managedCheckout: null },
  { name: 'LOLA', match: ['lola'], since: '2026-09-23', route: { type: 'brand_page' }, managedCheckout: null },
  { name: 'LiM Method', match: ['lim method'], since: '2026-09-11', route: { type: 'ref_param', hosts: ['limmethod.com'], param: 'ref', value: 'Ayna_Health' }, managedCheckout: null },
  { name: 'Rèsa', match: ['r[eè]sa'], since: '2026-10-05', prelaunch: true, route: { type: 'brand_page' }, managedCheckout: null },
];

const toRegex = (p) => new RegExp(`\\b${p}\\b`);

/** Compiled once; index = display priority. */
export const PARTNER_MATCHERS = BRAND_PARTNERS.map((partner) => ({ partner, patterns: partner.match.map(toRegex) }));

export function findBrandPartner(item) {
  const text = `${item?.brand || ''} ${item?.name || ''}`.toLowerCase();
  const hit = PARTNER_MATCHERS.find(({ patterns }) => patterns.some((re) => re.test(text)));
  return hit ? hit.partner : null;
}
