/* global process */
// "Monthly box" waitlist (Minah, Oct 5; Golnaz, Oct 19 focus group): people
// who'd want a monthly box of period and wellness products. We test interest
// before building anything. Stores the email, an optional "what would you
// want in it", and the page it came from. Nothing else (no IP, no health data).
// Table + RLS: supabase/box_waitlist_2026-10-21.sql (founders run it).
import { createClient } from '@supabase/supabase-js';
import { getClientIp, rateLimit } from './_rateLimit.js';
import { clean } from './suggestions.js';

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const SOURCES = new Set(['you', 'app-you', 'shop', 'app-shop']);

/** Validates a request body. Returns { row } or { error }. Exported for tests. */
export function buildWaitlistRow(body = {}) {
  const email = clean(body.email, 254).toLowerCase();
  if (!EMAIL.test(email)) return { error: 'Add an email we can reach you at.' };
  const wants = clean(body.wants, 300) || null;
  const source = SOURCES.has(body.source) ? body.source : null;
  const platform = body.platform === 'app' ? 'app' : 'web';
  return { row: { email, wants, source, platform } };
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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid request.' }); }
  }
  // Honeypot: pretend success so bots do not retry.
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const limit = await rateLimit(`boxwait:${getClientIp(req)}`, { max: 5, windowSec: 600, failClosed: false });
  if (!limit.ok) {
    if (limit.retryAfterSec) res.setHeader('Retry-After', String(limit.retryAfterSec));
    return res.status(429).json({ error: 'Too many tries. Try again in a few minutes.' });
  }

  const { row, error } = buildWaitlistRow(body);
  if (error) return res.status(400).json({ error });

  const db = getAdmin();
  if (!db) return res.status(503).json({ error: 'Couldn’t save, try again later.' });
  // Joining twice is fine: the same email is kept once.
  const { error: dbError } = await db.from('box_waitlist').upsert(row, { onConflict: 'email', ignoreDuplicates: true });
  if (dbError) {
    console.error('[box-waitlist] insert failed:', dbError.code, dbError.message);
    return res.status(503).json({ error: 'Couldn’t save, try again later.' });
  }
  return res.status(200).json({ ok: true });
}
