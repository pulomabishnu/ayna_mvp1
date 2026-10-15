#!/usr/bin/env node
/**
 * Builds the product-by-product commerce audit from the 2026-10-15 sweep:
 *   docs/commerce/commerce_catalog_audit.csv   one row per live product
 *   docs/commerce/audit/catalog_audit_rows.json same rows, for other scripts
 *   docs/commerce/audit/catalog_audit_summary.json the counts
 *
 *   npx tsx scripts/commerce/build-catalog-audit.mjs
 *
 * It combines: the live catalog snapshot, the Commerce Router's decision for
 * each product (as this branch routes it), merchant-site verification (with
 * the blocked-page recheck merged in), the price-mismatch classification, the
 * no-link investigation and the Amazon mapping groups. Nothing is fetched.
 */
import fs from 'node:fs';
import path from 'node:path';
import { applyCatalogCorrections } from '../../src/data/catalogCorrections.js';
import { resolveCommerce } from '../../src/commerce/router.js';
import { commerceCardPrice } from '../../src/commerce/router.js';
import { isPartnerBrandItem } from '../../src/utils/partnerBrands.js';
import { isAmazonCommissionExcluded } from '../../src/commerce/amazon.js';
import { COMMERCE_PRICE_TEXT_FIXES } from '../../src/data/commercePriceFixes.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, 'docs/commerce/audit', f), 'utf8'));
const live = read('live_catalog_commerce_fields_2026-10-15.json');
const verified = read('merchant_verification_merged_2026-10-15.json');
const mismatch = Object.fromEntries(read('price_mismatch_classification_2026-10-15.json').map((m) => [m.id, m]));
const noLink = Object.fromEntries(read('no_link_investigation_2026-10-15.json').map((n) => [n.id, n]));
const amazonGroups = read('amazon_mapping_summary.json').groups;
const amazonGroupOf = {};
for (const [g, ids] of Object.entries(amazonGroups)) for (const id of ids) amazonGroupOf[id] = g;
const CHECKED_AT = live.fetchedAt;

const SEVERITY = { AMAZON_IMAGE_HOTLINKED: 'MEDIUM',  WRONG_PRODUCT: 'CRITICAL', BROKEN_LINK: 'HIGH', NO_BUY_LINK: 'HIGH', COUNT_SIZE_MISMATCH: 'HIGH', VARIANT_MISMATCH: 'HIGH', DISCONTINUED: 'HIGH', OUT_OF_STOCK: 'MEDIUM', PRICE_MISMATCH: 'MEDIUM', IMAGE_MISMATCH: 'MEDIUM', SEARCH_OR_CATEGORY_LINK: 'MEDIUM', HOMEPAGE_LINK: 'MEDIUM', MISSING_AFFILIATE: 'MEDIUM', AMBIGUOUS: 'MEDIUM', AMAZON_VARIANT_NOT_EXACT: 'HIGH', NEEDS_PROVIDER_ACCESS: 'MEDIUM', VERIFICATION_BLOCKED: 'MEDIUM', BLOCKED: 'MEDIUM', LOW: 'LOW' };
const RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const STATUS_ORDER = ['WRONG_PRODUCT', 'BROKEN_LINK', 'NO_BUY_LINK', 'DISCONTINUED', 'COUNT_SIZE_MISMATCH', 'VARIANT_MISMATCH', 'AMAZON_VARIANT_NOT_EXACT', 'OUT_OF_STOCK', 'PRICE_MISMATCH', 'IMAGE_MISMATCH', 'AMAZON_IMAGE_HOTLINKED', 'AMBIGUOUS', 'VERIFICATION_BLOCKED', 'NEEDS_PROVIDER_ACCESS', 'MATCH_WITH_VARIANTS', 'EXACT_MATCH'];

const CORRECTIONS = {
  'p-maude-vibe': 'Buy link: getmaude.com/products/vibe-vibrator (dead) -> /products/vibe-personal-massager (same product, brand homepage link)',
  'p-oboo-woosh-warming-wand': 'Buy link: oboomagic.com (robots-blocked, unverifiable) -> oboo.love/products/woosh (exact product, $119, the domain Ayna\'s other Oboo items use)',
  'p-mystery-vibe': 'Brand fallback link: /products/crescendo-2 (dead) -> /products/crescendo (brand homepage lists Crescendo 2 there)',
  'p-rael-overnight': 'Brand fallback link: old handle (dead) -> /products/overnight-organic-cotton-pads (same title in the official collection)',
  'd-ppd': 'Service link: plannedparenthooddirect.org -> plannedparenthood.org/planned-parenthood-direct (the old domain 302-redirects there)',
  'p-cora-disc': 'Brand fallback link: cora.life -> cora.com (cora.life 302-redirects to the same product)',
  'p-neycher-vaginal-moisturizer': 'Partner tracking restored: live row had no affiliate link; using the sca_ref link from src/data/brands.js (same product page)',
  'p-neycher-odor-be-gone': 'Partner tracking restored: live row had no affiliate link; using the sca_ref link from src/data/brands.js (same product page)',
  'p-neycher-hydrobloom-gel': 'Partner tracking restored: live row had no affiliate link; using the sca_ref link from src/data/brands.js (same product page)',
};

const yn = (b) => (b === true ? 'yes' : b === false ? 'no' : 'unknown');

const rows = [];
for (const raw of live.products) {
  const p = applyCatalogCorrections(raw);
  const partner = isPartnerBrandItem(p);
  const r = resolveCommerce(p, null);
  const v = verified[p.id] || null;
  const m = mismatch[p.id] || null;
  const n = noLink[p.id] || null;
  const isAmazon = Boolean(r?.amazon);
  const variants = Array.isArray(p.variants) ? p.variants : [];
  const issues = new Set();

  // Destination problems.
  if (!r?.destinationUrl) issues.add('NO_BUY_LINK');
  if (v && !isAmazon) {
    for (const i of v.issues || []) if (!(i === 'BLOCKED' && v.recheck?.status === 'VERIFIED')) issues.add(i === 'BLOCKED' ? 'VERIFICATION_BLOCKED' : i);
    if (v.verificationBlocked) issues.add('VERIFICATION_BLOCKED');
    if (v.productMatch === 'different_product') issues.add('WRONG_PRODUCT');
    if (v.productMatch === 'different_variant') issues.add('VARIANT_MISMATCH');
    if (['unclear'].includes(v.productMatch)) issues.add('AMBIGUOUS');
    if (v.ctaStatus === 'dead' && !CORRECTIONS[p.id]) issues.add('BROKEN_LINK');
    if (v.availability === 'DISCONTINUED') issues.add('DISCONTINUED');
  }
  if (isAmazon) {
    issues.add('NEEDS_PROVIDER_ACCESS');
    if (['child_asin_for_some_sizes', 'sizes_but_one_generic_listing'].includes(amazonGroupOf[p.id])) issues.add('AMAZON_VARIANT_NOT_EXACT');
    // Brand-side findings still matter for the fallback offer and the catalog's own data.
    if (v?.packOrSize?.match === 'mismatch') issues.add('COUNT_SIZE_MISMATCH');
    if (v?.image?.status === 'suspect') issues.add('IMAGE_MISMATCH');
  }
  if (p.id === 'd-bloom') issues.add('DISCONTINUED');
  // Amazon image URLs may be kept at most 24h and never as files (IP License 2(h)).
  if (/(^|\.)(media-amazon\.com|ssl-images-amazon\.com|images-amazon\.com)$/i.test((() => { try { return new URL(p.image).hostname; } catch { return ''; } })())) issues.add('AMAZON_IMAGE_HOTLINKED');
  if (p.outOfBusiness) issues.add('DISCONTINUED');
  if (m && m.primaryReason === 'wrong_pack_count') issues.add('COUNT_SIZE_MISMATCH');
  if (m && isAmazon) issues.delete('PRICE_MISMATCH'); // brand price is not the Amazon offer's price
  if (variants.length && !issues.size) issues.add('MATCH_WITH_VARIANTS');

  const auditStatus = STATUS_ORDER.find((s) => issues.has(s)) || (v?.productMatch === 'exact' || v?.verificationMethod ? 'EXACT_MATCH' : 'NEEDS_PROVIDER_ACCESS');
  const severity = [...issues].map((i) => SEVERITY[i] || 'LOW').sort((a, b) => RANK[a] - RANK[b])[0] || 'LOW';

  const priceVerified = Boolean(r?.priceDisplay?.show);
  const priceFix = COMMERCE_PRICE_TEXT_FIXES[p.id] && String(raw.price || '').trim() === COMMERCE_PRICE_TEXT_FIXES[p.id].from ? COMMERCE_PRICE_TEXT_FIXES[p.id] : null;
  const card = commerceCardPrice(p, {});
  const cardVO = commerceCardPrice(p, { env: { VITE_COMMERCE_PRICE_MODE: 'verified_only' } });
  const verifiedPrice = isAmazon ? '' : (v?.price?.merchantSale ?? v?.price?.merchantRegular ?? '');
  const reviewReasons = [];
  if (isAmazon) reviewReasons.push('Amazon price/variant/availability need a human check or Creators API');
  if (issues.has('AMAZON_VARIANT_NOT_EXACT')) reviewReasons.push('some Ayna sizes have no exact Amazon child ASIN');
  if (issues.has('VERIFICATION_BLOCKED')) reviewReasons.push(`merchant page could not be read (${v?.verificationBlocked || v?.recheck?.blockedReason || 'blocked'})`);
  if (issues.has('AMBIGUOUS')) reviewReasons.push('Ayna record does not say which option/product the link should be');
  if (issues.has('NO_BUY_LINK')) reviewReasons.push(n ? `no Buy link; investigation: ${n.outcome}` : 'no Buy link');
  if (issues.has('COUNT_SIZE_MISMATCH')) reviewReasons.push('count/size on Ayna differs from the merchant');
  if (issues.has('IMAGE_MISMATCH')) reviewReasons.push('image looks like a different variant/retailer copy');
  if (issues.has('AMAZON_IMAGE_HOTLINKED')) reviewReasons.push('image is an Amazon-hosted file; replace with brand/ayna imagery');
  if (m && !isAmazon && m.recommendedAction !== 'do_not_change') reviewReasons.push(`price: ${m.primaryReason} -> ${m.recommendedAction}`);

  rows.push({
    ayna_product_id: p.id,
    product_name: p.name,
    brand: p.brand || '',
    category: p.category,
    type: p.type,
    is_ayna_partner: yn(partner),
    source_priority: p.type === 'digital' ? 'service: official service/app link' : partner ? 'partner route > (no Amazon)' : 'exact Amazon > exact brand site > manual review',
    selected_primary_offer: r?.destinationUrl ? `${r.provider}: ${r.merchant}` : 'none',
    selection_reason: r?.selectionReason || 'NEEDS_MANUAL_REVIEW',
    exact_merchant: r?.merchant || '',
    commerce_url: r?.destinationUrl || '',
    affiliate_route: r?.method === 'affiliate_redirect' ? r.provider : 'none',
    affiliate_link_valid: isAmazon ? 'yes (tag aynahealth-20; Amazon page not opened)' : v?.affiliateWrapper ? yn(v.affiliateWrapper.trackingIntact) : (partner && !/[?&](ref|af|sca_ref|bg_ref|dt_id)=/i.test(r?.destinationUrl || '') ? 'no tracking on partner link' : 'n/a'),
    resolved_merchant_url: isAmazon ? '' : (v?.affiliateWrapper?.resolvesTo || v?.ctaFinalUrl || ''),
    product_identifier: isAmazon ? `ASIN ${r.amazon.asin || ''}` : (v?.variants?.find((x) => x.sku)?.sku ? `SKU ${v.variants.find((x) => x.sku).sku}` : ''),
    variant_identifiers: variants.map((x) => `${x.label}=${x.amazonAsin ? `ASIN ${x.amazonAsin}` : x.id}`).join(' | '),
    ayna_current_price: raw.price || '',
    verified_source_price: verifiedPrice === '' ? '' : `${verifiedPrice} ${v?.price?.currency || ''}`.trim(),
    price_verified: yn(priceVerified),
    price_source: r?.price?.source || (isAmazon ? 'none (Amazon: Creators API only)' : 'legacy_import'),
    price_mismatch: yn(Boolean(m && !isAmazon && m.recommendedAction !== 'do_not_change')),
    mismatch_reason: m ? m.primaryReason : '',
    recommended_display_price: m && !isAmazon ? (m.recommendedDisplayPrice || '') : '',
    card_price_now: card ? card.main : '(unchanged catalog text)',
    card_price_if_verified_only: cardVO ? cardVO.main : '(unchanged catalog text)',
    ayna_size_count: v?.packOrSize?.ayna || '',
    verified_size_count: isAmazon ? '' : (v?.packOrSize?.merchantDefault || ''),
    size_count_match: isAmazon ? 'unverified (Amazon)' : (v?.packOrSize?.match || 'unverified'),
    variant_count: variants.length,
    variants_exact_match: v?.variants?.length ? `${v.variants.filter((x) => x.match === 'exact').length}/${variants.length}` : (variants.length ? `0/${variants.length}` : 'n/a'),
    variant_exact_match: variants.length ? yn(Boolean(v?.variants?.length) && v.variants.filter((x) => x.match === 'exact').length === variants.length) : 'n/a',
    image_exact_match: v?.image?.status === 'consistent' ? 'yes' : v?.image?.status === 'suspect' ? 'no' : 'unverified',
    image_note: v?.image?.note || '',
    availability: isAmazon ? 'UNVERIFIED (Amazon)' : (r?.availability !== 'UNKNOWN' ? r.availability : (v?.availability || 'UNKNOWN')),
    amazon_group: amazonGroupOf[p.id] || '',
    amazon_identity_status: isAmazon ? 'NEEDS_HUMAN_VERIFICATION' : 'n/a',
    amazon_variant_status: isAmazon ? r.amazon.variant : 'n/a',
    amazon_price_status: isAmazon ? 'AMAZON_PRICE_UNVERIFIED' : 'n/a',
    amazon_availability_status: isAmazon ? 'AMAZON_AVAILABILITY_UNVERIFIED' : 'n/a',
    amazon_commission_excluded: isAmazon ? yn(isAmazonCommissionExcluded(p)) : 'n/a',
    verification_method: isAmazon ? 'asin_extracted_only' : (v?.verificationBlocked ? 'unable_to_verify' : (v?.verificationMethod || 'unable_to_verify')),
    confidence: isAmazon ? 'manual_review_required' : (v ? (issues.has('VERIFICATION_BLOCKED') || issues.has('AMBIGUOUS') ? 'manual_review_required' : v.confidence || 'medium') : 'manual_review_required'),
    audit_status: auditStatus,
    issue_types: [...issues].join('; '),
    severity,
    corrected_automatically: (CORRECTIONS[p.id] || priceFix || card) ? 'yes' : 'no',
    correction_detail: [CORRECTIONS[p.id], priceFix ? `Price text: "${priceFix.from}" -> "${priceFix.to}" (${priceFix.evidence})` : null, card ? `Card shows ${card.main} (verified at the merchant) instead of "${p.price || ''}"` : null].filter(Boolean).join(' | '),
    manual_review_required: yn(reviewReasons.length > 0),
    review_reason: reviewReasons.join('; '),
    notes: [v?.notes, n ? `No-link investigation: ${n.notes}` : null].filter(Boolean).join(' | ').slice(0, 900),
    checked_at: CHECKED_AT,
  });
}

const cols = Object.keys(rows[0]);
const cell = (x) => { const s = String(x ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
fs.writeFileSync(path.join(root, 'docs/commerce/commerce_catalog_audit.csv'), [cols.join(','), ...rows.map((row) => cols.map((c) => cell(row[c])).join(','))].join('\n') + '\n');
fs.writeFileSync(path.join(root, 'docs/commerce/audit/catalog_audit_rows.json'), JSON.stringify(rows, null, 1));

const count = (f) => rows.filter(f).length;
const has = (i) => (row) => row.issue_types.split('; ').includes(i);
const summary = {
  checkedAt: CHECKED_AT,
  totalProducts: rows.length,
  physical: count((x) => x.type === 'physical'),
  appsAndServices: count((x) => x.type === 'digital'),
  partnerProducts: count((x) => x.is_ayna_partner === 'yes'),
  routes: rows.reduce((a, x) => ((a[x.selection_reason] = (a[x.selection_reason] || 0) + 1), a), {}),
  auditStatus: rows.reduce((a, x) => ((a[x.audit_status] = (a[x.audit_status] || 0) + 1), a), {}),
  severity: rows.reduce((a, x) => ((a[x.severity] = (a[x.severity] || 0) + 1), a), {}),
  fullyVerifiedNonAmazon: count((x) => x.audit_status === 'EXACT_MATCH' || x.audit_status === 'MATCH_WITH_VARIANTS'),
  amazonRouted: count((x) => x.amazon_price_status === 'AMAZON_PRICE_UNVERIFIED'),
  amazonPriceVerified: 0,
  priceMismatchesNonAmazon: count((x) => x.price_mismatch === 'yes'),
  countSizeMismatches: count(has('COUNT_SIZE_MISMATCH')),
  variantMismatches: count(has('VARIANT_MISMATCH')),
  amazonVariantNotExact: count(has('AMAZON_VARIANT_NOT_EXACT')),
  imageMismatches: count(has('IMAGE_MISMATCH')),
  amazonImagesHotlinked: count(has('AMAZON_IMAGE_HOTLINKED')),
  brokenLinks: count(has('BROKEN_LINK')),
  noBuyLink: count(has('NO_BUY_LINK')),
  wrongProducts: count(has('WRONG_PRODUCT')),
  outOfStock: count(has('OUT_OF_STOCK')),
  discontinued: count(has('DISCONTINUED')),
  verificationBlocked: count(has('VERIFICATION_BLOCKED')),
  ambiguous: count(has('AMBIGUOUS')),
  searchOrCategoryLinks: count(has('SEARCH_OR_CATEGORY_LINK')),
  partnerLinksMissingTracking: count((x) => x.affiliate_link_valid === 'no tracking on partner link'),
  manualReviewRequired: count((x) => x.manual_review_required === 'yes'),
  correctedAutomatically: count((x) => x.corrected_automatically !== 'no'),
};
fs.writeFileSync(path.join(root, 'docs/commerce/audit/catalog_audit_summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
