import { describe, expect, it } from 'vitest';
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
});
