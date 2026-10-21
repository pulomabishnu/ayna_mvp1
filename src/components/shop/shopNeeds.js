import { ALL_PRODUCTS, isTeenProduct } from '../../data/products.js';

// Shop by need: the die-cut sticker row. Each sticker is a need from the quiz
// (mobile/data/intakeModel.js SUPPORT_GROUPS), in the words people use, and
// runs a real Shop search. The photo is a real catalog product for that need,
// one we host (so a slow retailer image never leaves a gap), never repeated.
export const NEED_STICKERS = [
  { id: 'cramps', label: 'Cramps', query: 'cramps', keys: ['heatwrap', 'heating pad', 'cramp'] },
  { id: 'heavy', label: 'Heavy flow', query: 'heavy flow', keys: ['heavy flow', 'overnight', 'heavy period'] },
  { id: 'uti', label: 'UTI', query: 'UTI', keys: ['uti', 'urinary', 'cranberry'] },
  { id: 'dryness', label: 'Dryness', query: 'vaginal dryness', keys: ['dryness', 'vaginal moistur'] },
  { id: 'pmos', label: 'PMOS', query: 'PMOS', keys: ['inositol', 'pcos', 'pmos'] },
  { id: 'leaks', label: 'Bladder leaks', query: 'bladder leaks', keys: ['incontinence', 'bladder leak', 'pelvic floor'] },
  { id: 'hot', label: 'Hot flashes', query: 'hot flashes', keys: ['hot flash', 'night sweat'] },
  { id: 'sleep', label: 'Sleep', query: 'sleep', keys: ['nighttime', 'sleep', 'magnesium'] },
];

// The "Does this sound familiar?" ribbon: real searches, said plainly.
export const FAMILIAR_PHRASES = ['bad cramps', 'heavy flow overnight', 'leaking when I sneeze', 'itchy down there', 'night sweats', 'UTI burning', 'hormonal acne', 'trying to conceive', 'vaginal dryness', 'sleep and stress'];

// Name, category and the catalog's need tags only (a summary can mention a need in passing).
const textOf = (p) => [p?.name, p?.category, ...(p?.tags || []), ...(p?.healthFunctions || [])].filter(Boolean).join(' ').toLowerCase();
const local = (p) => String(p?.image || '').startsWith('/') && !p.hidden && !isTeenProduct(p) && p.type !== 'digital' && p.category !== 'telehealth';

let cache = null;
export function needStickers() {
  if (cache) return cache;
  const used = new Set();
  const pool = ALL_PRODUCTS.filter(local);
  cache = NEED_STICKERS.map((n) => {
    // Keys in order of preference: a product named for the need first, then its tags.
    const free = (x) => !used.has(x.image);
    let p = null;
    for (const k of n.keys) { p = pool.find((x) => free(x) && String(x.name).toLowerCase().includes(k)); if (p) break; }
    if (!p) p = pool.find((x) => free(x) && n.keys.some((k) => textOf(x).includes(k)));
    if (p) used.add(p.image);
    return { ...n, image: p?.image || '', productName: p?.name || '' };
  }).filter((n) => n.image);
  return cache;
}
