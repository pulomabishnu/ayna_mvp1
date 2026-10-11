import { describe, expect, it } from 'vitest';
import { recommendationCount, selectEcosystemProducts } from './recommendationSelection.js';
const products = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, areaKey: 'period', percent: 90 - i * 10 }));
const score = (product) => ({ eligible: true, matchStatus: 'scored', healthMatch: 80, percent: product.percent });
describe('Ecosystem quantity qualification', () => {
  it('selects the best one when one is requested', () => {
    expect(selectEcosystemProducts(products.toReversed(), {}, 1, score).map((p) => p.id)).toEqual(['p0']);
  });
  it('does not fill five slots when only two qualify', () => {
    const candidates = products.map((p, i) => ({ ...p, percent: i < 2 ? 90 : 12 }));
    expect(selectEcosystemProducts(candidates, {}, 5, score)).toHaveLength(2);
  });
  it('defaults legacy users to three and applies the cap per area', () => {
    expect(recommendationCount(undefined)).toBe(3);
    expect(selectEcosystemProducts([...products, { id: 'sleep', areaKey: 'sleep', percent: 95 }], {}, undefined, score)).toHaveLength(4);
  });
  it('excludes unsafe and unrelated products even with a high preference score', () => {
    const assess = (p) => ({ ...score(p), eligible: p.id !== 'p0', healthMatch: p.id === 'p1' ? 0 : 80 });
    expect(selectEcosystemProducts(products, {}, 5, assess).map((p) => p.id)).toEqual(['p2', 'p3', 'p4']);
  });
  it('shows a product only once across groups', () => {
    expect(selectEcosystemProducts([products[0], { ...products[0], areaKey: 'sleep' }], {}, 3, score)).toHaveLength(1);
  });
});
