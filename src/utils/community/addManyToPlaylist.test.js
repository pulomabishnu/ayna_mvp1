import { describe, expect, it, vi } from 'vitest';
import { addManyToPlaylist } from './communityStore.js';

function client({ batchError = null, itemErrorFor = () => null } = {}) {
  const calls = { upsert: [], insert: [] };
  return {
    calls,
    from: () => ({
      upsert: vi.fn(async (rows, opts) => { calls.upsert.push({ rows, opts }); return { error: batchError }; }),
      insert: vi.fn(async (row) => { calls.insert.push(row); return { error: itemErrorFor(row.product_id) }; }),
    }),
  };
}

describe('addManyToPlaylist', () => {
  it('adds every product in one request, skipping duplicates', async () => {
    const c = client();
    expect(await addManyToPlaylist(c, 'pl', ['a', 'b', 'a', null])).toBe(2);
    expect(c.calls.upsert).toHaveLength(1);
    expect(c.calls.upsert[0].rows.map((r) => r.product_id)).toEqual(['a', 'b']);
    expect(c.calls.upsert[0].opts).toEqual({ onConflict: 'playlist_id,product_id', ignoreDuplicates: true });
    expect(new Set(c.calls.upsert[0].rows.map((r) => r.position)).size).toBe(2);
    expect(c.calls.insert).toHaveLength(0);
  });

  it('falls back to one-by-one when the batch is refused, counting what landed', async () => {
    const c = client({ batchError: { code: 'P0001', message: 'cap' }, itemErrorFor: (id) => (id === 'b' ? { code: 'P0001' } : null) });
    expect(await addManyToPlaylist(c, 'pl', ['a', 'b', 'c'])).toBe(2);
    expect(c.calls.insert.map((r) => r.product_id)).toEqual(['a', 'b', 'c']);
  });

  it('does nothing for an empty list', async () => {
    const c = client();
    expect(await addManyToPlaylist(c, 'pl', [])).toBe(0);
    expect(c.calls.upsert).toHaveLength(0);
  });
});
