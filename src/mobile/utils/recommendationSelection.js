import { getProductMatchDetailsForProduct } from '../../data/products.js';

export const MIN_ECOSYSTEM_MATCH_PERCENT = 30;
export function recommendationCount(value) {
  return [1, 2, 3, 5].includes(Number(value)) ? Number(value) : 3;
}

// Safety and real health relevance qualify products before quantity is applied.
// A short list stays short; the count never relaxes qualification.
export function selectEcosystemProducts(products, profile, count, score = getProductMatchDetailsForProduct) {
  const seen = new Set();
  const counts = new Map();
  return products.map((product) => ({ product, details: score(product, profile) }))
    .filter(({ details }) => details.eligible !== false && details.matchStatus === 'scored' && details.healthMatch > 0 && details.percent >= MIN_ECOSYSTEM_MATCH_PERCENT)
    .sort((a, b) => b.details.percent - a.details.percent)
    .filter(({ product }) => {
      const area = product.areaKey || 'other';
      const taken = counts.get(area) || 0;
      if (seen.has(product.id) || taken >= recommendationCount(count)) return false;
      seen.add(product.id);
      counts.set(area, taken + 1);
      return true;
    }).map(({ product }) => product);
}
