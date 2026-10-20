/* global process */
// Anonymous "Suggest a product" / "Suggest a read" box (Shop + Library, web and app),
// and Community's "Suggest a topic" sheet (kind 'topic').
// Stores ONLY the suggestion text: no user id, name, email or IP is ever written.
// Table + insert-only RLS: supabase/migrations/20261013120000_suggestions.sql.
import { createClient } from '@supabase/supabase-js';
import { getClientIp, rateLimit } from './_rateLimit.js';
import { checkCommunityText } from '../src/utils/communityRules.js';
import { sendTeamAlert } from './_twilio.js';

const CONTEXTS = new Set(['shop', 'shop-empty', 'library', 'app-shop', 'app-library', 'community', 'app-community']);

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
  const kind = ['read', 'product', 'topic'].includes(body.kind) ? body.kind : '';
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
  if (kind === 'topic') {
    // A Community topic: a short name plus an optional "why".
    const name = clean(body.topic, 60);
    if (name.length < 2) return { error: 'Add the topic name.' };
    return { row: { kind, product_name: null, link: null, reason: clean(body.reason, 500) || null, topic: name, context, platform } };
  }
  const topic = clean(body.topic, 300);
  if (topic.length < 3) return { error: 'Tell us the topic or question.' };
  return { row: { kind, product_name: null, link: null, reason: null, topic, context, platform } };
}

// Every suggestion is emailed to the founders (Ameera, Eliz, Puloma). The
// email carries only what was typed: no name, account or IP (it's anonymous).
export const TEAM_EMAILS = () => (process.env.SUGGESTION_EMAILS ? process.env.SUGGESTION_EMAILS.split(',').map((x) => x.trim()).filter(Boolean)
  : ['ameera@aynahealth.co', 'eliz@aynahealth.co', 'puloma@aynahealth.co']);
const escHtml = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function suggestionEmail(row) {
  const isProduct = row.kind === 'product';
  const isTopic = row.kind === 'topic';
  const subject = isProduct ? `New product suggestion: ${row.product_name}`
    : isTopic ? `New Community topic suggestion: ${row.topic.slice(0, 60)}`
      : `New read suggestion: ${row.topic.slice(0, 60)}`;
  const lines = isProduct
    ? [['Product', row.product_name], ['Link', row.link], ['Why', row.reason]]
    : isTopic ? [['Community topic', row.topic], ['Why', row.reason]]
      : [['Topic', row.topic]];
  lines.push(['From', `${row.context || 'unknown page'} (${row.platform})`]);
  const shown = lines.filter(([, v]) => v);
  return {
    // Same sender as the contact form, which already reaches all three founders.
    from: process.env.SUGGESTION_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL || 'Ayna <puloma@aynahealth.co>',
    to: TEAM_EMAILS(),
    subject,
    text: `Someone sent an anonymous suggestion on ayna.\n\n${shown.map(([k, v]) => `${k}: ${v}`).join('\n')}\n`,
    html: `<p>Someone sent an anonymous suggestion on ayna.</p><table cellpadding="4">${shown.map(([k, v]) => `<tr><td><b>${escHtml(k)}</b></td><td>${escHtml(v)}</td></tr>`).join('')}</table>`,
  };
}

/** One-line team text for a suggestion. No identity, just what was typed, trimmed. */
export function suggestionTextLine(row) {
  if (row.kind === 'product') return `new product suggestion: ${String(row.product_name || '').slice(0, 80)}`;
  if (row.kind === 'topic') return `new community topic suggestion: ${String(row.topic || '').slice(0, 80)}`;
  return `new read suggestion: ${String(row.topic || '').slice(0, 80)}`;
}

// Single-message send, the same Resend call the contact form uses.
export async function sendSuggestionEmail(message, fetchImpl = fetch) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error('[suggestions] email not sent: RESEND_API_KEY is not configured'); return false; }
  try {
    const r = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      console.error('[suggestions] email failed:', r.status, body.slice(0, 500));
      return false;
    }
    return true;
  } catch (e) {
    console.error('[suggestions] email failed:', e?.message);
    return false;
  }
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

  // Save it, then email it. If saving fails the email still goes out, so the
  // suggestion is never lost; she only sees an error if both fail.
  let saved = false;
  const db = getAdmin();
  if (!db) console.error('[suggestions] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
  else {
    const { error: dbError } = await db.from('suggestions').insert(row);
    if (dbError) console.error('[suggestions] insert failed:', dbError.code, dbError.message);
    else saved = true;
  }
  // A failed email is logged loudly so it shows up in the Vercel logs.
  const emailed = await sendSuggestionEmail(suggestionEmail(row));
  // Plus a short text to the founders (TEAM_SMS_NUMBERS). Only what was typed,
  // never who sent it; never fails the request (sendTeamAlert cannot throw).
  await sendTeamAlert(suggestionTextLine(row));
  if (!saved && !emailed) return res.status(503).json({ error: 'Suggestions are offline for a moment.' });
  return res.status(200).json({ ok: true });
}
