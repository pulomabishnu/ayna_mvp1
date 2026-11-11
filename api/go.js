/* global process, Buffer */
// Anonymous Buy Now counter. The site sends { p: "<product id>" } when anyone
// clicks a Buy button (src/utils/productEventProps.js countBuyClick); this adds
// 1 to that product's count for today in public.buy_click_daily.
//
// Stored: product id, date (UTC), count. Nothing else: no IP, user agent,
// cookie, account or analytics id. The IP is used only in memory/Redis for
// rate limiting and is never written to Supabase. Unknown product ids are
// ignored by the database function, so random ids can't create rows.
// Table + function: supabase/buy_click_daily_2026-11-10.sql (a founder runs it).
import { createClient } from '@supabase/supabase-js';
import { getClientIp, rateLimit } from './_rateLimit.js';

const ID = /^[a-z0-9][a-z0-9_.:-]{0,79}$/i;

/** Product id from a beacon/fetch body or ?p=. Returns null if missing or malformed. Exported for tests. */
export function readProductId(req) {
  let body = req.body;
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const raw = (body && typeof body === 'object' ? body.p : null) ?? req.query?.p;
  const id = typeof raw === 'string' ? raw.trim() : '';
  return ID.test(id) ? id : null;
}

let admin = null;
function getAdmin() {
  if (admin) return admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}
/** Tests swap the database client. */
export function setGoAdminForTests(client) { admin = client; }

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // The app (capacitor://localhost) posts here too; a beacon needs no CORS
  // reply, but a fetch fallback does.
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  const productId = readProductId(req);
  // 204 for everything the caller can't act on: the page never waits on this.
  if (!productId) return res.status(204).end();

  const limit = await rateLimit(`go:${getClientIp(req)}`, { max: 30, windowSec: 600, failClosed: false });
  if (!limit.ok) return res.status(204).end();

  const db = getAdmin();
  if (!db) return res.status(204).end();
  const { error } = await db.rpc('record_buy_click', { p_product_id: productId });
  if (error) console.error('[go] count failed:', error.code, error.message);
  return res.status(204).end();
}
