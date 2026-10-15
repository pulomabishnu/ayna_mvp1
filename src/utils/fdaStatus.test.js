import { describe, it, expect } from 'vitest';
import { normalizeFdaStatus } from './fdaStatus.js';

const k = (s) => normalizeFdaStatus(s)?.key || null;
describe('normalizeFdaStatus', () => {
  it('never lets "FDA-registered" read like an approval', () => {
    expect(k('FDA-registered')).toBe('listed');
    expect(normalizeFdaStatus('FDA-registered').label).toBe('Listed with the FDA');
    expect(k('FDA-registered Class II medical device')).toBe('listed');
  });
  it('maps the common values to one fixed list', () => {
    expect(k('FDA-cleared')).toBe('cleared');
    expect(k('FDA 510(k)-cleared in 2019 (K183585) for over-the-counter treatment')).toBe('cleared');
    expect(k('SootheHer says the Elaris Pod is FDA-cleared. ayna could not find it in the FDA databases')).toBe('brand-claim');
    expect(k('Dietary supplement; not evaluated by the FDA.')).toBe('supplement');
    expect(k('Cosmetic/personal-care product; not FDA-cleared as a drug.')).toBe('cosmetic');
    expect(k('Personal pleasure device; not a medical device.')).toBe('not-device');
    expect(k('Wellness / exercise equipment; not an FDA-cleared medical device.')).toBe('not-device');
    expect(k('Prescription via licensed clinicians')).toBe('care');
    expect(k('N/A (Software)')).toBe('na');
    expect(k('OTC drug')).toBe('otc-drug');
  });
  it('drops values that are not an FDA status', () => {
    expect(k('Phthalate-free')).toBe(null);
    expect(k('Dermatologist tested')).toBe(null);
    expect(k('')).toBe(null);
  });
});
