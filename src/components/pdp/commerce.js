/**
 * The e-commerce parts of the product page (website + app): photo gallery,
 * retailer links, breadcrumbs, "compare with similar", "you may also like"
 * and the website's JSON-LD. Real catalog fields only: an unknown value is
 * "Not on file", and nothing here makes up ratings, stock or shipping.
 */
import { ALL_PRODUCTS, HEALTH_FUNCTIONS } from '../../data/products.js';
import { PRODUCT_IMAGE_OVERRIDES } from '../../data/productImageOverrides.js';
import { getPassport } from '../../data/passport/index.js';
import { priceParts, safetyAlertText } from '../../data/passport/content.js';
import { isPlaceholderProductImage } from '../../utils/resolveProductImage.js';
import { brandOf } from '../../mobile/data/brandFallback.js';
import { recallFacts } from '../../utils/productFacts.js';
import { categoryLabel, ingredientHeadline, perUnitLabel, sizeCount, NOT_ON_FILE } from './glance.js';

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------
const imgSrc = (v) => (typeof v === 'string' ? v.trim() : v && typeof v === 'object' ? String(v.src || v.url || v.cover || '').trim() : '');

/**
 * Photos for the gallery, cover first, deduped. Override entries may be a
 * plain string or { cover, gallery: [...] }; catalog entries may carry
 * `gallery` or `images` arrays.
 */
export function galleryImages(product) {
  if (!product) return [];
  const override = PRODUCT_IMAGE_OVERRIDES[product.id];
  const list = [];
  const add = (v) => {
    const s = imgSrc(v);
    if (s && !list.includes(s) && !isPlaceholderProductImage(s, product.type === 'digital')) list.push(s);
  };
  if (override && typeof override === 'object') {
    add(override.cover);
    (override.gallery || []).forEach(add);
  } else if (override) add(override);
  add(product.image);
  (Array.isArray(product.gallery) ? product.gallery : []).forEach(add);
  (Array.isArray(product.images) ? product.images : []).forEach(add);
  return list;
}

// ---------------------------------------------------------------------------
// Retailers
// ---------------------------------------------------------------------------
function hasRealPath(url) {
  try {
    const u = new URL(url);
    return u.pathname.replace(/\/+$/, '').length > 0 || u.search.length > 0;
  } catch { return false; }
}
function isSearchUrl(url) {
  try {
    const u = new URL(url);
    return /(^|\/)(s|search)(\/|$)/.test(u.pathname.toLowerCase()) || ['k', 'searchTerm', 'Ntt'].some((k) => u.searchParams.has(k)) || u.searchParams.get('tbm') === 'shop';
  } catch { return true; }
}
export function isExactUrl(value) {
  const url = String(value || '').trim();
  return /^https?:\/\//i.test(url) && hasRealPath(url) && !isSearchUrl(url);
}
const hostKey = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };

/** Extra retailer buttons: named links from the catalog, minus the main Buy link. */
export function retailerLinks(product, buyUrl) {
  const links = product?.whereToBuyLinks && typeof product.whereToBuyLinks === 'object' ? product.whereToBuyLinks : {};
  const out = [];
  const seen = new Set([hostKey(buyUrl)]);
  for (const [name, url] of Object.entries(links)) {
    if (!isExactUrl(url)) continue;
    const h = hostKey(url);
    if (seen.has(h)) continue;
    seen.add(h);
    out.push({ name: String(name).replace(/\.com$/i, (m) => m.toLowerCase()), url: String(url).trim() });
  }
  return out.slice(0, 4);
}

/** Where the main Buy link goes, as a short name ("cora.life"). */
export function buyHost(buyUrl) {
  return hostKey(buyUrl);
}

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------
export function breadcrumbs(product) {
  if (!product) return [];
  const cat = categoryLabel(product);
  return [
    { label: 'Shop', href: '/shop', kind: 'shop' },
    ...(cat ? [{ label: cat, href: '/shop', kind: 'category', category: product.category }] : []),
    { label: product.name, kind: 'current' },
  ];
}

// ---------------------------------------------------------------------------
// Similar products and compare table
// ---------------------------------------------------------------------------
function overlap(a = [], b = []) {
  const B = new Set(b);
  return a.filter((x) => B.has(x)).length;
}

/**
 * Up to `limit` products from the same category, closest first: shared
 * health uses and tags, then a different brand (so it is a real
 * alternative), then a known price.
 */
export function similarProducts(product, { pool = ALL_PRODUCTS, limit = 3, exclude = [] } = {}) {
  if (!product) return [];
  const skip = new Set([product.id, ...exclude]);
  const brand = brandOf(product).toLowerCase();
  const scored = pool
    .filter((p) => p && p.id && p.name && !skip.has(p.id) && p.category === product.category && p.type === product.type)
    .map((p) => {
      let s = overlap(p.healthFunctions, product.healthFunctions) * 3 + overlap(p.tags, product.tags) * 2;
      if (brandOf(p).toLowerCase() !== brand) s += 2;
      if (priceParts(p).known) s += 1;
      if (galleryImages(p).length) s += 1;
      return { p, s };
    })
    .sort((a, b) => b.s - a.s || String(a.p.name).localeCompare(String(b.p.name)));
  const out = [];
  const brands = new Set([brand]);
  for (const { p } of scored) {
    const b = brandOf(p).toLowerCase();
    if (brands.has(b) && scored.length > limit + 2) continue; // one per brand when we can
    brands.add(b);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Products for the same health need from other categories (what you might
 * use alongside it). Not "often bought together": we have no purchase data.
 */
export function sameNeedProducts(product, { pool = ALL_PRODUCTS, limit = 4, exclude = [] } = {}) {
  if (!product) return [];
  const needs = (product.healthFunctions || []).filter((id) => HEALTH_FUNCTIONS[id] && id !== 'supplement' && id !== 'telehealth');
  if (!needs.length) return [];
  const skip = new Set([product.id, ...exclude]);
  return pool
    .filter((p) => p && p.id && p.name && !skip.has(p.id) && p.category !== product.category && overlap(p.healthFunctions, needs) > 0)
    .map((p) => ({ p, s: overlap(p.healthFunctions, needs) * 2 + (galleryImages(p).length ? 1 : 0) + (priceParts(p).known ? 1 : 0) }))
    .sort((a, b) => b.s - a.s || String(a.p.name).localeCompare(String(b.p.name)))
    .slice(0, limit)
    .map((x) => x.p);
}

/** Where to buy, the same answer the product page gives: named retailers, else the seller its Buy link goes to. */
export function whereToBuyLine(product) {
  const named = [...new Set((product?.whereToBuy || []).map((x) => String(x).trim()).filter(Boolean))];
  if (named.length) return named.slice(0, 4).join(', ');
  const link = [product?.affiliateUrl, product?.buyUrl, product?.purchaseUrl, product?.url, product?.website].find((u) => isExactUrl(u) || /^https?:\/\//i.test(String(u || '')));
  if (!link) return NOT_ON_FILE;
  const brand = brandOf(product);
  return brand ? `${brand} (online)` : `${hostKey(link)} (online)`;
}

function evidenceSummary(product) {
  const pp = getPassport(product);
  const srcs = pp?.sources?.all?.known ? pp.sources.all.value.filter((s) => !['manufacturer', 'community'].includes(s.evidence_type)) : [];
  const strength = String(product?.evidenceStrength || '').trim();
  if (!srcs.length && !strength) return NOT_ON_FILE;
  const parts = [];
  if (strength) parts.push(`${strength.charAt(0).toUpperCase()}${strength.slice(1)}`);
  if (srcs.length) parts.push(`${srcs.length} source${srcs.length === 1 ? '' : 's'}${pp.evidence.product_specific ? ', incl. a product study' : ''}`);
  return parts.join(' · ');
}

/**
 * Rows for the compare table. Each row: { label, values: [string per product] }.
 * Rows where every product is "Not on file" are dropped.
 */
export function compareRows(products, { matchFor = null } = {}) {
  const isDigital = products.every((p) => p?.type === 'digital');
  const rows = [
    { label: 'Price', get: (p) => { const pr = priceParts(p); return pr.known ? pr.main : 'At the retailer'; } },
    !isDigital ? { label: 'Size or count', get: (p) => sizeCount(p)?.text || NOT_ON_FILE } : null,
    !isDigital ? { label: 'Price per unit', get: (p) => perUnitLabel(p) || NOT_ON_FILE } : null,
    isDigital ? { label: 'Available on', get: (p) => String(p.platform || '').trim() || NOT_ON_FILE } : null,
    !isDigital ? { label: 'Ingredients or materials', get: (p) => ingredientHeadline(p, 48) || NOT_ON_FILE } : null,
    { label: 'Evidence on file', get: evidenceSummary },
    { label: 'Safety notes', get: (p) => {
      const notes = [];
      if (recallFacts(p).status === 'past') notes.push('Past recall');
      if (safetyAlertText(p)) notes.push('Safety note');
      const preg = getPassport(p)?.safety?.pregnancy;
      const pv = preg?.known && !preg.notApplicable ? String(Array.isArray(preg.value) ? preg.value.join(' ') : preg.value || '') : '';
      if (pv && /not|avoid|consult|ask|doctor|clinician|don.t|do not|unsafe|caution/i.test(pv)) notes.push('Pregnancy caution');
      return notes.length ? `${notes.join(', ')}, see its page` : 'None flagged';
    } },
    { label: 'FSA/HSA', get: (p) => { if (['pad', 'tampon', 'cup', 'disc'].includes(p?.category)) return 'Eligible'; const f = getPassport(p)?.pricing?.fsa_hsa; return f?.known ? (f.value === 'eligible' ? 'Eligible' : 'Not eligible') : NOT_ON_FILE; } },
    { label: 'Where to buy', get: whereToBuyLine },
    matchFor ? { label: 'Your match', get: (p) => { const m = matchFor(p); return Number.isFinite(m) && m > 0 ? `${Math.round(m)}%` : 'No clear match'; } } : null,
  ].filter(Boolean);
  return rows
    .map((r) => ({ label: r.label, values: products.map((p) => r.get(p)) }))
    .filter((r) => r.values.some((v) => v !== NOT_ON_FILE));
}

// ---------------------------------------------------------------------------
// JSON-LD (website)
// ---------------------------------------------------------------------------
/** A single plain price ("$18", "$10 for 32"), or null for ranges, "From", monthly plans. */
export function offerPrice(product) {
  const p = String(product?.price || '').trim();
  if (!p || /[-–]\s*\$?\d|~|\bfrom\b|\babout\b|\/\s*(mo|month|year|yr|visit|session)|per (month|session|visit)|\bor\b|€|£/i.test(p)) return null;
  const m = p.match(/^\$\s*(\d+(?:\.\d{1,2})?)\b/);
  return m ? Number(m[1]).toFixed(2) : null;
}

const absolute = (src, origin) => {
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  return `${origin.replace(/\/$/, '')}/${String(src).replace(/^\//, '')}`;
};

/**
 * schema.org Product for the page. No aggregateRating or review unless real
 * ayna member ratings exist (and then only their count and average).
 */
export function productJsonLd(product, { origin = 'https://www.aynahealth.co', buyUrl = null, url = '', aynaRating = null, ratingCount = 0 } = {}) {
  if (!product) return null;
  const images = galleryImages(product).map((s) => absolute(s, origin)).filter(Boolean);
  const brand = brandOf(product);
  const price = offerPrice(product);
  const pageUrl = url || `${origin.replace(/\/$/, '')}/product/${encodeURIComponent(product.id)}`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: pageUrl,
    ...(images.length ? { image: images } : {}),
    ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}),
    ...(product.summary ? { description: String(product.summary).replace(/\s*, \s*/g, ', ').slice(0, 500) } : {}),
    ...(categoryLabel(product) ? { category: categoryLabel(product) } : {}),
  };
  if (price && buyUrl) data.offers = { '@type': 'Offer', price, priceCurrency: 'USD', url: buyUrl };
  if (Number.isFinite(aynaRating) && ratingCount > 0) data.aggregateRating = { '@type': 'AggregateRating', ratingValue: Number(aynaRating.toFixed(1)), ratingCount };
  return data;
}

export function breadcrumbJsonLd(product, { origin = 'https://www.aynahealth.co' } = {}) {
  const crumbs = breadcrumbs(product);
  if (!crumbs.length) return null;
  const base = origin.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.kind === 'current' ? {} : { item: `${base}${c.href}` }),
    })),
  };
}
