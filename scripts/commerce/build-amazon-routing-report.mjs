// Final Amazon routing state after the Chrome checks, per product and per option.
// Writes docs/commerce/audit/amazon_routing_state_2026-10-15.json and prints the totals.
// Run: npx tsx@4.19.2 scripts/commerce/build-amazon-routing-report.mjs
import fs from 'node:fs';
import { applyCatalogCorrections } from '../../src/data/catalogCorrections.js';
import { resolveCommerce } from '../../src/commerce/router.js';
import { isPartnerBrandItem } from '../../src/utils/partnerBrands.js';
import { AMAZON_ASIN_BLOCKS } from '../../src/data/amazonAsinBlocks.js';
import { getAmazonAffiliateUrlForProduct } from '../../src/data/productAffiliateUrls.js';
import { isAmazonUrl } from '../../src/utils/buyLink.js';

const read = (p) => JSON.parse(fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const snapshot = read('docs/commerce/audit/live_catalog_commerce_fields_2026-10-15.json');
const findings = read('docs/commerce/audit/chrome_amazon_findings_2026-10-15.json').listings;
const catalog = snapshot.products.map(applyCatalogCorrections);

const asinOf = (u) => (String(u || '').match(/\/dp\/([A-Z0-9]{10})/i) || [])[1]?.toUpperCase() || null;
const blocksByProduct = {};
for (const [asin, b] of Object.entries(AMAZON_ASIN_BLOCKS)) (blocksByProduct[b.productId] ||= []).push({ asin, ...b });
const cleanExact = (asin) => findings[asin]?.[0] === 'IDENTITY_EXACT|VARIANT_EXACT';

const rows = [];
for (const p of catalog) {
  if (isPartnerBrandItem(p)) continue;
  const productAsin = asinOf(getAmazonAffiliateUrlForProduct(p)) || (isAmazonUrl(p.affiliateUrl) ? asinOf(p.affiliateUrl) : null);
  const blocks = blocksByProduct[p.id] || [];
  const touchesAmazon = productAsin || blocks.length || (p.variants || []).some((v) => v.amazonAsin);
  if (!touchesAmazon) continue;
  for (const v of [null, ...(p.variants || [])]) {
    const r = resolveCommerce(p, v);
    const candidate = v ? (v.amazonAsin ? String(v.amazonAsin).toUpperCase() : null) : productAsin;
    const block = candidate ? AMAZON_ASIN_BLOCKS[candidate] : null;
    const blockApplies = block && (block.scope === 'all' || !v);
    let state;
    if (r.amazon) state = cleanExact(r.amazon.asin) ? 'CONFIRMED_AND_ROUTED' : (findings[r.amazon.asin] ? 'ROUTED_WITH_OPEN_QUESTION' : 'NOT_CHECKED');
    else if (blockApplies) state = block.category;
    else if (r.destinationUrl) state = 'CONFIRMED_BUT_BRAND_FALLBACK';
    else state = 'NO_BUY_ROUTE';
    rows.push({
      productId: p.id, option: v ? v.label : null, state,
      amazonAsin: r.amazon?.asin || null, blockedAsin: blockApplies ? candidate : null,
      blockReason: blockApplies ? block.note : null,
      routesTo: r.destinationUrl ? new URL(r.destinationUrl).hostname.replace(/^www\./, '') : null,
      chromeStatus: findings[r.amazon?.asin || candidate]?.[0] || null,
    });
  }
}

const productLevel = rows.filter((r) => r.option === null);
const options = rows.filter((r) => r.option !== null);
const count = (list, s) => list.filter((r) => r.state === s).length;
const states = ['CONFIRMED_AND_ROUTED', 'ROUTED_WITH_OPEN_QUESTION', 'CONFIRMED_BUT_BRAND_FALLBACK', 'BLOCKED_WRONG_ITEM', 'BLOCKED_WRONG_VARIANT', 'BLOCKED_UNAVAILABLE', 'NO_BUY_ROUTE', 'NOT_CHECKED'];
const summary = {
  totalProducts: catalog.length,
  amazonRoutedProducts: catalog.filter((p) => resolveCommerce(p, null).amazon || (p.variants || []).some((v) => resolveCommerce(p, v).amazon)).length,
  amazonRoutedNoSizeChosen: catalog.filter((p) => resolveCommerce(p, null).amazon).length,
  productsWithNoBuyRoute: catalog.filter((p) => !resolveCommerce(p, null).destinationUrl).length,
  amazonNumericPricesShown: catalog.reduce((n, p) => n + [null, ...(p.variants || [])].filter((v) => { const r = resolveCommerce(p, v); return r.amazon && r.priceDisplay.show; }).length, 0),
  byState: {
    noSizeChosen: Object.fromEntries(states.map((s) => [s, count(productLevel, s)])),
    options: Object.fromEntries(states.map((s) => [s, count(options, s)])),
  },
  exactAmazonIdentitiesRouted: new Set(rows.filter((r) => r.state === 'CONFIRMED_AND_ROUTED').map((r) => r.amazonAsin)).size,
  exactAmazonOptionMappings: options.filter((r) => r.state === 'CONFIRMED_AND_ROUTED').length,
  amazonRoutesBlocked: rows.filter((r) => r.state.startsWith('BLOCKED_')).length,
  brandFallbacksFromBlocks: rows.filter((r) => r.state.startsWith('BLOCKED_') && r.routesTo).length,
};
fs.writeFileSync(new URL('../../docs/commerce/audit/amazon_routing_state_2026-10-15.json', import.meta.url), `${JSON.stringify({ summary, rows }, null, 1)}\n`);
console.log(JSON.stringify(summary, null, 1));
console.log('\nROUTED_WITH_OPEN_QUESTION:');
for (const r of rows.filter((x) => x.state === 'ROUTED_WITH_OPEN_QUESTION')) console.log(' ', r.productId, r.option || '', r.amazonAsin, r.chromeStatus);
console.log('\nBLOCKED with no fallback:');
for (const r of rows.filter((x) => x.state.startsWith('BLOCKED_') && !x.routesTo)) console.log(' ', r.productId, r.option || '', r.blockedAsin);
