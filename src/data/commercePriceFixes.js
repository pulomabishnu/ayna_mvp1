/**
 * Catalog price-text corrections from the 2026-10-15 commerce audit. Only
 * high-confidence fixes: exact product confirmed on the merchant's own site,
 * same pack/size, one-time (not subscription or first-order) price, and the
 * Buy button opens that same merchant. Amazon-routed products get no price
 * fixes (an Amazon price can only come from Creators API); Lansinoh's fix is
 * a count fix from ayna's own variant data.
 *
 * `from` guards the fix: it applies only while the catalog still says `from`,
 * so a later manual edit is never overwritten. Mirrored for the database in
 * supabase/seed/2026-10-15_commerce_price_text_fixes.sql.
 */
export const COMMERCE_PRICE_TEXT_FIXES = {
  'p-neycher-odor-be-gone': {
    from: '$29.97 (10 suppositories)', to: '$33.30 (10 suppositories)',
    evidence: 'helloneycher.com/product/odor-be-gone: one-time $33.30; $29.97 is the monthly subscription price',
  },
  'p-neycher-vaginal-moisturizer': {
    from: '$32.91', to: '$33.30 (10 suppositories)',
    evidence: 'helloneycher.com/product/vaginal-moisturizer: single box (10) one-time $33.30',
  },
  'p-neycher-hydrobloom-gel': {
    from: '$25.97', to: '$22.19',
    evidence: 'helloneycher.com/product/hydrobloom-moisturizing-gel: single box one-time $22.19',
  },
  'p-livlabs-pippa-starter-kit': {
    from: '$99.00', to: '$119.00',
    evidence: 'livlabsfitness.com/products/pippa-resistance-spring-starter-kit.json: single variant 119.00, no compare-at',
  },
  'p-sootheher-elaris-pod': {
    from: '$89.99 (list $120)', to: '$89.99',
    evidence: 'store (via the SootheHer Collabs link) shows $89.99 with no $120 list price',
  },
  'd-betterhelp': {
    from: '$65-90/week', to: '$70–100/week',
    evidence: 'betterhelp.com FAQ: membership ranges from $70 to $100 per week',
  },
  'd-tia': {
    from: 'Membership $15/month + insurance', to: 'Membership $25/month + insurance',
    evidence: 'asktia.com FAQ: Tia members pay $25/month or $240/year',
  },
  'p-lansinoh-pads': {
    from: '$12 for 60', to: '$12 for 100',
    evidence: 'Ayna variant data maps this Buy link (ASIN B0070SKP1O) to the 100-pad pack; lansinoh.com sells 100 pads at $11.99 (60 pads $8.99)',
  },
};

/**
 * Partner affiliate links that exist in the bundled catalog (src/data/brands.js)
 * but were missing from the live product_catalog rows on 2026-10-15, so those
 * Buy clicks earned no partner credit. Same product page, plus ayna's tracking.
 * Applied only when the row has no affiliateUrl of its own.
 */
export const COMMERCE_AFFILIATE_RESTORES = {
  'p-neycher-vaginal-moisturizer': 'https://helloneycher.com/product/vaginal-moisturizer?sca_ref=12276038.vwBYOKCYa7&utm_source=affiliate&utm_medium=socialmedia&utm_campaign=affiliate',
  'p-neycher-odor-be-gone': 'https://helloneycher.com/product/odor-be-gone?sca_ref=12276038.vwBYOKCYa7&utm_source=affiliate&utm_medium=socialmedia&utm_campaign=affiliate',
  'p-neycher-hydrobloom-gel': 'https://helloneycher.com/product/hydrobloom-moisturizing-gel?sca_ref=12276038.vwBYOKCYa7&utm_source=affiliate&utm_medium=socialmedia&utm_campaign=affiliate',
};

export function applyCommercePriceFix(product) {
  if (!product) return product;
  let out = product;
  const restore = COMMERCE_AFFILIATE_RESTORES[product.id];
  if (restore && !product.affiliateUrl) out = { ...out, affiliateUrl: restore };
  const fix = COMMERCE_PRICE_TEXT_FIXES[product.id];
  if (fix && String(out.price || '').trim() === fix.from) out = { ...out, price: fix.to };
  return out;
}
