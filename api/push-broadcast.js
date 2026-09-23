/* global process, Buffer */
/**
 * /api/push-broadcast — a tiny admin page for sending one push notification
 * to everyone who has the ayna iPhone app and has notifications turned on.
 *
 *   GET  → the form (title, message, admin password)
 *   POST → sends (or, with "preview", just counts who would get it)
 *
 * Protected by ADMIN_PUSH_SECRET (Vercel env). Plain HTML form, no scripts,
 * so it works under the site's strict Content-Security-Policy.
 */
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { apnsConfigured, sendPush, DEAD_TOKEN_REASONS } from './_apns.js';
import { getClientIp, rateLimit } from './_rateLimit.js';

const MAX_TITLE = 80;
const MAX_BODY = 240;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

function parseBody(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  if (typeof b === 'string') {
    try { return JSON.parse(b); } catch { /* not JSON */ }
    return Object.fromEntries(new URLSearchParams(b));
  }
  return {};
}

function page({ title = '', body = '', notice = null }) {
  const n = notice ? `<div class="n ${notice.tone}">${esc(notice.text)}</div>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Send a notification · ayna</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:#F3EFE9;color:#1A1714}
main{max-width:520px;margin:0 auto;padding:40px 20px}h1{font-family:Georgia,serif;font-weight:500;font-size:28px;margin:0 0 6px;color:#242A52}
p{color:#6f6880;line-height:1.5;margin:0 0 22px;font-size:14px}label{display:block;font-weight:600;font-size:13px;margin:16px 0 6px;color:#4a4356}
input,textarea{width:100%;padding:12px 14px;border:1px solid #ded9e4;border-radius:10px;font:inherit;font-size:16px;background:#fff}
textarea{min-height:110px;resize:vertical}.hint{font-size:12px;color:#8c8078;margin-top:4px}
.row{display:flex;gap:10px;margin-top:22px}button{flex:1;padding:14px;border-radius:99px;border:1px solid #242A52;font:inherit;font-weight:600;font-size:15px;cursor:pointer}
.send{background:#242A52;color:#fff}.prev{background:#fff;color:#242A52}
.n{padding:12px 14px;border-radius:12px;font-size:14px;line-height:1.5;margin-bottom:18px}.ok{background:#e6f1ea;color:#2F6B4F}.err{background:#fbe7e3;color:#B4402A}.info{background:#eceaf5;color:#3B4677}
</style></head><body><main>
<h1>Send a notification</h1>
<p>Goes to everyone who has the ayna iPhone app, is signed in, and has Notifications turned on. Tap <b>Preview</b> first to see how many people will get it.</p>
${n}
<form method="post">
<label for="title">Title</label><input id="title" name="title" maxlength="${MAX_TITLE}" required value="${esc(title)}" placeholder="New in ayna">
<label for="body">Message</label><textarea id="body" name="body" maxlength="${MAX_BODY}" required placeholder="We just added new brands to Early Stage — take a look!">${esc(body)}</textarea>
<div class="hint">Keep it short — iPhones show about 2 lines. No health details.</div>
<label for="password">Admin password</label><input id="password" name="password" type="password" required autocomplete="current-password">
<div class="row"><button class="prev" name="action" value="preview">Preview</button><button class="send" name="action" value="send">Send to everyone</button></div>
</form></main></body></html>`;
}

// Plain-English fixes for the APNs errors people actually hit.
const APNS_FIXES = {
  InvalidProviderToken: 'The key or Key ID in Vercel is wrong: APNS_KEY_ID must be the 10 characters from the .p8 file name, APNS_KEY_P8 the whole file (BEGIN/END lines included), and the key must belong to the same Apple team as the app.',
  ExpiredProviderToken: 'Server clock/token issue — just try again in a minute.',
  MissingProviderToken: 'APNS_KEY_P8 / APNS_KEY_ID are missing in Vercel.',
  BadDeviceToken: "These phones are registered for the other Apple environment. Builds run straight from Xcode need APNS_ENV=development in Vercel; TestFlight/App Store builds need it unset. Or the phones are on an old build — update in TestFlight, then turn Notifications on again.",
  DeviceTokenNotForTopic: 'The app ID doesn\'t match — APNS_BUNDLE_ID should be co.aynahealth.app (or unset).',
  TopicDisallowed: 'This key is not allowed to send for co.aynahealth.app — create the key in the same Apple Developer team as the app.',
  Unregistered: 'Those phones uninstalled the app or turned notifications off; they were removed from the list.',
  TooManyProviderTokenUpdates: 'Try again in 20 minutes.',
};
function explainApnsReasons(reasons) {
  const fixes = reasons.map((r) => APNS_FIXES[r]).filter(Boolean);
  if (fixes.length) return fixes.join(' ');
  if (reasons.some((r) => /ERR_|key|decoder|PEM|asn1/i.test(r))) return 'The APNS_KEY_P8 value in Vercel could not be read — paste the whole .p8 file again, including the BEGIN and END lines.';
  return '';
}

let _admin = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

/** iOS device tokens for users who haven't turned Notifications off. */
export async function audienceTokens(admin) {
  const { data: tokens, error } = await admin.from('device_tokens').select('device_token, user_id').eq('platform', 'ios');
  if (error) throw new Error(error.message);
  const rows = tokens || [];
  if (!rows.length) return { tokens: [], users: 0 };
  const { data: off, error: prefError } = await admin.from('notification_preferences').select('user_id').eq('notifications_enabled', false);
  if (prefError) throw new Error(prefError.message);
  const optedOut = new Set((off || []).map((r) => r.user_id));
  const kept = rows.filter((r) => !optedOut.has(r.user_id));
  return { tokens: [...new Set(kept.map((r) => r.device_token))], users: new Set(kept.map((r) => r.user_id)).size };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const send = (status, html) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.status(status).send(html); };

  if (req.method === 'GET') return send(200, page({}));
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(405, page({ notice: { tone: 'err', text: 'Method not allowed.' } })); }

  const form = parseBody(req);
  const title = String(form.title || '').trim().slice(0, MAX_TITLE);
  const body = String(form.body || '').trim().slice(0, MAX_BODY);
  const keep = { title, body };

  const limit = await rateLimit(`push-broadcast:${getClientIp(req)}`, { max: 10, windowSec: 600, failClosed: false });
  if (!limit.ok) return send(429, page({ ...keep, notice: { tone: 'err', text: 'Too many attempts. Wait 10 minutes.' } }));

  const secret = process.env.ADMIN_PUSH_SECRET;
  if (!secret) return send(503, page({ ...keep, notice: { tone: 'err', text: 'ADMIN_PUSH_SECRET is not set in Vercel yet.' } }));
  if (!safeEqual(form.password, secret)) return send(401, page({ ...keep, notice: { tone: 'err', text: 'Wrong admin password.' } }));
  if (!title || !body) return send(400, page({ ...keep, notice: { tone: 'err', text: 'Add a title and a message.' } }));
  if (!apnsConfigured()) return send(503, page({ ...keep, notice: { tone: 'err', text: 'Push is not set up on the server (APNS_KEY_P8 / APNS_KEY_ID missing in Vercel).' } }));

  const admin = getAdmin();
  if (!admin) return send(500, page({ ...keep, notice: { tone: 'err', text: 'Server is missing its Supabase settings.' } }));

  let audience;
  try {
    audience = await audienceTokens(admin);
  } catch (e) {
    console.error('[push-broadcast] audience failed:', e?.message);
    return send(500, page({ ...keep, notice: { tone: 'err', text: "Couldn't load the list of phones. Try again." } }));
  }

  if (form.action !== 'send') {
    return send(200, page({ ...keep, notice: { tone: 'info', text: `Preview: this will go to ${audience.tokens.length} phone${audience.tokens.length === 1 ? '' : 's'} (${audience.users} ${audience.users === 1 ? 'person' : 'people'}). Tap "Send to everyone" to send it.` } }));
  }
  if (!audience.tokens.length) {
    return send(200, page({ ...keep, notice: { tone: 'err', text: 'Nobody can receive it yet — no one has allowed notifications on the new app build.' } }));
  }

  let results;
  try {
    results = await sendPush(audience.tokens, { title, body, data: { type: 'broadcast' } });
  } catch (e) {
    console.error('[push-broadcast] send failed:', e?.message);
    return send(500, page({ ...keep, notice: { tone: 'err', text: `Couldn't send: ${e?.message || 'unknown error'}. ${explainApnsReasons([String(e?.message || '')])}` } }));
  }
  const dead = results.filter((r) => r.status === 410 || DEAD_TOKEN_REASONS.has(r.reason)).map((r) => r.deviceToken);
  if (dead.length) await admin.from('device_tokens').delete().in('device_token', dead);
  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;
  console.log(`[push-broadcast] sent=${sent} failed=${failed} removedDead=${dead.length}`);
  const reasons = [...new Set(results.filter((r) => !r.ok).map((r) => r.reason || `HTTP ${r.status}`))];
  if (reasons.length) console.warn('[push-broadcast] failure reasons:', reasons.join(', '));
  const why = reasons.length ? ` Apple said: ${reasons.join(', ')}. ${explainApnsReasons(reasons)}` : '';
  return send(200, page({ notice: { tone: sent ? 'ok' : 'err', text: sent ? `Sent to ${sent} phone${sent === 1 ? '' : 's'}${failed ? ` (${failed} couldn't be reached.${why})` : ''}.` : `Apple didn't accept it for any phone (${failed} failed).${why}` } }));
}
