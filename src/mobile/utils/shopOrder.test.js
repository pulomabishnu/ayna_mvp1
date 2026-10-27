import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../../data/products.js';
import { stableShopOrder, rankShopForProfile, featuredShopOrder } from './shopOrder.js';
import { featuredOrder } from '../../data/packshots.js';
import { splitCatalog, isService } from '../../utils/search/exploreSearch.js';
import { formatPrice } from '../../utils/formatPrice.js';

describe('shop default order', () => {
  it('is the same order for the same session seed', () => {
    expect(stableShopOrder(ALL_PRODUCTS, 42).map((p) => p.id)).toEqual(stableShopOrder(ALL_PRODUCTS, 42).map((p) => p.id));
  });
  it('drops midlife products to the end for a 24-year-old with regular periods', () => {
    const answers = { age: 24, lifeStageSelections: ['I have regular periods'], supportSelections: ['Cramps or period pain'], priceRange: ['Under $25'] };
    const ranked = rankShopForProfile(stableShopOrder(ALL_PRODUCTS, 7), answers);
    const firstTwenty = ranked.slice(0, 20);
    expect(firstTwenty.some((p) => (p.healthFunctions || []).includes('perimenopause'))).toBe(false);
    expect(ranked).toHaveLength(ALL_PRODUCTS.length);
  });
});

describe('formatPrice with two sizes', () => {
  it('keeps each size whole', () => {
    expect(formatPrice({ price: '$24.99 (50 mL) · $12.99 (1.0 fl oz trial size)' })).toEqual({ main: '$24.99', sub: '50 mL · $12.99 (1.0 fl oz trial size)' });
  });
});

// QA3 M8: the app Products tab changed order on every load and listed
// services (Visana, Midi) among products.
describe('Products tab: fixed Featured order, products only', () => {
  it('the same order on every load, the website Featured order', () => {
    const a = featuredShopOrder(ALL_PRODUCTS).map((p) => p.id);
    expect(featuredShopOrder(ALL_PRODUCTS).map((p) => p.id)).toEqual(a);
    expect(a).toEqual(featuredOrder(ALL_PRODUCTS).map((p) => p.id));
  });
  it('with a profile the ranking is deterministic too', () => {
    const answers = { fullHealthIntake: { age: '30', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Heavy periods'] } };
    const one = rankShopForProfile(featuredShopOrder(ALL_PRODUCTS), answers).map((p) => p.id);
    expect(rankShopForProfile(featuredShopOrder(ALL_PRODUCTS), answers).map((p) => p.id)).toEqual(one);
  });
  it('services are split out of products', () => {
    const { products, services } = splitCatalog(ALL_PRODUCTS);
    for (const id of ['d-visana', 'd-midi-health']) {
      expect(isService(ALL_PRODUCTS.find((p) => p.id === id))).toBe(true);
      expect(products.some((p) => p.id === id)).toBe(false);
      expect(services.some((p) => p.id === id)).toBe(true);
    }
    expect(products.every((p) => p.type !== 'digital')).toBe(true);
  });
  it('bleeding after menopause: period products go to the end', () => {
    const answers = { fullHealthIntake: { age: '54', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Heavy periods'], periodFlow: 'Heavy', safetyConcern: 'No', takesCurrent: 'No', allergyStatus: 'No' } };
    const { products } = splitCatalog(ALL_PRODUCTS);
    const ranked = rankShopForProfile(featuredShopOrder(products), answers);
    const PERIOD = new Set(['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cup-steamer']);
    expect(ranked.slice(0, 20).some((p) => PERIOD.has(p.category))).toBe(false);
  });
});
