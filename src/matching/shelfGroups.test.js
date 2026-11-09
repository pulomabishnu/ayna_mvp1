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

import { groupSymptomShelves, groupRevealRows } from './shelfGroups.js';

describe('symptom shelf presentation', () => {
  it('combines mood and temperature symptoms without losing eligible products', () => {
    const grouped = groupSymptomShelves([
      { needId: 'mood.general_anxiety', label: 'Anxiety', picks: [{ productId: 'meditation' }], productIds: ['meditation'] },
      { needId: 'mood.irritability', label: 'Irritability', picks: [{ productId: 'meditation' }, { productId: 'breathing' }], productIds: ['meditation', 'breathing'] },
      { needId: 'vasomotor.hot_flashes', label: 'Hot flashes', picks: [{ productId: 'cooling' }], productIds: ['cooling'] },
      { needId: 'vasomotor.night_sweats', label: 'Night sweats', picks: [{ productId: 'sleepwear' }], productIds: ['sleepwear'] },
    ]);
    expect(grouped.map((s) => s.label)).toEqual(['Mental wellbeing', 'Temperature & sweating']);
    expect(grouped[0].productIds).toEqual(['meditation', 'breathing']);
    expect(grouped[1].productIds).toEqual(['cooling', 'sleepwear']);
  });
  it('puts period bloating with period concerns and shows mood products and services together', () => {
    const product = { id: 'period-comfort' };
    const service = { id: 'mood-service' };
    const groups = groupRevealRows([
      { id: 'bloating.cycle_related', label: 'Cycle-related bloating', products: [product], services: [] },
      { id: 'cycle.pms', label: 'PMS symptoms', products: [], services: [] },
      { id: 'mood.general_anxiety', label: 'Anxiety', products: [], services: [service] },
      { id: 'mood.low', label: 'Low mood', products: [], services: [service] },
      { id: 'digestive.nausea', label: 'Nausea', products: [], services: [] },
    ]);
    expect(groups.map((g) => g.label)).toEqual(['Period & PMS', 'Mental wellbeing']);
    expect(groups[0].products).toEqual([product]);
    expect(groups[1].services).toEqual([service]);
  });
  it('keeps a generic hormone concern separate from period and menopause labels', () => {
    expect(groupSymptomShelves([{ needId: 'hormonal.general', label: 'Hormone-related symptoms', productIds: [] }])[0].label).toBe('Hormone-related symptoms');
  });
});
