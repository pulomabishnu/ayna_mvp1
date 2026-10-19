/* global process, Buffer */
/**
 * Shared outbound Twilio SMS helper (plain REST via fetch, no SDK).
 *
 * Everything here is OFF until the env vars are set: isSmsConfigured() is
 * false, sendSms() resolves { ok: false, error: 'not_configured' }, and no
 * function in this file ever throws. Phone numbers are only ever logged as
 * their last 4 digits, and message bodies are never logged.
 *
 * Env (see docs/twilio-sms.md):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 *   TWILIO_MESSAGING_SERVICE_SID   preferred sender (A2P 10DLC campaign lives here)
 *   TWILIO_PHONE_NUMBER            existing sender used by phone-verify-send and
 *                                  fda-recall; TWILIO_FROM_NUMBER is accepted too
 *   TEAM_SMS_NUMBERS               comma list of founder numbers for team alerts
 *   AYNA_TEXT_NUMBER               the public number people text, shown in the app
 *
 * Inbound signature checks stay in api/sms-webhook.js (twilio.validateRequest),
 * and E.164 normalization stays in api/_otp.js; both are re-exported here so new
 * code has one import.
 */
import { normalizeE164, maskedTail } from './_otp.js';

export { normalizeE164, maskedTail };

const SEND_TIMEOUT_MS = 8000;

export function twilioConfig() {
  const env = process.env;
  return {
    accountSid: (env.TWILIO_ACCOUNT_SID || '').trim(),
    authToken: (env.TWILIO_AUTH_TOKEN || '').trim(),
    messagingServiceSid: (env.TWILIO_MESSAGING_SERVICE_SID || '').trim(),
    fromNumber: (env.TWILIO_FROM_NUMBER || env.TWILIO_PHONE_NUMBER || '').trim(),
  };
}

/** Can ayna send an outbound text at all? */
export function isSmsConfigured() {
  const c = twilioConfig();
  return Boolean(c.accountSid && c.authToken && (c.messagingServiceSid || c.fromNumber));
}

/** Can the existing verification flow (api/phone-verify-send.js) send a code? It needs a from number. */
export function isVerifyConfigured() {
  const c = twilioConfig();
  return Boolean(c.accountSid && c.authToken && (process.env.TWILIO_PHONE_NUMBER || '').trim());
}

/** The public number she texts, E.164, or null when not set. */
export function aynaTextNumber() {
  return normalizeE164(process.env.AYNA_TEXT_NUMBER || '') || null;
}

/** Founder numbers for team alerts, normalized; bad entries are dropped. */
export function teamSmsNumbers() {
  return [...new Set(String(process.env.TEAM_SMS_NUMBERS || '')
    .split(',').map((n) => normalizeE164(n.trim())).filter(Boolean))];
}

/**
 * Send one text. Resolves { ok, sid?, error? }; never throws.
 * @param {string} to    any US format; normalized to E.164 here
 * @param {string} body  plain text
 */
export async function sendSms(to, body, { fetchImpl = fetch } = {}) {
  const c = twilioConfig();
  if (!isSmsConfigured()) return { ok: false, error: 'not_configured' };
  const dest = normalizeE164(typeof to === 'string' ? to : '');
  if (!dest) return { ok: false, error: 'invalid_phone_number' };
  const text = String(body || '').trim();
  if (!text) return { ok: false, error: 'empty_body' };

  const form = new URLSearchParams({ To: dest, Body: text.slice(0, 1600) });
  if (c.messagingServiceSid) form.set('MessagingServiceSid', c.messagingServiceSid);
  else form.set('From', c.fromNumber);

  try {
    const r = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(c.accountSid)}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${c.accountSid}:${c.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    let data = {};
    try { data = await r.json(); } catch { /* empty */ }
    if (!r.ok) {
      // Twilio error codes are safe to log; the body and number are not.
      console.error(`[twilio] send to ${maskedTail(dest)} failed: ${r.status} ${data?.code || ''}`);
      return { ok: false, error: 'twilio_send_failed', status: r.status, code: data?.code || null };
    }
    return { ok: true, sid: data?.sid || null };
  } catch (e) {
    console.error(`[twilio] send to ${maskedTail(dest)} failed:`, e?.name || 'error');
    return { ok: false, error: 'twilio_send_failed' };
  }
}

/**
 * Short alert to the founders. Never names or identifies the person who
 * triggered it. Resolves { sent, configured }; never throws, so callers can
 * await it without risking their own request.
 */
export async function sendTeamAlert(line, { fetchImpl = fetch } = {}) {
  try {
    const numbers = teamSmsNumbers();
    if (!numbers.length || !isSmsConfigured()) return { sent: 0, configured: false };
    const text = `ayna team: ${String(line || '').replace(/\s+/g, ' ').trim()}`.slice(0, 300);
    const results = await Promise.allSettled(numbers.map((n) => sendSms(n, text, { fetchImpl })));
    return { sent: results.filter((r) => r.status === 'fulfilled' && r.value.ok).length, configured: true };
  } catch (e) {
    console.error('[twilio] team alert failed:', e?.message);
    return { sent: 0, configured: true };
  }
}

/** Show a number to its owner without revealing it in full: "(***) ***-4567". */
export function maskForDisplay(e164) {
  const tail = String(e164 || '').replace(/\D/g, '').slice(-4);
  return tail ? `(***) ***-${tail}` : null;
}
