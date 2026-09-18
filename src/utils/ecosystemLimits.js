export const MAX_ECOSYSTEM_PRODUCTS_PER_CATEGORY = 5;

const PERIOD_CATEGORIES = new Set([
  'pad',
  'pads',
  'tampon',
  'tampons',
  'cup',
  'cups',
  'disc',
  'discs',
  'liner',
  'liners',
  'period-underwear',
  'period underwear',
  'menstrual-care',
  'menstrual care',
  'period-care',
  'period care',
]);

const PERIOD_HEALTH_FUNCTIONS = new Set([
  'menstrual-collection',
  'leak-protection',
  'period-care',
  'menstrual-care',
]);

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function asStringArray(value) {
  return Array.isArray(value) ? value.map(normalize).filter(Boolean) : [];
}

function numericMatch(product) {
  const values = [
    product?.aynaMatchPercent,
    product?.matchPercent,
    product?.matchPercentage,
    product?.aynaMatch,
  ];
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return -1;
}

/**
 * Broad care-category key used only to prevent a single ecosystem area from
 * exploding into dozens of products. This is intentionally broader than the
 * catalog's raw categories: pads, tampons, cups, discs, liners and period
 * underwear are all one "period-care" ecosystem category.
 */
export function getEcosystemCategoryKey(product) {
  const healthFunctions = asStringArray(product?.healthFunctions);

  if (healthFunctions.some((value) => PERIOD_HEALTH_FUNCTIONS.has(value))) {
    return 'period-care';
  }

  const concern = normalize(product?._llmConcern);
  if (
    concern.includes('period care') ||
    concern.includes('menstrual') ||
    concern.includes('heavy flow') ||
    concern.includes('leak') ||
    concern.includes('staining')
  ) {
    return 'period-care';
  }

  const category = normalize(product?.category);
  if (PERIOD_CATEGORIES.has(category) || category.startsWith('period-')) {
    return 'period-care';
  }

  // healthFunctions are the most stable cross-client care taxonomy for
  // non-period products. Use the first one when available.
  if (healthFunctions.length > 0) return healthFunctions[0];

  return category || normalize(product?.type) || 'other';
}

/**
 * Keep at most maxPerCategory products in each broad ecosystem category.
 *
 * Selection prefers explicitly-prioritized products (for example tracked/manual
 * items), then higher stored match scores, then the original recommendation
 * order. The returned list is restored to original order for stable UI layout.
 *
 * This does not delete or mutate any product data. Callers can use the limited
 * list for rendering/persistence while saved/tracked/history data remains intact.
 */
export function limitEcosystemProductsByCategory(
  products,
  maxPerCategory = MAX_ECOSYSTEM_PRODUCTS_PER_CATEGORY,
  { priorityIds = new Set() } = {}
) {
  const valid = (Array.isArray(products) ? products : []).filter((product) => product?.id);
  const max = Math.max(1, Number(maxPerCategory) || MAX_ECOSYSTEM_PRODUCTS_PER_CATEGORY);
  const priority = priorityIds instanceof Set ? priorityIds : new Set(priorityIds || []);

  const indexed = valid.map((product, index) => ({ product, index }));
  indexed.sort((a, b) => {
    const aPriority = priority.has(a.product.id) ? 1 : 0;
    const bPriority = priority.has(b.product.id) ? 1 : 0;
    if (aPriority !== bPriority) return bPriority - aPriority;

    const scoreDelta = numericMatch(b.product) - numericMatch(a.product);
    if (scoreDelta !== 0) return scoreDelta;

    return a.index - b.index;
  });

  const counts = new Map();
  const selectedIds = new Set();

  for (const { product } of indexed) {
    const key = getEcosystemCategoryKey(product);
    const count = counts.get(key) || 0;
    if (count >= max) continue;
    counts.set(key, count + 1);
    selectedIds.add(product.id);
  }

  return valid.filter((product) => selectedIds.has(product.id));
}

export function limitEcosystemProductMapByCategory(
  productMap,
  maxPerCategory = MAX_ECOSYSTEM_PRODUCTS_PER_CATEGORY,
  options
) {
  const products = Object.values(productMap || {});
  const limited = limitEcosystemProductsByCategory(products, maxPerCategory, options);
  return Object.fromEntries(limited.map((product) => [product.id, product]));
}
