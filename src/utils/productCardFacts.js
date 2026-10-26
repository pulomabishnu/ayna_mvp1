// One product card anatomy for the website and the app (P1-4,
// docs/design-direction.md "Product card"): white tile with the heart in its
// corner → brand → name (2 lines) → kind (sentence case) + at most one badge →
// match → price with its unit spelled out. Both ProductCard components read
// their words from here so the two never drift apart again.
import { CATEGORY_LABELS } from '../data/catalogTaxonomy.js';
import { sentenceCase } from './sentenceCase.js';
import { isPartnerBrandItem } from './partnerBrands.js';
import { formatPrice } from './formatPrice.js';
import { localEstimate, visitorLocale } from './localPrice.js';
import { costPerUse, capacityMl, lifespanYears, supplyDays } from '../components/pdp/decision.js';
import { wearHours, cupOrDisc, topWarningFor, pageRecall, SEVERE } from '../components/pdp/pdpParts.js';
import { evidenceFor, LEVELS, levelCountWords, levelLabel } from '../components/pdp/evidenceLevels.js';

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

// Outside the US the second line also carries a "≈ €23" estimate in the
// visitor's currency (src/utils/localPrice.js). The main line stays in USD.
export function cardPrice(product, { locale } = {}) {
  if (product?.userAdded === true) return { main: 'Added by you', sub: '' };
  if (/deposit/i.test(String(product?.price || ''))) return { main: 'Coming soon', sub: 'Waitlist' };
  const raw = formatPrice(product);
  if (/check (the )?retailer|varies by retailer/i.test(String(raw.main || ''))) return { main: 'Price at retailer', sub: '' };
  const estimate = localEstimate(raw.main, locale || visitorLocale());
  return estimate ? { ...raw, sub: [raw.sub, estimate].filter(Boolean).join(' · '), estimate } : raw;
}

// ---------------------------------------------------------------------------
// The card's fixed slots (PDP build brief "Product cards"; Explore audit v2
// sections 10-12). Read by the website card and the app card, so the two
// show the same facts in the same places:
//   1 plate + one category sticker   2 brand · name   3 match + reason
//   4 price + per-use chip + size pills   5 two or three fact chips
//   6 evidence mark + safety icon   7 partner tag + save heart
// Every value comes from the product record or the PDP's own helpers;
// a fact that is not on file is left out, never guessed.
// ---------------------------------------------------------------------------

// Size words a variant label may carry (Glossier-style pills). Colours are not sizes.
const SIZE_PART = /^(?:x{0,2}s|m|x{0,2}l|\dx|small|medium|large|regular|super(?: plus)?|light|long|overnight|extra heavy overnight|light \/ regular|regular \/ super|mini|short|high|jumbo|standard|model \d+|size \d+|[ab]|\d+(?:\.\d+)?\s*(?:count|ct|caps|capsules|caplets|tests?|pads?|tampons?|liners?|pack|oz(?: \/ \d+ ml)?|ml|tea bags?)|\d+|\d+-pack[^/]*|1 box[^/]*)$/i;

/** The product's real size options from its variants ("Small", "Regular"), in order, or []. */
export function cardSizes(product) {
  const vs = Array.isArray(product?.variants) ? product.variants : [];
  const out = [];
  for (const v of vs) {
    const label = String(typeof v === 'string' ? v : v?.label || '').trim();
    if (!label) continue;
    const parts = label.replace(/\(([^)]+)\)/g, ' / $1').split(/\s+(?:\/|—|-|\|)\s+/).map((s) => s.trim()).filter(Boolean);
    const whole = SIZE_PART.test(label) ? label : '';
    const size = whole || parts.find((x) => SIZE_PART.test(x)) || '';
    if (size && !out.some((x) => x.toLowerCase() === size.toLowerCase())) out.push(size);
  }
  if (out.length < 2) return [];
  // Already said on the price line ("14 or 24 count"): no pills repeating it.
  const priceText = String(product?.price || '').toLowerCase();
  if (out.every((x) => { const n = x.match(/\d+/); return n && priceText.includes(n[0]); })) return [];
  return out;
}

/** "≈ $0.24 a cycle" (reusables) or "≈ $0.33 a day" (supplies), from the PDP's costPerUse; null when unknown. */
export function cardPerUse(product) {
  const c = costPerUse(product);
  return c ? { text: c.text.replace(/ if it lasts .*$/, ''), math: c.math } : null;
}

/** Two or three short facts from the record ("Holds 25–37 mL", "Reusable 10 yrs", "FSA/HSA"). */
export function cardFacts(product, { max = 2 } = {}) {
  if (!product || product.type === 'digital') return [];
  const out = [];
  const cap = capacityMl(product);
  if (cap) out.push(`Holds ${cap}`);
  const h = wearHours(product);
  if (h && cupOrDisc(product)) out.push(`Up to ${h} hrs`);
  // Lifespan and supply already show in the per-use chip ("≈ $0.24 a cycle"), so only when there is none.
  const perUse = Boolean(costPerUse(product));
  const life = lifespanYears(product);
  if (life && !perUse) out.push(`Reusable ${life.upTo ? 'up to ' : ''}${life.years} yrs`);
  const days = supplyDays(product);
  if (days && !perUse) out.push(`${days}-day supply`);
  const dose = String(product.name || '').match(/\b(\d+(?:\.\d+)?)\s*(mg|mcg|IU)\b/i);
  if (dose && !cap) out.push(`${dose[1]} ${dose[2].toLowerCase() === 'iu' ? 'IU' : dose[2].toLowerCase()}`);
  // FSA/HSA from structured catalog fields only (same rule as the Shop filter).
  const both = ['pad', 'tampon', 'cup', 'disc'].includes(product.category) || product.fsaHsaEligible === true || product.fsa_hsa_eligible === true;
  const fsa = both || product.fsaEligible === true || product.fsa_eligible === true;
  const hsa = both || product.hsaEligible === true || product.hsa_eligible === true;
  if (fsa || hsa) out.push(fsa && hsa ? 'FSA/HSA' : fsa ? 'FSA' : 'HSA');
  return out.slice(0, max);
}

const evCache = new WeakMap();
/**
 * The one evidence mark for a card (PDP evidenceLevels): the .gov grade when
 * there is one, else the strongest level on file with its count. People's
 * posts are not evidence here (they live in Reviews).
 * @returns {null | { level: 'gov'|'peer'|'brand', text: string, label: string }}
 */
export function cardEvidence(product) {
  if (!product || typeof product !== 'object') return null;
  if (evCache.has(product)) return evCache.get(product);
  let out = null;
  try {
    const ev = evidenceFor(product);
    if (ev.graded) out = { level: 'gov', text: ev.status, label: `${ev.status}. ${levelLabel('gov')}` };
    else {
      const top = LEVELS.find((l) => l.id !== 'people' && ev.counts[l.id] > 0);
      const n = top ? ev.counts[top.id] : 0;
      const words = !top ? '' : top.id === 'gov' ? `${n} .gov ${n === 1 ? 'source' : 'sources'}` : top.id === 'peer' ? `${n} peer-reviewed` : `From ${ev.brand || 'the brand'}`;
      if (top) out = { level: top.id, text: words, label: `${levelLabel(top.id, ev.brand)}: ${levelCountWords(top.id, n, ev.brand)}` };
    }
  } catch { out = null; }
  evCache.set(product, out);
  return out;
}

const warnCache = new WeakMap();
/**
 * The product's top safety note (the PDP's topWarningFor) when it is one a
 * card should flag: a recall or a severe warning (SEVERE). Ordinary label
 * cautions stay on the product page, so the icon keeps its meaning. Or ''.
 */
export function cardSafety(product) {
  if (!product || typeof product !== 'object') return '';
  if (warnCache.has(product)) return warnCache.get(product);
  let w = '';
  try {
    const recall = pageRecall(product);
    const top = topWarningFor(product, null, recall) || '';
    w = recall?.status === 'past' || recall?.status === 'note' || SEVERE.test(top) ? top : '';
  } catch { w = ''; }
  warnCache.set(product, w);
  return w;
}
