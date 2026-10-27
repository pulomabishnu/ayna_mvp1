// A small "≈ €23" next to a US price for visitors outside the US. Prices stay
// in US dollars (that's what the retailer charges); this is only an estimate
// from the dated table in src/data/fxRates.js, never a live rate.
import { USD_TO } from '../data/fxRates.js';

const EURO_REGIONS = new Set(['AT', 'BE', 'BG', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK']);
const REGION_CURRENCY = { GB: 'GBP', CA: 'CAD', AU: 'AUD', IN: 'INR', JP: 'JPY', MX: 'MXN' };

/** The visitor's first preferred locale, or en-US when the browser won't say. */
export function visitorLocale() {
  try {
    if (typeof navigator === 'undefined') return 'en-US';
    return navigator.languages?.[0] || navigator.language || 'en-US';
  } catch {
    return 'en-US';
  }
}

function regionOf(locale) {
  try {
    const loc = new Intl.Locale(locale);
    return loc.region || loc.maximize().region || '';
  } catch {
    return '';
  }
}

/** The currency we can estimate for this locale, or '' (US, or one we have no rate for). */
export function currencyForLocale(locale) {
  const region = regionOf(locale);
  if (!region || region === 'US') return '';
  if (EURO_REGIONS.has(region)) return 'EUR';
  return REGION_CURRENCY[region] || '';
}

const NUM = '([\\d,]+(?:\\.\\d+)?)';
const USD_PRICE = new RegExp(`^(?:About\\s+)?\\$${NUM}(?:\\s*[–-]\\s*\\$?${NUM})?(\\s*/\\s*[a-z]+)?$`, 'i');

/**
 * "$23" -> "≈ €20" for a de-DE visitor. Works on the short price line that
 * formatPrice() returns ("$12.99", "About $20–35", "$15/mo"). Returns '' when
 * the price isn't in US dollars, the locale is en-US (or any US locale), or
 * there's no rate for the visitor's currency.
 */
export function localEstimate(priceMain, locale = visitorLocale()) {
  const currency = currencyForLocale(locale);
  if (!currency) return '';
  const m = String(priceMain || '').trim().match(USD_PRICE);
  if (!m) return '';
  const rate = USD_TO[currency];
  const lo = Number(m[1].replace(/,/g, '')) * rate;
  const hi = m[2] ? Number(m[2].replace(/,/g, '')) * rate : null;
  if (!Number.isFinite(lo) || lo <= 0) return '';
  let fmt;
  try {
    fmt = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
  } catch {
    return '';
  }
  const whole = (n) => Math.max(1, Math.round(n));
  const body = hi && hi > lo
    ? (typeof fmt.formatRange === 'function' ? fmt.formatRange(whole(lo), whole(hi)) : `${fmt.format(whole(lo))}–${fmt.format(whole(hi))}`)
    : fmt.format(whole(lo));
  const per = m[3] ? m[3].replace(/\s+/g, '') : '';
  return `≈ ${body}${per}`;
}

export const PRICE_REGION_NOTE = 'Prices in US dollars. Most retailers ship to the US; check the retailer for international shipping.';
