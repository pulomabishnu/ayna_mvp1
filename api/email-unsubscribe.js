/* global process */
/**
 * /api/email-unsubscribe?u=<user id>&g=<group|all>&t=<token>
 * The link at the bottom of every notification email. GET shows a small page
 * and turns the emails off; POST is the one-click unsubscribe mail apps send
 * (List-Unsubscribe-Post). The token is an HMAC of user + group, so a link
 * only ever changes that one person's setting.
 */
import { createClient } from '@supabase/supabase-js';
import { verifyUnsubToken, SITE } from './_email.js';
import { EMAIL_GROUPS, normalizeEmailPrefs } from '../src/utils/emailPrefs.js';

const LABEL = Object.fromEntries(EMAIL_GROUPS.map((g) => [g.id, g.label]));

function page(title, line) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head>
<body style="margin:0;background:#ffedac;font:16px/1.55 'DM Sans',Arial,sans-serif;color:#3e2723">
<main style="max-width:480px;margin:12vh auto;padding:0 20px">
<p style="font:700 26px/1 'Bricolage Grotesque','DM Sans',Arial,sans-serif;margin:0 0 24px">ayna</p>
<h1 style="font:400 32px/1.15 'DM Serif Display',Georgia,serif;margin:0 0 12px">${title}</h1>
<p style="margin:0 0 24px">${line}</p>
<a href="${SITE}/you#wyou-email" style="display:inline-block;padding:13px 24px;border-radius:999px;background:#3e2723;color:#ffedac;font-weight:700;text-decoration:none">Email settings</a>
</main></body></html>`;
}

export default async function handler(req, res) {
  const q = req.method === 'POST' ? { ...(req.query || {}), ...(typeof req.body === 'object' ? req.body : {}) } : (req.query || {});
  const userId = String(q.u || '');
  const group = String(q.g || '');
  const valid = /^[0-9a-f-]{36}$/i.test(userId) && (group === 'all' || LABEL[group]) && verifyUnsubToken(userId, group, String(q.t || ''));
  res.setHeader('Cache-Control', 'no-store');
  if (!valid) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send(page('That link didn’t work', 'Open your email settings on ayna to change which emails you get.'));
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).send('Not configured');
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const { data } = await admin.from('email_preferences').select('prefs, unsubscribed_all').eq('user_id', userId).maybeSingle();
    const prefs = normalizeEmailPrefs(data?.prefs);
    const row = group === 'all'
      ? { user_id: userId, prefs, unsubscribed_all: true, updated_at: new Date().toISOString() }
      : { user_id: userId, prefs: { ...prefs, [group]: false }, unsubscribed_all: Boolean(data?.unsubscribed_all), updated_at: new Date().toISOString() };
    const { error } = await admin.from('email_preferences').upsert(row, { onConflict: 'user_id' });
    if (error) throw error;
  } catch (e) {
    console.error('[email-unsubscribe] failed:', e?.message);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(page('Something went wrong', 'We couldn’t update your settings. Try again, or change them in your email settings.'));
  }
  if (req.method === 'POST') return res.status(200).json({ ok: true });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(page('You’re unsubscribed', group === 'all'
    ? 'You won’t get any more emails from ayna, except ones about your account like sign-in links.'
    : `You won’t get any more ${LABEL[group]} emails. You can turn them back on any time.`));
}
