import { describe, it, expect, vi } from 'vitest';

vi.mock('capacitor-ayna-store', () => ({ AynaStore: {} }));
const { introLine, perPeriod, APPLE_PRODUCTS, APPLE_TRIAL_PRODUCT } = await import('./appleIap.js');
const { APPLE_PRO_PRODUCTS, APPLE_TRIAL_PRODUCT: SERVER_TRIAL } = await import('../../api/_appleJws.js');

describe('Apple Pro copy', () => {
  const year = { displayPrice: '$89.99', periodUnit: 'year', periodValue: 1, introEligible: true, intro: { displayPrice: '$44.99', paymentMode: 'payUpFront', periodUnit: 'year', periodValue: 1, periodCount: 1 } };
  it('shows the price per period', () => {
    expect(perPeriod(year)).toBe('$89.99/year');
  });
  it('shows the intro offer only when she can get it', () => {
    expect(introLine(year)).toBe('First year $44.99');
    expect(introLine({ ...year, introEligible: false })).toBe('');
    expect(introLine({ ...year, intro: { ...year.intro, paymentMode: 'freeTrial', periodUnit: 'week' } })).toBe('7 days free');
  });
  it('the app and the server agree on the product ids', () => {
    expect(Object.fromEntries(Object.entries(APPLE_PRODUCTS).map(([plan, id]) => [id, plan]))).toEqual(APPLE_PRO_PRODUCTS);
    expect(APPLE_TRIAL_PRODUCT).toBe(SERVER_TRIAL);
  });
});

// Nov 27: the free trial is Apple's intro offer (2 weeks free) on the subscription.
describe('free trial days', async () => {
  const { freeTrialDays } = await import('./appleIap.js');
  it('2 weeks free → 14 days; none when used or not a free trial', () => {
    const intro = { paymentMode: 'freeTrial', periodUnit: 'week', periodValue: 2, periodCount: 1 };
    expect(freeTrialDays({ introEligible: true, intro })).toBe(14);
    expect(freeTrialDays({ introEligible: false, intro })).toBe(0);
    expect(freeTrialDays({ introEligible: true, intro: { ...intro, paymentMode: 'payUpFront' } })).toBe(0);
    expect(introLine({ introEligible: true, intro })).toBe('14 days free');
  });
});

describe('yearly saving (Nov 27)', async () => {
  const { yearlySaving } = await import('./appleIap.js');
  it('rounds down, needs both prices', () => {
    expect(yearlySaving({ price: 89.99, periodUnit: 'year' }, { price: 8.99, periodUnit: 'month' })).toBe(16);
    expect(yearlySaving({ periodUnit: 'year' }, { price: 8.99, periodUnit: 'month' })).toBe(0);
  });
});
