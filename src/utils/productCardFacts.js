// One product card anatomy for the website and the app (P1-4,
// docs/design-direction.md "Product card"): white tile with the heart in its
// corner → brand → name (2 lines) → kind (sentence case) + at most one badge →
// match → price with its unit spelled out. Both ProductCard components read
// their words from here so the two never drift apart again.
import { CATEGORY_LABELS } from '../data/catalogTaxonomy.js';
import { sentenceCase } from './sentenceCase.js';
import { isPartnerBrandItem } from './partnerBrands.js';
import { formatPrice } from './formatPrice.js';

export function isSponsoredProduct(item) {
  return item?.sponsored === true || item?.isSponsored === true || String(item?.placementType || '').toLowerCase() === 'sponsored';
}

export function cardKind(product) {
  const raw = CATEGORY_LABELS[product?.category] || (product?.category ? String(product.category).replace(/-/g, ' ') : '');
  return raw ? sentenceCase(String(raw).replace(/^[^\w]+\s*/, '')) : '';
}

/**
 * The single mark a card may carry: Pre-order, Sponsored or ayna partner (in
 * that order). It is small text at the end of the kind line, in the same place
 * on every card (the way Amazon and Etsy put "Sponsored" / "Ad" in the card's
 * text, not as a sticker on the photo). `partner: false` drops "ayna partner"
 * where the page already says every product is a partner's (Partners page).
 */
export function cardBadge(product, { partner = true } = {}) {
  if (/deposit/i.test(String(product?.price || ''))) return 'Pre-order';
  if (isSponsoredProduct(product)) return 'Sponsored';
  if (partner && isPartnerBrandItem(product)) return 'ayna partner';
  return '';
}

export function cardPrice(product) {
  if (product?.userAdded === true) return { main: 'Added by you', sub: '' };
  if (/deposit/i.test(String(product?.price || ''))) return { main: 'Coming soon', sub: 'Waitlist' };
  const raw = formatPrice(product);
  return /check (the )?retailer|varies by retailer/i.test(String(raw.main || '')) ? { main: 'Price at retailer', sub: '' } : raw;
}
