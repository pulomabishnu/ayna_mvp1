/**
 * Her routine and shopping list, built from the products ayna matched her to.
 *
 * Nothing here is new advice. Where each product goes in the routine comes
 * from its catalog category; the "how" line is the first step of the
 * product's own how-to-use instructions (written by the team, with a source);
 * timing notes come only from her own data (insights.js), and only where
 * insights.js already says so (the period estimate and its caveat, a sleep
 * trend). No product is ever added here that matching did not pick.
 */

/** Where a catalog category sits in a routine. */
const SLOT_BY_CATEGORY = {
  supplement: 'daily', skincare: 'daily', hair: 'daily', 'gut-health': 'daily', tracker: 'daily',
  'pelvic-floor': 'daily', 'pelvic-floor-exerciser': 'daily', 'pelvic-floor-trainer': 'daily', 'mental-health': 'daily',
  sleep: 'night',
  pad: 'period', tampon: 'period', cup: 'period', disc: 'period', 'period-underwear': 'period', 'cramp-relief': 'period', 'cup-steamer': 'period',
  telehealth: 'care',
};

export const SLOTS = [
  { id: 'daily', title: 'Every day' },
  { id: 'night', title: 'At night' },
  { id: 'period', title: 'During your period' },
  { id: 'asneeded', title: 'When you need it' },
  { id: 'care', title: 'Care and check-ins' },
];

export const slotFor = (product) => SLOT_BY_CATEGORY[product?.category] || 'asneeded';

/** First instruction that says how to use it (skips hand washing, which every product says). */
export function howLine(product) {
  const steps = product?.howToUse?.steps;
  if (!Array.isArray(steps) || !steps.length) return null;
  const step = steps.find((s) => !/^wash (your )?hands/i.test(String(s).trim())) || steps[0];
  return { text: String(step).trim(), source: product.howToUse.sourceLabel || null, sourceUrl: product.howToUse.sourceUrl || null };
}

const fmtDay = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/**
 * @param {Array} products  products matching picked for her (her Ecosystem)
 * @param {object} [insights] buildInsights(...) output, or null when no health data
 */
export function buildRoutine(products = [], insights = null) {
  const sections = Object.fromEntries((insights?.sections || []).map((s) => [s.id, s]));
  const estimate = sections.cycle?.estimate || null;
  const sleepShorter = Boolean(sections.sleep?.signal);
  const seen = new Set();
  const slots = SLOTS.map((slot) => {
    const items = products
      .filter((p) => p && !seen.has(p.id) && slotFor(p) === slot.id)
      .map((p) => { seen.add(p.id); return { product: p, how: howLine(p) }; });
    if (!items.length) return null;
    let note = null;
    if (slot.id === 'period' && estimate) note = `Next period estimated around ${fmtDay(estimate.day)}. ${estimate.basis}`;
    if (slot.id === 'night' && sleepShorter) note = 'Your sleep has been shorter than your usual lately.';
    return { ...slot, items, note };
  }).filter(Boolean);
  return { slots, count: seen.size };
}

/**
 * Physical products only (apps and care are not something you buy at a store).
 * Period products move to the top with a date when her cycle data gives one.
 */
export function buildShoppingList(products = [], insights = null, { getBuyUrl = () => null } = {}) {
  const estimate = (insights?.sections || []).find((s) => s.id === 'cycle')?.estimate || null;
  const physical = products.filter((p) => p && p.type !== 'digital');
  const toItem = (p) => ({
    product: p,
    price: typeof p.price === 'string' && p.price.trim() ? p.price.trim() : null,
    where: Array.isArray(p.whereToBuy) ? p.whereToBuy.filter((w) => typeof w === 'string' && !/^https?:/i.test(w)).slice(0, 3) : [],
    buyUrl: getBuyUrl(p) || null,
  });
  const period = physical.filter((p) => slotFor(p) === 'period');
  const rest = physical.filter((p) => slotFor(p) !== 'period');
  const groups = [];
  if (estimate && period.length) {
    groups.push({ id: 'before-period', title: `Before your next period, around ${fmtDay(estimate.day)}`, items: period.map(toItem) });
    if (rest.length) groups.push({ id: 'rest', title: 'The rest of your routine', items: rest.map(toItem) });
  } else if (physical.length) {
    groups.push({ id: 'all', title: 'Your routine', items: physical.map(toItem) });
  }
  return { groups, count: physical.length };
}
