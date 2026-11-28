/* global process */
import { describe, it, expect, afterEach } from 'vitest';
import { accessFor, brandsFromRows, canOpen } from './access.js';

const fakeAdmin = (rows, error = null) => ({ from: () => ({ select: () => ({ eq: async () => ({ data: rows, error }) }) }) });
const member = { id: 'u1', email: 'Founder@Brand.com', email_confirmed_at: '2026-11-01' };

describe('partner studio access', () => {
  afterEach(() => { delete process.env.PARTNER_STUDIO_BRAND_ACCESS; });
  it('ignores revoked rows and duplicates', () => {
    expect(brandsFromRows([{ brand: 'BUNI' }, { brand: 'BUNI' }, { brand: 'LOLA', revoked_at: '2026-11-02' }])).toEqual(['BUNI']);
  });
  it('gives brand accounts nothing while the flag is off', async () => {
    expect(await accessFor(fakeAdmin([{ brand: 'BUNI' }]), member)).toEqual({ team: false, brands: [] });
  });
  it('gives a confirmed member only their brands when the flag is on', async () => {
    process.env.PARTNER_STUDIO_BRAND_ACCESS = '1';
    const a = await accessFor(fakeAdmin([{ brand: 'BUNI' }]), member);
    expect(a).toEqual({ team: false, brands: ['BUNI'] });
    expect(canOpen(a, 'BUNI')).toBe(true);
    expect(canOpen(a, 'LOLA')).toBe(false);
  });
  it('fails closed on unconfirmed emails and table errors', async () => {
    process.env.PARTNER_STUDIO_BRAND_ACCESS = '1';
    expect(await accessFor(fakeAdmin([{ brand: 'BUNI' }]), { ...member, email_confirmed_at: null })).toEqual({ team: false, brands: [] });
    expect(await accessFor(fakeAdmin(null, { message: 'missing table' }), member)).toEqual({ team: false, brands: [] });
  });
});
