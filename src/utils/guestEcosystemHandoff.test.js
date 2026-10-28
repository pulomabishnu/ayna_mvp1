import { describe, expect, it, vi } from 'vitest';
import { GUEST_ECO_KEY, handOffGuestEcosystem } from './guestEcosystemHandoff.js';

function memoryStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), has: (k) => m.has(k) };
}
const guest = (products) => ({ [GUEST_ECO_KEY]: JSON.stringify({ myProducts: products, order: Object.keys(products), at: 1 }) });

describe('guest ecosystem hand-off at sign-in', () => {
  it('uploads only guest products the account lacks, as on her shelf and tracked, then removes the device copy', async () => {
    const storage = memoryStorage(guest({ a: { id: 'a', name: 'A' }, b: { id: 'b', name: 'B' }, c: { id: 'c' } }));
    const upsert = vi.fn(async () => ({ saved: 1, synced: true }));
    const out = await handOffGuestEcosystem({ supabase: {}, userId: 'u1', account: { myProducts: { b: {} }, omittedProducts: { c: {} } }, storage, upsert });
    expect(upsert).toHaveBeenCalledWith({}, 'u1', [{ id: 'a', name: 'A' }], { inEcosystem: true, isTracked: true, isOmitted: false });
    expect(out).toMatchObject({ uploaded: true, order: ['a'] });
    expect(storage.has(GUEST_ECO_KEY)).toBe(false);
  });

  it('keeps the device copy when the upload fails or is only a local fallback, so a reload loses nothing', async () => {
    for (const upsert of [vi.fn(async () => ({ saved: 1, synced: false, fallback: true })), vi.fn(async () => { throw new Error('offline'); })]) {
      const storage = memoryStorage(guest({ a: { id: 'a' } }));
      const out = await handOffGuestEcosystem({ supabase: {}, userId: 'u1', account: { myProducts: {} }, storage, upsert });
      expect(out.uploaded).toBe(false);
      expect(out.products.map((p) => p.id)).toEqual(['a']);
      expect(storage.has(GUEST_ECO_KEY)).toBe(true);
    }
  });

  it('removes the copy without uploading when the account already has everything', async () => {
    const storage = memoryStorage(guest({ a: { id: 'a' } }));
    const upsert = vi.fn();
    await handOffGuestEcosystem({ supabase: {}, userId: 'u1', account: { myProducts: { a: {} } }, storage, upsert });
    expect(upsert).not.toHaveBeenCalled();
    expect(storage.has(GUEST_ECO_KEY)).toBe(false);
  });

  it('does nothing without a guest copy', async () => {
    const upsert = vi.fn();
    expect(await handOffGuestEcosystem({ supabase: {}, userId: 'u1', account: {}, storage: memoryStorage(), upsert })).toMatchObject({ products: [], uploaded: true });
    expect(upsert).not.toHaveBeenCalled();
  });
});
