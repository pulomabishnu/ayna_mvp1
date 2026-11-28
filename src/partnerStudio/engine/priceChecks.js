/*
 * Prices re-checked on each brand's own product page. The benchmark applies
 * these on top of the bundled catalog so Partner Studio never benchmarks a
 * brand at a price it no longer charges. The main catalog (src/data/brands.js)
 * should get the same correction; until then this list is the source of truth
 * for Partner Studio runs. One-time price only: subscription prices are noted
 * but never used, because a shopper's budget is matched on the one-time price.
 */
export const PRICE_CHECKED = '2026-11-28';

export const PRICE_CHECKS = {
  'p-goodcycle-dailybasis': { price: '$45 (14 Replenish + 14 Balance stick packs; $80 list); $35 if you subscribe', url: 'https://takegoodcycle.com/products/daily-basis', was: '$80' },
  'p-neycher-vaginal-moisturizer': { price: '$35.97 (10 suppositories); $31.65 a month if you subscribe', url: 'https://helloneycher.com/products/vaginal-moisturizer', was: '$32.91' },
  'p-neycher-odor-be-gone': { price: '$35.97 (10 suppositories); $31.65 a month if you subscribe', url: 'https://helloneycher.com/products/odor-be-gone', was: '$29.97' },
  'p-buni-rejuvenate-vulva-balm': { price: '$42.90 (1.7 oz)', url: 'https://www.bunibody.com/products/buni-vulva-balm', was: '$42' },
  'p-flo-gummies': { price: '$31.99 for 60 gummies; $26.99 if you subscribe', url: 'https://opositiv.com/products/flo-pms-gummy-vitamins', was: '$30' },
};

/** Apply the checks to catalog products in place. Returns the ids changed. */
export function applyPriceChecks(products) {
  const changed = [];
  for (const p of products) {
    const fix = PRICE_CHECKS[p.id];
    if (fix && p.price !== fix.price) { p.price = fix.price; changed.push(p.id); }
  }
  return changed;
}
