import { describe, expect, it } from 'vitest';
import { formatPrice } from './formatPrice.js';

describe('formatPrice', () => {
  it('shows just the price, with the size on the second line', () => {
    expect(formatPrice({ price: '$12 for 100 softgels' })).toEqual({ main: '$12', sub: '100 softgels' });
    expect(formatPrice({ price: '$25-40 for 300-500g' })).toEqual({ main: '$25–40', sub: '300–500g' });
    expect(formatPrice({ price: '$21.99 for 60 capsules' }).main).toBe('$21.99');
  });
  it('keeps subscriptions and ranges as they are', () => {
    expect(formatPrice({ price: '$30/month' }).main).toBe('$30/month');
    expect(formatPrice({ price: '~$20-35' }).main).toBe('About $20–35');
  });
});
