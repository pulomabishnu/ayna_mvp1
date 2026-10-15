/**
 * Rows for the Amazon human-verification worksheet and the admin review
 * page: one row per Amazon offer a shopper can reach (the product-level
 * listing, plus one row per Ayna size/option). Built from catalog data only;
 * nothing is fetched from Amazon.
 */
import { applyCatalogCorrections } from '../data/catalogCorrections.js';
import { getAmazonAffiliateUrlForProduct } from '../data/productAffiliateUrls.js';
import { isPartnerBrandItem } from '../utils/partnerBrands.js';
import { resolveBuyUrl, isAmazonUrl } from '../utils/buyLink.js';
import { asinFromUrl, amazonSpecialLink } from './amazon.js';
import { resolveCommerce } from './router.js';

export const COUNT_RE = /(\d[\d,]*)\s*(?:-|\s)?(count|ct|pack|pk|capsules?|caps|softgels?|gummies|tablets?|caplets?|pads?|tampons?|liners?|strips?|tests?|patches|wipes|glides|suppositories|servings|pairs?|pieces?|piece)\b/i;
const SIZE_RE = /(\d+(?:\.\d+)?)\s*(fl\.?\s*oz|oz|ml|mL|g|kg|lb|mg|mcg|iu|IU)\b/;
const pick = (re, ...texts) => {
  for (const t of texts) {
    const m = String(t || '').match(re);
    if (m) return m[0].replace(/\s+/g, ' ').trim();
  }
  return '';
};


/**
 * @param {object[]} products live catalog rows (corrections applied here)
 * @param {{ noLink?: object[] }} [opts] no-link investigation results (Amazon candidates)
 * @returns {{ rows: object[], summary: object }}
 */
export function buildAmazonReviewRows(products, { noLink = [] } = {}) {
  const rows = [];
  const summary = { products: 0, offers: 0, productLevelAsins: 0, childAsinMappings: 0, groups: {}, duplicateChildAsins: [], optionsWithoutChildAsin: 0, brandFallbackAvailable: 0, noFallback: 0 };
  let order = 0;

  for (const raw of products) {
    const p = applyCatalogCorrections(raw);
    const partner = isPartnerBrandItem(p);
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const productAmazon = getAmazonAffiliateUrlForProduct(p) || (isAmazonUrl(p.affiliateUrl) ? p.affiliateUrl : null);
    const variantAsins = variants.filter((v) => v.amazonAsin);
    if (partner || (!productAmazon && !variantAsins.length)) continue;

    summary.products += 1;
    const productAsin = asinFromUrl(productAmazon);
    let group;
    if (!variants.length) group = 'single_asin_no_ayna_sizes';
    else if (variantAsins.length === variants.length) group = 'child_asin_for_every_size';
    else if (variantAsins.length) group = 'child_asin_for_some_sizes';
    else group = 'sizes_but_one_generic_listing';
    (summary.groups[group] ||= []).push(p.id);

    const brandFallback = resolveBuyUrl(p, null, { amazonAllowed: false });
    if (brandFallback) summary.brandFallbackAvailable += 1; else summary.noFallback += 1;

    const seen = new Map();
    for (const v of variantAsins) {
      const a = String(v.amazonAsin).toUpperCase();
      if (seen.has(a)) summary.duplicateChildAsins.push({ productId: p.id, asin: a, options: [seen.get(a), v.label] });
      else seen.set(a, v.label);
    }

    const base = {
      ayna_product_id: p.id, product_name: p.name, brand: p.brand || '', is_ayna_partner: 'no',
      ayna_display_name: p.variantFamilyName || p.name, ayna_price_text: p.price || '', ayna_image_url: p.image || '',
      parent_asin: 'unknown (record if Amazon shows one)', brand_site_fallback_url: brandFallback || '',
      amazon_identity_status: 'NEEDS_HUMAN_VERIFICATION',
      amazon_price_status: 'AMAZON_PRICE_UNVERIFIED',
      amazon_availability_status: 'AMAZON_AVAILABILITY_UNVERIFIED',
      human_review_required: 'yes',
    };

    // Product-level row: the listing the button opens when no option is chosen.
    if (productAsin || !variants.length) {
      const r = resolveCommerce(p, null);
      const asin = productAsin || asinFromUrl(r?.destinationUrl);
      summary.offers += 1;
      if (asin) summary.productLevelAsins += 1;
      order += 1;
      rows.push({
        ...base, review_order: order, row_type: variants.length ? 'product_listing (no size chosen)' : 'product',
        ayna_option_label: '', ayna_size: pick(SIZE_RE, p.name, p.price), ayna_count: pick(COUNT_RE, p.name, p.price),
        ayna_color_or_scent: '', asin_for_this_row: asin || '', child_asin_for_option: '',
        amazon_link_to_open: amazonSpecialLink(asin) || productAmazon || '',
        expected_exact_variant: variants.length ? 'n/a: shopper has not picked a size; confirm the listing is this product' : `${p.name}${pick(COUNT_RE, p.name, p.price) ? '' : ' (count/size not stated on Ayna: record what Amazon sells)'}`,
        button_destination_today: r?.destinationUrl || '',
        amazon_variant_status: variants.length ? 'AMAZON_VARIANT_NOT_EXACT (generic listing for a sized product)' : 'SINGLE_ASIN_COUNT_UNVERIFIED',
        review_reason: variants.length
          ? 'Sized product: listing must be the same product; each size row below must match its own child ASIN'
          : 'Confirm exact count/pack/volume/formula/model and record current price',
        severity_if_wrong: 'CRITICAL if different product or formulation; HIGH if different count/pack/size',
        notes: 'ASIN mapped by the ayna team (10 wrong-brand rows were removed 2026-10-04). Never verified against Amazon by the system.',
      });
    }

    // One row per Ayna option.
    for (const v of variants) {
      const asin = v.amazonAsin ? String(v.amazonAsin).toUpperCase() : '';
      const r = resolveCommerce(p, v);
      summary.offers += 1;
      if (asin) summary.childAsinMappings += 1; else summary.optionsWithoutChildAsin += 1;
      order += 1;
      rows.push({
        ...base, review_order: order, row_type: 'size/option', ayna_variant_id: v.id,
        ayna_option_label: v.label, ayna_size: pick(SIZE_RE, v.label), ayna_count: pick(COUNT_RE, v.label),
        ayna_color_or_scent: /\//.test(v.label) ? v.label.split('/')[0].trim() : '',
        ayna_image_url: v.image || p.image || '',
        asin_for_this_row: asin, child_asin_for_option: asin,
        amazon_link_to_open: amazonSpecialLink(asin) || '',
        expected_exact_variant: `${p.variantFamilyName || p.name}, ${v.label}`,
        button_destination_today: r?.destinationUrl || '',
        amazon_variant_status: asin
          ? (seen.get(asin) === v.label ? 'CHILD_ASIN_MAPPED_UNVERIFIED' : 'DUPLICATE_CHILD_ASIN')
          : 'AMAZON_VARIANT_NOT_EXACT (no child ASIN for this option)',
        review_reason: asin
          ? 'Open the child ASIN and confirm it is exactly this option (size/count/colour), then record price and availability'
          : (v.url ? 'No Amazon child ASIN: this option routes to the brand site. Find the exact child ASIN on Amazon if one exists' : 'No Amazon child ASIN and no brand option link: manual review'),
        severity_if_wrong: 'HIGH (wrong size/count/colour)',
        notes: asin ? '' : (v.url ? `Brand option: ${v.url}` : ''),
        amazon_price_status: asin ? 'AMAZON_PRICE_UNVERIFIED' : 'n/a (not routed to Amazon)',
        amazon_availability_status: asin ? 'AMAZON_AVAILABILITY_UNVERIFIED' : 'n/a (not routed to Amazon)',
      });
    }
  }

  // Amazon candidates found by web search for products with no working Buy link.
  for (const n of noLink) {
    if (!n?.amazonCandidate?.asin) continue;
    order += 1;
    rows.push({
      review_order: order, row_type: 'candidate (no Buy link today)', ayna_product_id: n.id, product_name: n.aynaName, brand: '',
      is_ayna_partner: 'no', ayna_display_name: n.aynaName, ayna_option_label: '', ayna_price_text: '', ayna_size: '', ayna_count: '',
      ayna_color_or_scent: '', ayna_image_url: '', parent_asin: 'unknown', asin_for_this_row: n.amazonCandidate.asin, child_asin_for_option: '',
      amazon_link_to_open: amazonSpecialLink(n.amazonCandidate.asin), expected_exact_variant: n.aynaName,
      button_destination_today: '(none)', brand_site_fallback_url: n.brandSite?.url || '',
      amazon_identity_status: 'AMAZON_CANDIDATE_NEEDS_HUMAN_CHECK', amazon_variant_status: n.outcome === 'AMBIGUOUS_VARIANT' ? 'AMBIGUOUS_VARIANT' : 'UNVERIFIED',
      amazon_price_status: 'AMAZON_PRICE_UNVERIFIED', amazon_availability_status: 'AMAZON_AVAILABILITY_UNVERIFIED',
      human_review_required: 'yes', review_reason: 'Found via web search only. Confirm it is the exact product Ayna lists before mapping it.',
      severity_if_wrong: 'CRITICAL if different product', notes: n.notes || '',
    });
  }

  summary.rows = rows.length;
  summary.groupCounts = Object.fromEntries(Object.entries(summary.groups).map(([k, v]) => [k, v.length]));
  return { rows, summary };
}
