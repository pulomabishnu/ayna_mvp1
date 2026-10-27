// The price block at the top of a product page, as data: ProductModal renders
// it with <HeroPrice>, and the build (scripts/prerender.mjs, heroSeed.js)
// computes the same thing for the page's first paint. Moved unchanged from
// ProductModal.jsx.
import { sizeCount } from './glance.js';

export function heroPriceView(product, { price, perUnit, glance, brand }) {
  // A deposit isn't a price; programs, services and subscriptions have no "per unit".
  const raw = String(product.price || '');
  const deposit = /deposit/i.test(raw) ? (raw.match(/\$\s?\d[\d,.]*/) || [''])[0] : '';
  const program = product.type === 'digital' || product.category === 'telehealth' || product.requiresPrescription || /program|month|subscription|\/mo\b|year/i.test(raw);
  const rx = product.requiresPrescription || /\brx\b|prescription/i.test(`${product.name} ${product.summary || ''}`) && product.category === 'telehealth';
  const size = sizeCount(product);
  const fsa = (glance?.facts || []).find((f) => f.id === 'fsa' && !f.unknown);
  const priceAll = `${product.price || ''} ${price.sub || ''}`;
  const quick = [
    // Long pack lists live once, in Buy; the header keeps short ones.
    size?.text && size.text.length <= 40 && !String(price.sub || '').toLowerCase().includes(size.text.toLowerCase()) ? size.text : null,
    fsa && fsa.value === 'Eligible' ? 'FSA/HSA eligible' : null,
    // A one-time "3-month program" is not a subscription; only recurring billing is.
    /\/month|per month|subscription|\/mo\b|per year|\/year|monthly|annually/i.test(priceAll) && !/subscri/i.test(price.sub || '') ? 'Subscription' : null,
    product.type === 'digital' ? 'At home, online' : null,
    product.requiresPrescription ? 'Prescription required' : null,
  ].filter(Boolean);
  if (deposit) return { deposit, known: false, main: '', isPlaceholder: false, notes: [], rx: '' };
  const notes = factChips([
    perUnit && !program ? perUnit : null,
    ...(price.known && price.sub ? String(price.sub).split(/\s+·\s+/).filter(Boolean).map((t) => t.replace(/^./, (c) => c.toUpperCase())) : []),
    ...quick,
  ].filter(Boolean), size);
  return {
    deposit: '',
    known: Boolean(price.known),
    main: price.main,
    isPlaceholder: Boolean(price.isPlaceholder),
    notes,
    rx: rx ? (product.requiresPrescription ? `Requires a prescription from ${brand || product.brand || 'the provider'}’s clinicians.` : `Can include prescription support from ${brand || product.brand || 'the provider'}’s clinicians, if you qualify.`) : '',
  };
}

// A note about the pack size: "18", "18 tampons", "Pack of 14", "50 g (1.76 oz)", "30 or 60 caplets".
// Not a price, a per-unit figure or a supply length ("180-day supply").
const COUNTISH = /^(?:pack of\s+)?\d[\d.,]*(?:\s*(?:–|-|or|to)\s*\d[\d.,]*)?(?!\s*[-–]?\s*(?:day|month|year|week)s?\b)(?:\s|[a-z]|$)/i;
const lead = (t) => { const m = String(t).match(/\d[\d.,]*/); return m ? Number(m[0].replace(/,/g, '')) : null; };

/**
 * Fact chips under the price (founder, Oct 27: "is all this necessary"): one pack size, never two
 * that disagree or say the same thing. The reviewed record's size wins (sizeCount reads it first);
 * a catalog count that contradicts it is dropped, and the size is said once, short ("16 tampons").
 * Per-unit maths only survives when it was worked out from that same count (perUnitLabel).
 * Count first, then the per-unit price, then the rest; pages show MAX_PRICE_CHIPS.
 */
export function factChips(notes, size) {
  const list = notes.map((t) => String(t || '').trim()).filter(Boolean);
  const isCount = (t) => !/\$/.test(t) && COUNTISH.test(t);
  const counts = list.filter(isCount);
  let countChip = null;
  if (size?.text) {
    const short = size.n && size.word ? `${size.n} ${size.word}` : size.text.replace(/\s*[(;].*$/, '').trim();
    if (short && short.length <= 24) countChip = short;
    // Else the catalog's own words, when they agree with the reviewed number.
    else countChip = counts.find((t) => lead(t) === (size.n || lead(size.text)) && t.length <= 24) || null;
  } else {
    countChip = counts[0] || null;
  }
  const rest = list.filter((t) => !isCount(t) && !(size?.text && t === size.text));
  const per = rest.filter((t) => /^\$[\d.]+ per /.test(t));
  const others = rest.filter((t) => !per.includes(t));
  const seen = new Set();
  return [countChip, ...per, ...others].filter((t) => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()));
}

/** At most two chips by the price; the rest move to Product facts (nothing is dropped). */
export const MAX_PRICE_CHIPS = 2;
