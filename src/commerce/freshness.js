/**
 * How long a price may be shown, by where it came from. A price past its
 * window is not shown as a number; the CTA tells the shopper to check the
 * retailer instead. Every shown price can answer: which merchant, which
 * option, when it was checked and through which source.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const PRICE_SOURCES = Object.freeze({
  AMAZON_CREATORS_API: 'amazon_creators_api',
  SHOPPABLE_PRODUCT_API: 'shoppable_product_api',
  MERCHANT_FEED: 'merchant_feed', // e.g. a Shopify store's /products/<handle>.json
  MERCHANT_API: 'merchant_api',
  ZINC: 'zinc',
  MANUAL_VERIFICATION: 'manual_verification', // a person or audit read the merchant page
  LEGACY_IMPORT: 'legacy_import', // hand-typed catalog text, no source or date
  UNKNOWN: 'unknown',
});

/**
 * Amazon (Creators API best practices + Associates IP License 2(h)/(i)):
 * offers are cached 1 hour; anything refreshed less than hourly needs an
 * "as of" timestamp and Amazon's disclaimer; nothing past 24 hours.
 */
export const AMAZON_OFFER_FRESH_MS = HOUR;
export const AMAZON_MAX_CACHE_MS = DAY;

const MAX_AGE_MS = Object.freeze({
  [PRICE_SOURCES.AMAZON_CREATORS_API]: AMAZON_MAX_CACHE_MS,
  [PRICE_SOURCES.SHOPPABLE_PRODUCT_API]: 6 * HOUR,
  [PRICE_SOURCES.MERCHANT_API]: DAY,
  [PRICE_SOURCES.MERCHANT_FEED]: 14 * DAY,
  [PRICE_SOURCES.ZINC]: HOUR,
  [PRICE_SOURCES.MANUAL_VERIFICATION]: 30 * DAY,
  [PRICE_SOURCES.LEGACY_IMPORT]: 0, // stale until audited
  [PRICE_SOURCES.UNKNOWN]: 0,
});

export function maxAgeFor(source) {
  return MAX_AGE_MS[source] ?? 0;
}

function toMs(value) {
  if (!value) return NaN;
  const t = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(t) ? t : NaN;
}

/**
 * @param {{ source?: string, verifiedAt?: string|number }} price
 * @returns {{ fresh: boolean, needsTimestamp: boolean, ageMs: number|null }}
 */
export function priceFreshness(price, now = Date.now()) {
  const at = toMs(price?.verifiedAt);
  const source = price?.source || PRICE_SOURCES.UNKNOWN;
  if (!Number.isFinite(at)) return { fresh: false, needsTimestamp: false, ageMs: null };
  const ageMs = Math.max(0, now - at);
  const fresh = ageMs <= maxAgeFor(source);
  const needsTimestamp = source === PRICE_SOURCES.AMAZON_CREATORS_API && ageMs > AMAZON_OFFER_FRESH_MS;
  return { fresh, needsTimestamp, ageMs };
}

export const AMAZON_PRICE_DISCLAIMER =
  'Product prices and availability are accurate as of the date/time indicated and are subject to change. Any price and availability information displayed on Amazon.com at the time of purchase will apply to the purchase of this product.';

export const formatMoney = (amount, currency = 'USD') => {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
  const n = Number(amount);
  return `${symbol}${Number.isInteger(n) ? n : n.toFixed(2)}`;
};

/**
 * What the UI may show for the selected offer's price.
 * @returns {{ show: boolean, main: string, sub: string, asOf: string|null, disclaimer: string|null }}
 */
export function priceLabelFor(offerPrice, { merchantLabel = 'the retailer', isAmazon = false, now = Date.now() } = {}) {
  const fallbackMain = isAmazon ? 'See current price on Amazon' : `See current price at ${merchantLabel}`;
  if (!offerPrice || !Number.isFinite(Number(offerPrice.amount)) || Number(offerPrice.amount) <= 0) {
    return { show: false, main: fallbackMain, sub: '', asOf: null, disclaimer: null };
  }
  if (isAmazon && offerPrice.source !== PRICE_SOURCES.AMAZON_CREATORS_API) {
    // Only an API-retrieved Amazon price may be displayed.
    return { show: false, main: fallbackMain, sub: '', asOf: null, disclaimer: null };
  }
  const { fresh, needsTimestamp } = priceFreshness(offerPrice, now);
  if (!fresh) return { show: false, main: fallbackMain, sub: '', asOf: null, disclaimer: null };

  const currency = offerPrice.currency || 'USD';
  const main = formatMoney(offerPrice.amount, currency);
  const subParts = [];
  if (Number(offerPrice.regular) > Number(offerPrice.amount)) subParts.push(`reg. ${formatMoney(offerPrice.regular, currency)}`);
  if (currency !== 'USD') subParts.push(`${currency} price`);
  const asOf = needsTimestamp ? new Date(toMs(offerPrice.verifiedAt)).toISOString() : null;
  return {
    show: true,
    main,
    sub: subParts.join(' · '),
    asOf,
    disclaimer: isAmazon ? AMAZON_PRICE_DISCLAIMER : null,
  };
}
