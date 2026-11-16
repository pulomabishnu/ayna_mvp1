import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('capacitor-ayna-records', () => ({ AynaRecords: { storefront: vi.fn() } }));

const { proPurchaseModeFor, loadProPurchaseMode, _resetStorefront } = await import('./appStorefront.js');

beforeEach(() => _resetStorefront());

describe('Pro purchase mode (App Store rule 3.1.1(a))', () => {
  it('website: the normal checkout', () => {
    expect(proPurchaseModeFor({ native: false, countryCode: null })).toBe('web');
  });
  it('iPhone app: link out only on the US storefront', () => {
    expect(proPurchaseModeFor({ native: true, countryCode: 'USA' })).toBe('us_link');
    expect(proPurchaseModeFor({ native: true, countryCode: 'GBR' })).toBe('none');
    expect(proPurchaseModeFor({ native: true, countryCode: null })).toBe('none');
  });
  it('asks the App Store once and caches the answer', async () => {
    const lookup = vi.fn(async () => ({ countryCode: 'USA' }));
    expect(await loadProPurchaseMode({ native: true, lookup })).toBe('us_link');
    expect(await loadProPurchaseMode({ native: true, lookup })).toBe('us_link');
    expect(lookup).toHaveBeenCalledTimes(1);
  });
  it('if the storefront lookup fails, no link (the safe answer)', async () => {
    expect(await loadProPurchaseMode({ native: true, lookup: async () => { throw new Error('old app'); } })).toBe('none');
  });
  it('not native: never asks', async () => {
    const lookup = vi.fn();
    expect(await loadProPurchaseMode({ native: false, lookup })).toBe('web');
    expect(lookup).not.toHaveBeenCalled();
  });
});
