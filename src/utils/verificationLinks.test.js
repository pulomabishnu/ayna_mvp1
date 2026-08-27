import { describe, it, expect } from 'vitest';
import { getVerificationLinks } from './verificationLinks';

// Live bug (2026-08-25): the product evidence rail's "Scientific" row (and
// several other reads of verificationLinks.doctor/scientific) went missing
// for real products because the catalog has these fields in three different
// shapes — {links:[...]}, a bare array, and a single bare citation object —
// but every reader only ever handled the first one.
describe('getVerificationLinks', () => {
  it('reads the {links:[...]} shape (the majority case)', () => {
    const product = { verificationLinks: { scientific: { links: [{ url: 'https://a.com' }] } } };
    expect(getVerificationLinks(product, 'scientific')).toEqual([{ url: 'https://a.com' }]);
  });

  it('reads a bare-array shape', () => {
    const product = { verificationLinks: { doctor: [{ url: 'https://b.com' }, { url: 'https://c.com' }] } };
    expect(getVerificationLinks(product, 'doctor')).toHaveLength(2);
  });

  it('reads a single bare citation object (no array/links wrapper at all)', () => {
    const product = { verificationLinks: { doctor: { url: 'https://apple.com/healthcare', text: 'Apple' } } };
    const links = getVerificationLinks(product, 'doctor');
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe('https://apple.com/healthcare');
  });

  it('returns an empty array when the field is missing', () => {
    expect(getVerificationLinks({ verificationLinks: {} }, 'community')).toEqual([]);
    expect(getVerificationLinks({}, 'community')).toEqual([]);
    expect(getVerificationLinks(null, 'community')).toEqual([]);
  });

  it('does not mistake an empty object for a citation', () => {
    const product = { verificationLinks: { scientific: {} } };
    expect(getVerificationLinks(product, 'scientific')).toEqual([]);
  });
});
