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
  const notes = [
    perUnit && !program ? perUnit : null,
    ...(price.known && price.sub ? String(price.sub).split(/\s+·\s+/).filter(Boolean).map((t) => t.replace(/^./, (c) => c.toUpperCase())) : []),
    ...quick,
  ].filter(Boolean);
  return {
    deposit: '',
    known: Boolean(price.known),
    main: price.main,
    isPlaceholder: Boolean(price.isPlaceholder),
    notes,
    rx: rx ? (product.requiresPrescription ? `Requires a prescription from ${brand || product.brand || 'the provider'}’s clinicians.` : `Can include prescription support from ${brand || product.brand || 'the provider'}’s clinicians, if you qualify.`) : '',
  };
}
