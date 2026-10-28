/**
 * Search titles, descriptions and image alt text for product pages, built
 * from catalog fields only (name, brand, category, health needs, summary,
 * price). Shared by the website's title effect (App.jsx) and the build-time
 * prerender (scripts/prerender.mjs) so crawlers and browsers see the same
 * words. Nothing here adds a claim the catalog doesn't already make.
 */
import { HEALTH_FUNCTIONS } from '../data/catalogTaxonomy.js';
import { brandOf } from '../mobile/data/brandFallback.js';
import { categoryLabel } from '../components/pdp/categoryLabel.js';
import { priceParts } from '../data/passport/priceParts.js';

export const SITE_ORIGIN = 'https://www.aynahealth.co';

// One product, in plain words ("Menstrual Cups" -> "menstrual cup").
const SINGULAR = {
  'trackers & wearables': 'tracker or wearable',
  diagnostics: 'at-home test',
  'pain + recovery': 'pain relief product',
  skin: 'skin care product',
  hair: 'hair care product',
  gut: 'gut health product',
  sleep: 'sleep product',
  'virtual care': 'virtual care service',
  'birth control': 'birth control',
  'cup steamer': 'cup steamer',
  'intimate care': 'intimate care product',
  'pelvic floor': 'pelvic floor product',
  'sexual wellness': 'sexual wellness product',
  'menopause support': 'menopause product',
  'pregnancy support': 'pregnancy product',
  'postpartum recovery': 'postpartum product',
  'mental wellness': 'mental wellness app or service',
  incontinence: 'incontinence product',
  'cramp relief': 'cramp relief product',
};

/** What the product is, in lower case and singular, from its catalog category. */
export function productKind(product) {
  const label = categoryLabel(product).toLowerCase().trim();
  if (!label) return '';
  if (SINGULAR[label]) return SINGULAR[label];
  return label.replace(/ies$/, 'y').replace(/s$/, '');
}

const GENERIC_NEEDS = new Set(['supplement', 'telehealth']);
// Short use for categories whose names already say the kind ("Saalt Menstrual Cup").
const CATEGORY_USE = {
  pad: 'period care', tampon: 'period care', cup: 'period care', disc: 'period care', 'period-underwear': 'period care',
  'pelvic-floor': 'pelvic floor training', 'pelvic-floor-exerciser': 'pelvic floor training', 'pelvic-floor-trainer': 'pelvic floor training',
  incontinence: 'bladder leaks',
};
/** The product's main health need as a short label ("period care"), or ''. */
export function productNeed(product) {
  const id = (product?.healthFunctions || []).find((n) => HEALTH_FUNCTIONS[n] && !GENERIC_NEEDS.has(n));
  return id ? HEALTH_FUNCTIONS[id].label.toLowerCase().replace(/^gut & /, '').replace(/\s*&\s*/g, ' and ') : '';
}

const startsWithBrand = (name, brand) => Boolean(brand) && String(name).toLowerCase().startsWith(String(brand).toLowerCase());

/** "Name by Brand" (brand left out when the name already starts with it). */
export function productNameWithBrand(product) {
  const name = String(product?.name || '').trim();
  const brand = brandOf(product);
  return brand && !startsWithBrand(name, brand) ? `${name} by ${brand}` : name;
}

/** What it's for, short: the kind of product, or its main need when the name already says the kind. */
export function productShortUse(product) {
  const kind = productKind(product);
  const need = productNeed(product);
  const name = String(product?.name || '').toLowerCase();
  const stem = kind.split(' ').slice(-1)[0];
  if (kind && stem && !name.includes(stem.replace(/y$/, ''))) return kind;
  return CATEGORY_USE[product?.category] || need || kind;
}

/** Document title: "Name by Brand: short use | ayna". */
export function productSeoTitle(product) {
  if (!product?.name) return 'Product not found | ayna';
  const use = productShortUse(product);
  return `${productNameWithBrand(product)}${use ? `: ${use}` : ''} | ayna`;
}

const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1).replace(/[\s,;:]+\S*$/, '')}…` : t;
};

/** First sentence of the catalog summary (20 to 200 characters), or ''. */
function leadSentence(summary) {
  const s = String(summary || '').replace(/\s*\(see [^()]+\)/i, '').replace(/\s*—\s*/g, ', ').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  // Whole sentences until there are at least 60 characters (one very short sentence says too little).
  const sentences = s.match(/.+?[.!?](?=\s|$)|.+$/g)?.map((x) => x.trim()).filter(Boolean) || [s];
  let out = '';
  for (const sentence of sentences) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (out && next.length > 200) break;
    out = next;
    if (out.length >= 60) break;
  }
  return out;
}

/**
 * Meta description (about 155 characters): name and brand, the first sentence
 * of the catalog summary, then the price when the catalog has a plain one.
 */
export function productSeoDescription(product) {
  if (!product?.name) return '';
  const head = productNameWithBrand(product);
  const lead = leadSentence(product.summary);
  const price = priceParts(product);
  const priceText = price.known && price.main ? ` Price: ${price.main}.` : '';
  const tail = ' Research, safety notes and fit on ayna.';
  if (!lead) return clip(`${head}: ${productShortUse(product) || 'product'} on ayna.${priceText}${tail}`, 158);
  const base = `${head}: ${lead}`;
  const withPrice = `${base}${priceText}`;
  if (withPrice.length + tail.length <= 158) return `${withPrice}${tail}`;
  if (withPrice.length <= 158) return withPrice;
  return clip(base, 158);
}

/** Descriptive alt text for a product photo ("Saalt Menstrual Cup by Saalt, menstrual cup, photo 2 of 3"). */
export function productImageAlt(product, index = 0, total = 1) {
  if (!product?.name) return '';
  const kind = productKind(product);
  const head = productNameWithBrand(product);
  const name = String(product.name).toLowerCase();
  const kindPart = kind && !name.includes(kind) ? `, ${kind}` : '';
  return `${head}${kindPart}${total > 1 ? `, photo ${index + 1} of ${total}` : ''}`;
}
