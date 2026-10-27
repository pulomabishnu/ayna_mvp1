import { describe, expect, it } from 'vitest';
import { reasonForProduct } from './plan.js';

describe('routine reasons', () => {
  it('names only a selected goal that the product supports', () => {
    const product = { id: 'custom-sleep', category: 'sleep', tags: ['sleep'] };
    expect(reasonForProduct(product, ['sleep.trouble'])).toBe('For your trouble sleeping goal');
    expect(reasonForProduct(product, ['energy.fatigue'])).toBeNull();
    expect(reasonForProduct(product, [])).toBeNull();
  });
});
