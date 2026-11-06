import { describe, expect, it } from 'vitest';
import { groupSymptomShelves } from './shelfGroups.js';

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
});
