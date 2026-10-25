/**
 * Where she buys, said one way on every product surface (founder, Oct 25:
 * "a shopper can't tell where she's buying"). One link (utils/buyLink
 * resolveBuyUrl, the website's rule: partners' own link, else ayna's Amazon
 * link when Amazon carries it, else the brand or retailer page), one
 * retailer name, one button label ("Buy at Amazon · $30"; services: "Visit
 * Planned Parenthood Direct"), one "Where to buy" list and one price-check
 * date. The app and the website used to resolve the link differently.
 */
import { resolveBuyUrl, isAmazonUrl } from '../../utils/buyLink.js';
import { isPartnerBrandItem, isPrelaunchPartnerItem } from '../../utils/partnerBrands.js';
import { retailerLinks } from './commerce.js';
import { getPassport } from '../../data/passport/index.js';
import { formatPrice } from '../../utils/formatPrice.js';

const SITE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };

export function fmtCheckDate(raw) {
  if (!raw) return '';
  const d = new Date(`${String(raw).slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function buyModel(product, { variant = null, brand = '', name = '', priceMain = null } = {}) {
  if (!product) return null;
  const isService = product.category === 'telehealth' || product.type === 'digital';
  const partner = isPartnerBrandItem(product);
  const prelaunch = isPrelaunchPartnerItem(product);
  let url = resolveBuyUrl(product, variant) || '';
  // No product link: the brand's own site when the record names one (both surfaces did this).
  const site = !url ? (product.whereToBuy || []).map((w) => String(w).trim()).find((w) => SITE.test(w)) : '';
  if (!url && site) url = `https://${site.toLowerCase()}`;
  const amazon = isAmazonUrl(url);
  const b = String(brand || product.brand || '').trim();
  const shownName = String(name || product.name || '').trim();
  // A service's own site reads as the service ("Planned Parenthood Direct"), not a domain.
  const retailer = !url ? '' : amazon ? 'Amazon' : partner && b ? b : isService && shownName.length <= 34 ? shownName : host(url);
  const fp = formatPrice(product);
  const price = priceMain != null ? priceMain : (fp.main !== 'Price at retailer' && fp.main.length <= 12 ? fp.main : '');
  const shown = shownName;
  const label = prelaunch ? (product.waitlistCtaLabel || 'Join the waitlist')
    : isService ? `Visit ${shown.length <= 34 ? shown : retailer || 'the site'}`
    : retailer ? `Buy at ${retailer.length <= 24 ? retailer : 'the seller'}${price ? ` · ${price}` : ''}` : '';
  const verb = isService ? 'get started' : 'buy';
  // Every store on file: the Buy link first, then other links, then stores named without a link.
  const others = retailerLinks(product, url);
  const named = (product.whereToBuy || []).map((w) => String(w).trim()).filter((w) => w && !SITE.test(w));
  const inStock = Object.entries(product.whereToBuyInStock || {}).filter(([, v]) => v).map(([k]) => k);
  const rows = [
    url && { name: retailer, url, price, primary: true, host: host(url) !== retailer ? host(url) : '' },
    ...others.map((r) => ({ name: r.name, url: r.url, price: '' })),
    ...named.filter((n) => ![retailer, ...others.map((r) => r.name)].some((x) => String(x).toLowerCase() === n.toLowerCase())).map((n) => ({ name: n, url: '', price: '' })),
  ].filter(Boolean).map((r) => ({ ...r, inStock: inStock.some((s) => s.toLowerCase() === String(r.name).toLowerCase()) }));
  const checkedRaw = getPassport(product)?.pricing?.price?.verified_at;
  const checked = fmtCheckDate(checkedRaw);
  return { url, retailer, label, price, isService, partner, prelaunch, amazon, verb, rows, checked: checked && price ? `Price checked ${checked.replace(/, \d{4}$/, '')}` : '' };
}
