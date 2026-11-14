import { describe, expect, it } from 'vitest';
import { searchProducts } from './index.js';

const P = (id, name, category, tags = [], description = '') => ({ id, name, category, tags, description, type: 'physical' });
const items = [
  P('m1', 'Manta Sleep COOL Sleep Mask', 'sleep', ['sleep', 'eye mask'], 'A blackout sleep mask with cooling eye cups.'),
  P('m3', 'Nodpod Weighted Sleep Mask', 'sleep', ['sleep', 'weighted'], 'Weighted sleep mask for the eyes.'),
  P('m2', 'Brooklinen Mulberry Silk Eyemask', 'sleep', ['sleep'], 'Silk eye mask for sleep.'),
  P('f1', 'Topicals Clearly Blemish Mask', 'skincare', ['acne'], 'A clay face mask.'),
  P('f2', 'Stripes Crown Pleaser Hair Mask', 'hair', ['hair'], 'Hair mask.'),
  P('s1', 'Magic Hour Venus Tea', 'sleep', ['sleep', 'tea'], 'Bedtime tea.'),
  P('s2', 'Hatch Restore 3', 'sleep', ['sleep', 'sunrise alarm'], 'Sunrise alarm and sleep sounds.'),
];

// Notion AYNA-256 / AYNA-273 (focus group, Oct 26): "search results for sleep mask are not relevant".
describe('search: the kind of thing she typed comes first', () => {
  for (const q of ['sleep masks', 'sleep mask']) {
    it(`"${q}" lists sleep masks before teas, alarms and face or hair masks`, () => {
      const ids = searchProducts(q, items).map((p) => p.id);
      const firstOther = Math.min(...['s1', 's2', 'f1', 'f2'].map((id) => (ids.includes(id) ? ids.indexOf(id) : 99)));
      for (const m of ['m1', 'm3', 'm2']) expect(ids.indexOf(m)).toBeLessThan(firstOther);
    });
  }
});
