import { describe, it, expect } from 'vitest';
import { groupShelves } from './shelfGroups.js';

const sh = (needId, label, picks = []) => ({ needId, label, picks: picks.map(([productId, score]) => ({ productId, score })), productIds: picks.map(([id]) => id) });
describe('shelf groups', () => {
  it('period product support + heavy periods become one shelf, best score kept, no repeats', () => {
    const out = groupShelves([sh('period.product_support', 'Period product support', [['a', 94], ['b', 94]]), sh('pain.menstrual_cramp', 'Cramps', [['c', 80]]), sh('period.heavy', 'Heavy periods', [['a', 90], ['d', 70]])]);
    expect(out.map((x) => x.label)).toEqual(['Period products for a heavy flow', 'Cramps']);
    expect(out[0].productIds).toEqual(['a', 'b', 'd']);
    expect(out[0].needIds).toEqual(['period.product_support', 'period.heavy']);
  });
  it('hot flashes + night sweats share one shelf; a lone member keeps its name', () => {
    expect(groupShelves([sh('vasomotor.night_sweats', 'Night sweats', [['t', 58]]), sh('vasomotor.hot_flashes', 'Hot flashes', [['c', 67]])])[0].label).toBe('Hot flashes and night sweats');
    expect(groupShelves([sh('vasomotor.hot_flashes', 'Hot flashes', [['c', 67]])])[0].label).toBe('Hot flashes');
  });
});
