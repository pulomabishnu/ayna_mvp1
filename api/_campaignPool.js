/**
 * The free product spinner's prize pool is the gift box sheet (same products
 * as /gift). This keeps reward_products in step with it:
 *
 *   1. re-read the Google Sheet into giftbox_products (api/_giftboxSheet.js,
 *      at most every 5 minutes per server instance unless forced)
 *   2. mirror giftbox_products into reward_products
 *      (campaign_sync_giftbox_pool, supabase/migrations/20261101120000_campaign_giftbox_pool.sql)
 *
 * Never throws: a sheet or database problem leaves the last good pool in place,
 * and the spinner keeps working from it.
 */
import { syncFromSheet } from './_giftboxSheet.js';
import { CAMPAIGN_ID } from '../src/utils/freeProductCampaign.js';

export const POOL_SYNC_EVERY_MS = 60 * 1000;

let lastPoolSyncAt = 0;

/** For tests. */
export function resetPoolSyncClock() { lastPoolSyncAt = 0; }

export async function refreshGiftboxPool(db, { force = false, now = Date.now(), fetchImpl } = {}) {
  if (!db) return { ok: false, error: 'no_db' };
  let sheet = null;
  try {
    sheet = await syncFromSheet(db, { force, now, ...(fetchImpl ? { fetchImpl } : {}) });
  } catch (e) {
    sheet = { ok: false, error: 'sync_failed', detail: e?.message };
  }
  const sheetRan = sheet && !sheet.skippedSync && sheet.ok;
  if (!force && !sheetRan && lastPoolSyncAt && now - lastPoolSyncAt < POOL_SYNC_EVERY_MS) return { ok: true, skippedSync: true, sheet };
  lastPoolSyncAt = now;
  try {
    const { data, error } = await db.rpc('campaign_sync_giftbox_pool', { p_campaign: CAMPAIGN_ID });
    if (error) throw error;
    return { ok: true, sheet, pool: data };
  } catch (e) {
    lastPoolSyncAt = 0;
    const detail = [e?.code, e?.message, e?.hint].filter(Boolean).join(' · ') || String(e);
    console.error('[campaign pool]', detail);
    return { ok: false, error: 'pool_sync_failed', detail, sheet };
  }
}
