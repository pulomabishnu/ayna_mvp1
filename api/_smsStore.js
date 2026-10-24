/**
 * Per-feature SMS opt-ins (sms_preferences) and the consent/audit log
 * (sms_events). Schema: supabase/sms_2026-10-19.sql.
 *
 * The phone number itself, its verification and the carrier-level STOP state
 * stay where they always were: phone_numbers (phone_number, is_verified,
 * sms_opted_out), written by api/phone-verify-confirm.js and api/sms-webhook.js.
 *
 * LEGACY: people who verified through the website "ayna by text" screen
 * (src/components/PhoneVerification.jsx) agreed there that "your messages will
 * be used to give you personalized health information", and have no
 * sms_preferences row. For them chat (with her profile) keeps working exactly
 * as before; reminders and order texts stay off. The moment she saves her
 * text settings in the app, the explicit row is the only thing that counts.
 *
 * sms_events never holds a message body or a phone number.
 */
import { SITE } from './_email.js';
import { sendSms } from './_twilio.js';

export const SMS_CONSENT_VERSION = 'sms-2026-10-19';
export const SMS_DAILY_CHAT_LIMIT = 5;
export const PREF_KEYS = ['reminders', 'orders', 'chat', 'healthDetails'];
const COLUMN = { reminders: 'reminders', orders: 'orders', chat: 'chat', healthDetails: 'health_details' };

export const ALL_OFF = Object.freeze({ reminders: false, orders: false, chat: false, healthDetails: false });
export const LEGACY_PREFS = Object.freeze({ reminders: false, orders: false, chat: true, healthDetails: true });

export function prefsFromRow(row) {
  if (!row) return { ...LEGACY_PREFS };
  return {
    reminders: row.reminders === true,
    orders: row.orders === true,
    chat: row.chat === true,
    healthDetails: row.health_details === true,
  };
}

export function rowFromPrefs(prefs) {
  const out = {};
  for (const k of PREF_KEYS) out[COLUMN[k]] = prefs[k] === true;
  return out;
}

export async function loadPhone(admin, userId) {
  const { data, error } = await admin.from('phone_numbers')
    .select('phone_number, is_verified, sms_opted_out').eq('user_id', userId).maybeSingle();
  if (error) throw new Error('phone_read_failed');
  return data || null;
}

export async function loadPrefsRow(admin, userId) {
  const { data, error } = await admin.from('sms_preferences')
    .select('user_id, reminders, orders, chat, health_details, stopped_at, consent_text_version, consent_at')
    .eq('user_id', userId).maybeSingle();
  if (error) throw new Error('prefs_read_failed');
  return data || null;
}

/** Append to the audit log. Failures are logged, never thrown. */
export async function logSmsEvent(admin, userId, kind, detail = null) {
  try {
    const { error } = await admin.from('sms_events').insert({ user_id: userId, kind, detail, created_at: new Date().toISOString() });
    if (error) console.error('[sms] event log failed:', kind, error.message);
  } catch (e) {
    console.error('[sms] event log failed:', kind, e?.message);
  }
}

/**
 * Claim today's reminder for one person BEFORE texting her. Returns false when
 * another run already claimed it. With supabase/FIX_security_reliability_2026-10-21.sql
 * applied, a unique index on (user_id, detail->>'day') for kind 'reminder'
 * makes two overlapping cron runs (Vercel can deliver a cron twice) unable to
 * both pass; without it this behaves like the old log-then-send.
 */
export async function claimReminderDay(admin, userId, day, type) {
  try {
    const { error } = await admin.from('sms_events').insert({ user_id: userId, kind: 'reminder', detail: { type, day }, created_at: new Date().toISOString() });
    if (!error) return true;
    if (error.code === '23505') return false;
    console.error('[sms] reminder claim failed:', error.message);
    return true;
  } catch (e) {
    console.error('[sms] reminder claim failed:', e?.message);
    return true;
  }
}

const etFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
/** Calendar day in New York, 'YYYY-MM-DD'. Every "per day" rule uses this. */
export const etDay = (t = Date.now()) => etFmt.format(new Date(t));

/** The UTC instant New York's current day began, as ISO. */
export function etDayStartIso(t = Date.now()) {
  const d = etDay(t);
  for (const off of ['-04:00', '-05:00']) {
    const start = Date.parse(`${d}T00:00:00${off}`);
    if (etDay(start) === d && etDay(start - 1) !== d) return new Date(start).toISOString();
  }
  return new Date(Date.parse(`${d}T05:00:00Z`)).toISOString();
}

/** How many events of `kind` she has today (New York day). */
export async function countEventsToday(admin, userId, kind, now = Date.now()) {
  const { data, count, error } = await admin.from('sms_events')
    .select('id', { count: 'exact' })
    .eq('user_id', userId).eq('kind', kind).gte('created_at', etDayStartIso(now));
  if (error) throw new Error('events_read_failed');
  return typeof count === 'number' ? count : (Array.isArray(data) ? data.length : 0);
}

/** Can this person receive a text of feature `pref` right now? */
export function canText(phone, prefsRow, pref) {
  if (!phone?.phone_number || !phone.is_verified || phone.sms_opted_out) return false;
  if (prefsRow?.stopped_at) return false;
  return prefsFromRow(prefsRow)[pref] === true;
}

const ORDER_LINES = {
  placed: 'we got your order',
  shipped: 'your order has shipped',
  delivered: 'your order was delivered',
  canceled: 'your order was canceled',
};
export const ORDER_KINDS = Object.keys(ORDER_LINES);

/**
 * Order status text. There is no ayna order/checkout backend yet ("Buy on
 * ayna" links out to retailers), so nothing calls this today: call it from
 * the order status update path when one exists, after the status is saved.
 *
 * The product name is only included when she turned on health details, since
 * the products ayna sells are health products. Resolves { sent, reason };
 * never throws.
 */
export async function sendOrderText(admin, userId, kind, { productName } = {}, { fetchImpl = fetch } = {}) {
  try {
    if (!ORDER_LINES[kind]) return { sent: false, reason: 'unknown_kind' };
    const [phone, prefsRow] = await Promise.all([loadPhone(admin, userId), loadPrefsRow(admin, userId)]);
    if (!canText(phone, prefsRow, 'orders')) return { sent: false, reason: 'not_opted_in' };
    const name = prefsFromRow(prefsRow).healthDetails && typeof productName === 'string'
      ? productName.replace(/\s+/g, ' ').trim().slice(0, 60) : '';
    const body = `ayna: ${ORDER_LINES[kind]}${name ? ` (${name})` : ''}. Details: ${SITE}/you`;
    const out = await sendSms(phone.phone_number, body, { fetchImpl });
    if (out.ok) await logSmsEvent(admin, userId, `order_${kind}`);
    return { sent: out.ok, reason: out.ok ? null : out.error };
  } catch (e) {
    console.error('[sms] order text failed:', e?.message);
    return { sent: false, reason: 'error' };
  }
}
