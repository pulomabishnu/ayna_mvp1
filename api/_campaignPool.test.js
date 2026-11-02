import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSupabase } from './_test-helpers.js';

vi.mock('./_giftboxSheet.js', () => ({ syncFromSheet: vi.fn() }));
const { syncFromSheet } = await import('./_giftboxSheet.js');
const { refreshGiftboxPool, resetPoolSyncClock, POOL_SYNC_EVERY_MS } = await import('./_campaignPool.js');

beforeEach(() => { vi.clearAllMocks(); resetPoolSyncClock(); });

const db = () => mockSupabase({ rpcResults: { campaign_sync_giftbox_pool: { data: { ok: true, inPool: 3 }, error: null } } });

describe('refreshGiftboxPool', () => {
  it('re-reads the sheet, then mirrors it into the prize pool', async () => {
    syncFromSheet.mockResolvedValue({ ok: true, synced: 3 });
    const d = db();
    const r = await refreshGiftboxPool(d, { now: 1000 });
    expect(r.ok).toBe(true);
    expect(r.pool.inPool).toBe(3);
    expect(d.rpcCalls[0]).toEqual({ name: 'campaign_sync_giftbox_pool', args: { p_campaign: 'free-product-2026' } });
  });

  it('throttles the pool sync when the sheet did not change', async () => {
    syncFromSheet.mockResolvedValue({ ok: true, skippedSync: true });
    const d = db();
    await refreshGiftboxPool(d, { now: 1000 });
    await refreshGiftboxPool(d, { now: 1000 + POOL_SYNC_EVERY_MS - 1 });
    expect(d.rpcCalls).toHaveLength(1);
    await refreshGiftboxPool(d, { now: 1000 + POOL_SYNC_EVERY_MS + 1 });
    expect(d.rpcCalls).toHaveLength(2);
  });

  it('a sheet problem still refreshes the pool from the last good copy, and never throws', async () => {
    syncFromSheet.mockRejectedValue(new Error('boom'));
    const d = db();
    const r = await refreshGiftboxPool(d, { now: 5, force: true });
    expect(r.ok).toBe(true);
    expect(r.sheet.ok).toBe(false);
  });

  it('a database problem is reported, not thrown', async () => {
    syncFromSheet.mockResolvedValue({ ok: true, skippedSync: true });
    const d = mockSupabase({ rpcResults: { campaign_sync_giftbox_pool: { data: null, error: { message: 'function does not exist' } } } });
    const r = await refreshGiftboxPool(d, { now: 5 });
    expect(r.ok).toBe(false);
    expect(r.detail).toMatch(/does not exist/);
  });
});
