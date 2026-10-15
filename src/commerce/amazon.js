/**
 * Amazon-specific identity and verification state. Four separate facts that
 * are never merged into one "verified":
 *
 *   identity      the ASIN is this brand's product (title/brand checked)
 *   variant       the ASIN is the exact child for the chosen size/count/colour
 *   price         a current offer price was retrieved through Creators API
 *   availability  current offer availability was retrieved through Creators API
 *
 * Prices and availability can only come from Creators API. Without it the
 * answer is NEEDS_HUMAN_VERIFICATION, never an old catalog number. Amazon
 * pages are never crawled.
 */
import { PRICE_SOURCES } from './freshness.js';

export const AMAZON_PARTNER_TAG = 'aynahealth-20';

export const AMAZON_STATUS = Object.freeze({
  VERIFIED: 'VERIFIED',
  NEEDS_HUMAN_VERIFICATION: 'NEEDS_HUMAN_VERIFICATION',
  NEEDS_CREATORS_API_ACCESS: 'NEEDS_CREATORS_API_ACCESS',
  NOT_EXACT: 'NOT_EXACT',
  NEEDS_VARIANT_CHOICE: 'NEEDS_VARIANT_CHOICE', // sized product, no size picked yet
  NOT_APPLICABLE: 'NOT_APPLICABLE',
});

/** The required site statement (Operating Agreement sec. 5). Do not reword. */
export const AMAZON_ASSOCIATE_STATEMENT = 'As an Amazon Associate I earn from qualifying purchases.';
/** Link-level disclosure next to an Amazon button (Associates disclosure guidance: "(paid link)"). */
export const AMAZON_LINK_DISCLOSURE = 'Paid link';
/** Required when Amazon-sourced text is displayed (IP License 2(k)). */
export const AMAZON_CONTENT_NOTICE = 'CERTAIN CONTENT THAT APPEARS ON THIS SITE COMES FROM AMAZON. THIS CONTENT IS PROVIDED ‘AS IS’ AND IS SUBJECT TO CHANGE OR REMOVAL AT ANY TIME.';

const ASIN_RE = /^[A-Z0-9]{10}$/;

export function normalizeAsin(value) {
  const s = String(value || '').trim().toUpperCase();
  return ASIN_RE.test(s) ? s : null;
}

/** Pull an ASIN out of an amazon.com product URL (/dp/, /gp/product/). Short links (amzn.to) can't be read without following them. */
export function asinFromUrl(url) {
  const m = String(url || '').match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?=[/?#]|$)/i);
  return m ? m[1].toUpperCase() : null;
}

/**
 * The tracked Amazon link for an ASIN. The tag is ayna's store ID only: never
 * a per-user sub-tag (Participation Requirements 2(b)), never any health or
 * profile data.
 */
export function amazonSpecialLink(asin) {
  const clean = normalizeAsin(asin);
  return clean ? `https://www.amazon.com/dp/${clean}?tag=${AMAZON_PARTNER_TAG}` : null;
}

/** True when an Amazon URL carries exactly ayna's tag and nothing user-identifying. */
export function isCleanAmazonSpecialLink(url) {
  try {
    const u = new URL(url);
    if (!/(^|\.)amazon\.com$/i.test(u.hostname)) return false;
    const keys = [...u.searchParams.keys()];
    return u.searchParams.get('tag') === AMAZON_PARTNER_TAG && keys.every((k) => k === 'tag');
  } catch {
    return false;
  }
}

export function creatorsApiConfigured(env = {}) {
  return Boolean(env.AMAZON_CREATORS_CREDENTIAL_ID && env.AMAZON_CREATORS_CREDENTIAL_SECRET && env.AMAZON_CREATORS_CREDENTIAL_VERSION);
}

/**
 * @param {{ asin?: string, identityCheckedAt?: string|null, variantExact?: boolean|null, price?: object|null, availability?: object|null }} amazonOffer
 * @param {{ productHasVariants?: boolean, apiConfigured?: boolean }} ctx
 */
export function amazonVerification(amazonOffer, { productHasVariants = false, variantChosen = false, apiConfigured = false } = {}) {
  if (!amazonOffer?.asin) {
    return { identity: AMAZON_STATUS.NOT_APPLICABLE, variant: AMAZON_STATUS.NOT_APPLICABLE, price: AMAZON_STATUS.NOT_APPLICABLE, availability: AMAZON_STATUS.NOT_APPLICABLE };
  }
  const fromApi = (x) => x && x.source === PRICE_SOURCES.AMAZON_CREATORS_API;
  const missingApi = apiConfigured ? AMAZON_STATUS.NEEDS_HUMAN_VERIFICATION : AMAZON_STATUS.NEEDS_CREATORS_API_ACCESS;
  let variant;
  if (amazonOffer.variantExact === true) variant = AMAZON_STATUS.VERIFIED;
  else if (amazonOffer.variantExact === false) variant = AMAZON_STATUS.NOT_EXACT;
  else if (productHasVariants && !variantChosen) variant = AMAZON_STATUS.NEEDS_VARIANT_CHOICE;
  else variant = AMAZON_STATUS.NEEDS_HUMAN_VERIFICATION;
  return {
    identity: amazonOffer.identityCheckedAt ? AMAZON_STATUS.VERIFIED : AMAZON_STATUS.NEEDS_HUMAN_VERIFICATION,
    variant,
    price: fromApi(amazonOffer.price) ? AMAZON_STATUS.VERIFIED : missingApi,
    availability: fromApi(amazonOffer.availability) ? AMAZON_STATUS.VERIFIED : missingApi,
  };
}

/**
 * Amazon never pays commission on these (Products Statement 3(c)), so ayna
 * must not show expected affiliate earnings for them.
 */
export function isAmazonCommissionExcluded(product) {
  return Boolean(product?.requiresPrescription || product?.requires_prescription);
}
