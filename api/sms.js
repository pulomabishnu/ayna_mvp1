/**
 * /api/sms, her text message settings (authenticated, rate limited).
 *
 *   GET  ?action=status  or  POST { action: 'status' }
 *   POST { action: 'start',  phone }          text her a 6-digit code
 *   POST { action: 'verify', phone, code }    confirm it; records consent
 *   POST { action: 'prefs',  reminders?, orders?, chat?, healthDetails? }
 *   POST { action: 'remove' }                 forget her number and text settings
 *
 * start/verify run the existing verification flow unchanged
 * (api/phone-verify-send.js and api/phone-verify-confirm.js: self-issued,
 * peppered OTP stored server-only, phone_numbers row). This route adds the
 * per-feature opt-ins in sms_preferences and the audit log in sms_events.
 *
 * Every feature is OFF until she turns it on here. Nothing in a response
 * ever contains her full number.
 */
import { verifyUser } from './_usageLimit.js';
import { rateLimit } from './_rateLimit.js';
import { aynaTextNumber, isSmsConfigured, isVerifyConfigured, maskForDisplay, normalizeE164 } from './_twilio.js';
import {
  ALL_OFF, PREF_KEYS, SMS_CONSENT_VERSION, loadPhone, loadPrefsRow, logSmsEvent, prefsFromRow, rowFromPrefs,
} from './_smsStore.js';
import sendCodeHandler from './phone-verify-send.js';
import confirmCodeHandler from './phone-verify-confirm.js';

function privateHeaders(res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
}

/** Runs one of the existing verify handlers and hands back what it would have sent. */
async function runInner(handler, req, body) {
  const out = { statusCode: 200, body: null, headers: {} };
  const res = {
    setHeader(k, v) { out.headers[k] = v; return res; },
    status(c) { out.statusCode = c; return res; },
    json(b) { out.body = b; return res; },
    send(b) { out.body = b; return res; },
    end() { return res; },
  };
  await handler({ ...req, method: 'POST', body }, res);
  return out;
}

function forward(res, inner) {
  if (inner.headers['Retry-After']) res.setHeader('Retry-After', inner.headers['Retry-After']);
  return res.status(inner.statusCode).json(inner.body || {});
}

function statusShape(phone, prefsRow) {
  const verified = Boolean(phone?.is_verified);
  const stopped = Boolean(phone?.sms_opted_out || prefsRow?.stopped_at);
  return {
    configured: isSmsConfigured() && isVerifyConfigured(),
    phone: phone?.phone_number ? maskForDisplay(phone.phone_number) : null,
    verified,
    stopped,
    prefs: verified ? prefsFromRow(prefsRow) : { ...ALL_OFF },
    // false = she verified on the website before per-feature settings existed
    // and has not saved settings in the app yet (chat works as it did then).
    prefsSaved: Boolean(prefsRow),
    textNumber: aynaTextNumber(),
    consentVersion: SMS_CONSENT_VERSION,
  };
}

export default async function handler(req, res) {
  privateHeaders(res);
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const { user, error, admin } = await verifyUser(req);
  if (error || !user || !admin) {
    return res.status(error === 'server_misconfigured' || error === 'auth_error' ? 503 : 401).json({ error: error || 'auth_required' });
  }
  const userId = user.id;

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'invalid_json' }); }
  }
  const action = String((req.method === 'GET' ? req.query?.action : body.action) || 'status');

  const limited = await rateLimit(`sms-api:${userId}`, { max: 60, windowSec: 600 });
  if (!limited.ok) {
    if (limited.retryAfterSec) res.setHeader('Retry-After', String(limited.retryAfterSec));
    return res.status(429).json({ error: 'rate_limited' });
  }

  try {
    if (action === 'status') {
      const [phone, prefsRow] = await Promise.all([loadPhone(admin, userId), loadPrefsRow(admin, userId)]);
      return res.status(200).json(statusShape(phone, prefsRow));
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    if (action === 'start' || action === 'verify') {
      if (!isVerifyConfigured()) return res.status(503).json({ error: 'sms_not_configured', configured: false });
      const phoneNumber = normalizeE164(typeof body.phone === 'string' ? body.phone : '');
      if (!phoneNumber) return res.status(400).json({ error: 'invalid_phone_number' });
      if (action === 'start') {
        const inner = await runInner(sendCodeHandler, req, { phoneNumber });
        if (inner.statusCode !== 200) return forward(res, inner);
        return res.status(200).json({ ok: true, sent: true });
      }
      const code = typeof body.code === 'string' ? body.code.trim() : '';
      const inner = await runInner(confirmCodeHandler, req, { phoneNumber, code });
      if (inner.statusCode !== 200) return forward(res, inner);
      // Verified. Record consent; a first-time row starts with every feature OFF.
      const now = new Date().toISOString();
      const existing = await loadPrefsRow(admin, userId);
      const patch = { user_id: userId, stopped_at: null, consent_text_version: SMS_CONSENT_VERSION, consent_at: now, updated_at: now };
      const { error: upsertError } = await admin.from('sms_preferences')
        .upsert(existing ? patch : { ...patch, ...rowFromPrefs(ALL_OFF) }, { onConflict: 'user_id' });
      if (upsertError) throw new Error('prefs_save_failed');
      await logSmsEvent(admin, userId, 'phone_verified', { consentVersion: SMS_CONSENT_VERSION });
      const [phone, prefsRow] = await Promise.all([loadPhone(admin, userId), loadPrefsRow(admin, userId)]);
      return res.status(200).json({ ok: true, ...statusShape(phone, prefsRow) });
    }

    if (action === 'prefs') {
      const [phone, existing] = await Promise.all([loadPhone(admin, userId), loadPrefsRow(admin, userId)]);
      if (!phone?.is_verified) return res.status(400).json({ error: 'phone_not_verified' });
      for (const k of PREF_KEYS) {
        if (body[k] !== undefined && typeof body[k] !== 'boolean') return res.status(400).json({ error: 'bad_prefs' });
      }
      // A first save starts from all OFF (not the legacy website defaults), so
      // nothing is on unless this request turned it on. When status says
      // prefsSaved:false the app should send all four keys.
      const base = existing ? prefsFromRow(existing) : { ...ALL_OFF };
      const next = {};
      for (const k of PREF_KEYS) next[k] = typeof body[k] === 'boolean' ? body[k] : base[k];
      const anyOn = PREF_KEYS.some((k) => next[k]);
      // After STOP she has to text START first; Twilio blocks texts to her until then.
      if (anyOn && (phone.sms_opted_out || existing?.stopped_at)) return res.status(409).json({ error: 'texts_stopped' });
      const now = new Date().toISOString();
      const { error: upsertError } = await admin.from('sms_preferences').upsert({
        user_id: userId, ...rowFromPrefs(next),
        consent_text_version: SMS_CONSENT_VERSION, consent_at: now, updated_at: now,
      }, { onConflict: 'user_id' });
      if (upsertError) throw new Error('prefs_save_failed');
      await logSmsEvent(admin, userId, 'prefs_saved', { ...next, consentVersion: SMS_CONSENT_VERSION });
      return res.status(200).json({ ok: true, ...statusShape(phone, { ...existing, ...rowFromPrefs(next) }) });
    }

    if (action === 'remove') {
      for (const table of ['sms_preferences', 'pending_phone_verifications', 'phone_numbers']) {
        const { error: delError } = await admin.from(table).delete().eq('user_id', userId);
        if (delError) throw new Error(`${table}_delete_failed`);
      }
      await logSmsEvent(admin, userId, 'phone_removed');
      return res.status(200).json({ ok: true, ...statusShape(null, null) });
    }

    return res.status(400).json({ error: 'unknown_action' });
  } catch (e) {
    console.error('[sms] request failed:', e?.message);
    return res.status(500).json({ error: 'sms_failed' });
  }
}
