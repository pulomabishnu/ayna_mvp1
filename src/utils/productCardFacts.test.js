import { describe, it, expect } from 'vitest';

import { cardKind as kindOf } from './productCardFacts.js';
describe('hot-flash products are named by what they do, not by a life stage', () => {
  it('a cooling spray filed under perimenopause reads Hot flashes and night sweats', () => {
    expect(kindOf({ id: 'p-x', category: 'perimenopause', name: 'Cool spray', summary: 'For hot flashes on the go' })).toBe('Hot flashes and night sweats');
  });
  it('a menopause product with no hot-flash claim keeps its category; apps keep theirs', () => {
    expect(kindOf({ id: 'p-y', category: 'menopause', name: 'Moisturizer', summary: 'Vaginal dryness' })).not.toMatch(/hot flash/i);
    expect(kindOf({ id: 'd-z', category: 'menopause', name: 'App', summary: 'Track hot flashes' })).not.toMatch(/hot flash/i);
  });
});

describe('repeatsName', () => {
  it('drops a subtitle that only repeats the name', async () => {
    const { repeatsName } = await import('./productCardFacts.js');
    expect(repeatsName('Thermacare menstrual pain therapy heatwraps', 'Menstrual Pain Therapy HeatWraps, 4 Count', 'ThermaCare')).toBe(true);
    expect(repeatsName('Cramp relief', 'Electric Heating Pad', 'VIBOOS')).toBe(false);
    expect(repeatsName('Sleep', 'Eye Mask', 'Ostrichpillow')).toBe(false);
  });
});
