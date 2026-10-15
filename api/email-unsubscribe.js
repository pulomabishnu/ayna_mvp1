/* global process */
/**
 * Unsubscribe from campaign / marketing email.
 *
 *   GET  /api/email-unsubscribe?t=<token>   a one-button confirm page (so link
 *                                           scanners can't unsubscribe people)
 *   POST /api/email-unsubscribe?t=<token>   does it (also RFC 8058 one-click)
 *
 * The token is an HMAC of the address (api/_campaignEmail.js), so nobody can
 * unsubscribe someone else. Stored in public.email_suppressions.
 */
import { createClient } from '@supabase/supabase-js';
import { escapeHtml, readUnsubscribeToken } from './_campaignEmail.js';

function page(title, body, form = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title>
<style>body{margin:0;background:#faf8f1;color:#1d1a2b;font:400 16px/1.5 Poppins,Helvetica,Arial,sans-serif;display:grid;place-items:center;min-height:100vh;padding:16px;box-sizing:border-box}
main{max-width:440px;width:100%;background:#fffcf5;border:2px solid #1d1a2b;border-radius:24px;padding:32px 24px;text-align:center}
h1{margin:0 0 10px;font:800 32px/1.05 'Bricolage Grotesque','Arial Black',Arial,sans-serif;letter-spacing:-.04em}
button{min-height:48px;padding:0 24px;border:2px solid #1d1a2b;border-radius:99px;background:#1d1a2b;color:#fffcf5;font:700 16px/1 inherit;cursor:pointer}
button:focus-visible{outline:3px solid #1d1a2b;outline-offset:3px}a{color:#1d1a2b}</style></head>
<body><main><div style="font:800 26px/1 'Bricolage Grotesque','Arial Black',Arial,sans-serif;letter-spacing:-.05em;margin-bottom:18px">ayna</div><h1>${escapeHtml(title)}</h1><p>${body}</p>${form}</main></body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const token = String(req.query?.t || '');
  const email = readUnsubscribeToken(token);

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (!email) return res.status(400).send(page('That link didn\'t work', 'It may be incomplete. You can also email <a href="mailto:puloma@aynahealth.co">puloma@aynahealth.co</a> and we\'ll take care of it.'));
    return res.status(200).send(page('Unsubscribe?', `We'll stop sending campaign emails to ${escapeHtml(email)}. Emails about a product you've already claimed still come through.`,
      `<form method="post" action="/api/email-unsubscribe?t=${encodeURIComponent(token)}"><button type="submit">unsubscribe</button></form>`));
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  if (!email) return res.status(400).json({ error: 'invalid_token' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'server_misconfigured' });
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.from('email_suppressions').upsert({ email, reason: 'unsubscribe' }, { onConflict: 'email', ignoreDuplicates: true });
  if (error) return res.status(500).json({ error: 'server_error' });

  const wantsHtml = String(req.headers?.accept || '').includes('text/html') || String(req.headers?.['content-type'] || '').includes('form');
  if (wantsHtml) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(page("You're unsubscribed", 'No more campaign emails. You can still use ayna like always.'));
  }
  return res.status(200).json({ ok: true });
}
