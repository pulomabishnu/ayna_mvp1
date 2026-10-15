#!/usr/bin/env node
/**
 * Builds src/data/commerceVerifiedOffers.js from a merchant verification run
 * (docs/commerce/audit/merchant_verification_*.json).
 *
 * Only merchant-side facts go in: brand sites, partner sites and the pages an
 * affiliate wrapper lands on. Amazon prices never go in; they can only come
 * from Creators API at display time.
 *
 * A product-level price is kept only when the verifier read it for the same
 * product and the same pack/size Ayna shows. Per-option prices are kept only
 * for options whose merchant variant id matched exactly.
 *
 *   node scripts/commerce/build-verified-offers.mjs [path/to/verification.json] [--verified-at=2026-10-15T02:30:00Z]
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith('--')) || path.join(root, 'docs/commerce/audit/merchant_verification_merged_2026-10-15.json');
const verifiedAt = (args.find((a) => a.startsWith('--verified-at=')) || '--verified-at=2026-10-15T02:30:00Z').split('=')[1];

const results = JSON.parse(fs.readFileSync(input, 'utf8'));
const rows = Array.isArray(results) ? results : Object.values(results);

const hostOf = (u) => {
  try {
    const h = new URL(u).hostname.toLowerCase().replace(/^www\./, '');
    return /(^|\.)amazon\.|^amzn\.|^a\.co$/.test(h) ? null : h;
  } catch {
    return null;
  }
};
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null);
// Prices the verifier read but that depend on a condition the shopper may not
// meet (new-subscriber offers, subscription-only pricing, launch codes). Showing
// them as the current price would overstate the deal, so these products show
// "See price at <merchant>" until a one-time price is confirmed.
const CONDITIONAL_PRICING = {
  'p-rituals-prenatal': '$31.20 is a new-subscriber offer; non-member one-time is $44.32 plus shipping',
  'p-gina-vaginal-moisturizing-glides': '$101 is the 3-month subscription; the one-time refill pack is a different product ($42)',
  'p-nutrafol-balance': 'subscription only; no one-time price',
  'p-nutrafol-postpartum': 'subscription only; no one-time price',
  'p-winx-vaginal-probiotic': 'the $28 figure may be the Subscribe & Save price',
  'd-initio': '$119 is a launch offer next to a code',
  'p-intimina-lily': 'a -50% sale is shown but the page does not map prices to sizes',
  'p-elitone-urge': '"Starting at $399" is a limited-time older model; the current kit is $429. Which one Ayna lists needs a decision',
  'p-mypelvicbra-sports': 'the store page rendered EUR to the verifier; the feed figure 50.95 may not be USD',
  'p-elitone': '"Starting at $399" is a limited-time older model; the current kit is $429. Which one Ayna lists needs a decision',
};
// The verifier saw these stores in a non-US region; the US price is not confirmed.
const USD_ONLY = true;

const SOURCE = { structured_feed: 'merchant_feed', merchant_page: 'manual_verification', affiliate_destination: 'manual_verification' };

const out = {};
for (const r of rows) {
  if (!r?.id) continue;
  const source = SOURCE[r.verificationMethod];
  const hosts = new Set();
  const addHost = (u) => { const h = hostOf(u); if (h) hosts.add(h); };
  addHost(r.ctaFinalUrl);
  if (r.affiliateWrapper) { addHost(r.affiliateWrapper.url); addHost(r.affiliateWrapper.resolvesTo); }
  for (const o of r.otherUrls || []) if (['ok', 'redirected'].includes(o.status)) addHost(o.url);

  // A product-level price needs an exact product match on a product page (not a
  // collection/category page). Per-option prices below have their own exact
  // variant-id match, so a sized product can still carry option prices.
  const onProductPage = !(r.issues || []).some((i) => ['SEARCH_OR_CATEGORY_LINK', 'HOMEPAGE_LINK', 'WRONG_PRODUCT', 'COUNT_SIZE_MISMATCH'].includes(i));
  // Sized products get per-option prices only; the card shows "From $X".
  const hasAynaOptions = (r.variants || []).length > 0;
  const sameProduct = r.productMatch === 'exact' && onProductPage && !hasAynaOptions;
  const samePack = r.packOrSize?.match !== 'mismatch';
  const p = r.price || {};
  const amount = num(p.merchantSale) ?? num(p.merchantRegular);
  const conditional = CONDITIONAL_PRICING[r.id];
  const currencyOk = !USD_ONLY || (p.currency || 'USD') === 'USD';
  const productPrice = !conditional && currencyOk && source && sameProduct && samePack && amount && ['match', 'mismatch'].includes(p.comparison)
    ? { amount, regular: num(p.merchantRegular), currency: p.currency || 'USD', option: p.forOption || null, source, verifiedAt }
    : null;

  const variants = {};
  for (const v of r.variants || []) {
    if (!v?.aynaVariantId || v.match !== 'exact') continue;
    variants[v.aynaVariantId] = {
      price: !conditional && currencyOk && source && num(v.price) ? { amount: num(v.price), currency: p.currency || 'USD', source, verifiedAt } : null,
      available: typeof v.available === 'boolean' ? v.available : null,
      sku: v.sku || null,
      barcode: v.barcode || null,
    };
  }

  if (!hosts.size && !productPrice && !Object.keys(variants).length) continue;
  out[r.id] = {
    merchant: r.merchant || null,
    merchantTitle: r.merchantTitle || null,
    hosts: [...hosts].sort(),
    productMatch: r.productMatch,
    availability: r.availability || 'UNKNOWN',
    verificationMethod: r.verificationMethod,
    verifiedAt,
    price: productPrice,
    ...(conditional ? { priceWithheld: conditional } : {}),
    ...(!currencyOk ? { priceWithheld: `verifier saw ${p.currency} pricing; US price not confirmed` } : {}),
    variants,
  };
}

const header = `/**
 * GENERATED by scripts/commerce/build-verified-offers.mjs from
 * ${path.relative(root, input)}. Do not edit by hand; rerun the script.
 *
 * Merchant-side offer facts read from each brand/partner site during the
 * catalog commerce audit. No Amazon data is stored here: Amazon prices and
 * availability may only come from Creators API (see src/commerce/amazon.js).
 * Prices expire by source (src/commerce/freshness.js); an expired price is
 * shown as "See price at <merchant>", never as a number.
 */
`;
const body = `export const COMMERCE_VERIFIED_OFFERS = ${JSON.stringify(out, null, 2)};\n`;
const target = path.join(root, 'src/data/commerceVerifiedOffers.js');
fs.writeFileSync(target, header + body);
const withPrice = Object.values(out).filter((o) => o.price).length;
const variantPrices = Object.values(out).reduce((n, o) => n + Object.values(o.variants).filter((v) => v.price).length, 0);
console.log(`wrote ${path.relative(root, target)}: ${Object.keys(out).length} products, ${withPrice} product-level prices, ${variantPrices} option prices`);
