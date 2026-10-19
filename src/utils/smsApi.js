/**
 * Client for /api/sms (her text message settings). Same pattern as
 * src/health/healthApi.js: authenticated with her own Supabase session, never
 * sends a user id of its own, never logs her number.
 *
 * Every call resolves to the status shape from /api/sms:
 *   { configured, phone, verified, stopped, prefs: { reminders, orders, chat, healthDetails },
 *     prefsSaved, textNumber, consentVersion }
 * (start resolves { ok, sent }). Errors throw SmsApiError(code, status).
 */
import { getSupabaseClient } from './supabaseClient.js';
import { apiUrl } from './apiUrl.js';

export class SmsApiError extends Error {
  constructor(code, status) { super(code); this.code = code; this.status = status; }
}

async function token() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function call(method, body) {
  const t = await token();
  if (!t) throw new SmsApiError('not_signed_in', 401);
  let res;
  try {
    res = await fetch(apiUrl(method === 'GET' ? '/api/sms?action=status' : '/api/sms'), {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new SmsApiError('network', 0);
  }
  let data = {};
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new SmsApiError(data?.error || `http_${res.status}`, res.status);
  return data;
}

export const fetchSmsStatus = () => call('GET');
export const startSmsVerify = (phone) => call('POST', { action: 'start', phone });
export const checkSmsVerify = (phone, code) => call('POST', { action: 'verify', phone, code });
/** Only the keys you pass change; each one must be true or false. */
export const saveSmsPrefs = (prefs) => {
  const body = { action: 'prefs' };
  for (const k of ['reminders', 'orders', 'chat', 'healthDetails']) {
    if (typeof prefs?.[k] === 'boolean') body[k] = prefs[k];
  }
  return call('POST', body);
};
export const removeSmsPhone = () => call('POST', { action: 'remove' });
