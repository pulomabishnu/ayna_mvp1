/* global process */
// Anonymous "Suggest a product" / "Suggest a read" box (Shop + Library, web and app).
// Stores ONLY the suggestion text: no user id, name, email or IP is ever written.
// Table + insert-only RLS: supabase/migrations/20261013120000_suggestions.sql.
import { createClient } from '@supabase/supabase-js';
import { getClientIp, rateLimit } from './_rateLimit.js';
import { checkCommunityText } from '../src/utils/communityRules.js';

const CONTEXTS = new Set(['shop', 'shop-empty', 'library', 'app-shop', 'app-library']);

export function clean(value, max) {
  if (typeof value !== 'string') return '';
  const noControl = [...value].filter((ch) => { const c = ch.charCodeAt(0); return c >= 32 || c === 9 || c === 10 || c === 13; }).join('');
  return noControl.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function cleanLink(value) {
  const raw = clean(value, 300);
  if (!raw) return '';
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) return null;
    return u.toString().slice(0, 300);
  } catch {
    return null;
  }
}

/** Validates a request body. Returns { row } or { error }. Exported for tests. */
export function buildSuggestionRow(body = {}) {
  const kind = body.kind === 'read' ? 'read' : body.kind === 'product' ? 'product' : '';
  if (!kind) return { error: 'Choose product or read.' };
  const context = CONTEXTS.has(body.context) ? body.context : null;
  const platform = body.platform === 'app' ? 'app' : 'web';
  if (kind === 'product') {
    const productName = clean(body.productName, 120);
    if (productName.length < 2) return { error: 'Add the product or brand name.' };
    const link = cleanLink(body.link);
    if (link === null) return { error: 'That link does not look right.' };
    return { row: { kind, product_name: productName, link: link || null, reason: clean(body.reason, 500) || null, topic: null, context, platform } };
  }
  const topic = clean(body.topic, 300);
  if (topic.length < 3) return { error: 'Tell us the topic or question.' };
  return { row: { kind, product_name: null, link: null, reason: null, topic, context, platform } };
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

  // The IP is only used as a short-lived rate-limit key, never stored with the row.
  const limit = await rateLimit(`suggest:${getClientIp(req)}`, { max: 8, windowSec: 600, failClosed: false });
  if (!limit.ok) {
    if (limit.retryAfterSec) res.setHeader('Retry-After', String(limit.retryAfterSec));
    return res.status(429).json({ error: 'Lots of suggestions from here. Try again in a bit.' });
  }

  const { row, error } = buildSuggestionRow(body);
  if (error) return res.status(400).json({ error });
  const ruleHit = [row.product_name, row.reason, row.topic].filter(Boolean).map((t) => checkCommunityText(t)).find((r) => r.blocked);
  if (ruleHit) return res.status(400).json({ error: ruleHit.message });

  const db = getAdmin();
  if (!db) {
    console.error('[suggestions] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
    return res.status(503).json({ error: 'Suggestions are offline for a moment.' });
  }

  const { error: dbError } = await db.from('suggestions').insert(row);
  if (dbError) {
    console.error('[suggestions] insert failed:', dbError.code, dbError.message);
    return res.status(503).json({ error: 'Suggestions are offline for a moment.' });
  }
  return res.status(200).json({ ok: true });
}
