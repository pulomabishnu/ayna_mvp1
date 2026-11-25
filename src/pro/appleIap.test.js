import { describe, it, expect, vi } from 'vitest';

vi.mock('capacitor-ayna-store', () => ({ AynaStore: {} }));
const { introLine, perPeriod, APPLE_PRODUCTS } = await import('./appleIap.js');
const { APPLE_PRO_PRODUCTS } = await import('../../api/_appleJws.js');

describe('Apple Pro copy', () => {
  const year = { displayPrice: '$89.99', periodUnit: 'year', periodValue: 1, introEligible: true, intro: { displayPrice: '$44.99', paymentMode: 'payUpFront', periodUnit: 'year', periodValue: 1, periodCount: 1 } };
  it('shows the price per period', () => {
    expect(perPeriod(year)).toBe('$89.99/year');
  });
  it('shows the intro offer only when she can get it', () => {
    expect(introLine(year)).toBe('First year $44.99');
    expect(introLine({ ...year, introEligible: false })).toBe('');
    expect(introLine({ ...year, intro: { ...year.intro, paymentMode: 'freeTrial', periodUnit: 'week' } })).toBe('1 week free');
  });
  it('the app and the server agree on the product ids', () => {
    expect(Object.fromEntries(Object.entries(APPLE_PRODUCTS).map(([plan, id]) => [id, plan]))).toEqual(APPLE_PRO_PRODUCTS);
  });
});
