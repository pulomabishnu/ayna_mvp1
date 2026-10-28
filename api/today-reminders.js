/**
 * /api/today-reminders: "Remind me tonight" and the follow-up nudge on the
 * day a try is due (Phase 1, step 7; master prompt sections 95 to 97).
 *
 *   POST  (her Supabase JWT)   { kind: 'tonight' | 'follow_up' | 'rundown' | 'saved', sendAt: ISO, tz: IANA }
 *         schedules one nudge. Nothing about what it is for is sent or stored.
 *   GET/POST with Authorization: Bearer $CRON_SECRET (Vercel cron, ?sweep=1)
 *         sends what is due through APNs (api/_apns.js).
 *
 * Every push reads "Your ayna check-in is ready": no health words and no
 * product names on the lock screen (sections 98, 99). Delivery respects her
 * notification preferences: notifications off, quiet hours, and at most one
 * Today nudge per local day.
 *
 * Schema: supabase/today_reminders_2026-10-24.sql (+ the rundown and saved kind
 * migrations). Nothing is sent, and
 * nothing throws, while APNs is not configured.
 */
/* global process */
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from './_usageLimit.js';
import { apnsConfigured, pushToUser } from './_apns.js';

export const KINDS = new Set(['tonight', 'follow_up', 'rundown', 'saved']);
export const PUSH_MESSAGE = Object.freeze({ title: 'ayna', body: 'Your ayna check-in is ready', data: { route: 'today' } });
// UX spec 23: private wording, nothing about her health on the lock screen.
export const RUNDOWN_PUSH_MESSAGE = Object.freeze({ title: 'ayna', body: 'Your daily rundown is ready.', data: { route: 'today' } });
// "Remind me later" on a saved item: the server never learns which item (it
// stays on her device, src/utils/savedReminders.js), and the lock screen says
// nothing about what it is.
export const SAVED_PUSH_MESSAGE = Object.freeze({ title: 'ayna', body: 'Something you saved is waiting', data: { route: 'saved' } });
export const messageFor = (kind) => (kind === 'rundown' ? RUNDOWN_PUSH_MESSAGE : kind === 'saved' ? SAVED_PUSH_MESSAGE : PUSH_MESSAGE);
const MAX_AHEAD_MS = 120 * 86400000;
const MAX_SCHEDULED = 30;
const PAGE = 300;

let _admin = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

export function validTz(tz) {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false;
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
}

/** 'YYYY-MM-DD' and 'HH:MM' in her time zone. */
export function localParts(t, tz) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hhmm: `${p.hour}:${p.minute}` };
}

/** Quiet hours may wrap midnight (22:00 to 07:00). */
export function inQuietHours(hhmm, start, end) {
  if (!start || !end || start === end) return false;
  return start < end ? hhmm >= start && hhmm < end : hhmm >= start || hhmm < end;
}

/**
 * What to do with one due reminder:
 *   { action: 'send' } | { action: 'skip', reason } | { action: 'defer', until: ISO }
 * prefs: { notificationsEnabled, quietHoursEnabled, quietHoursStart, quietHoursEnd }
 * sentDays: Set of her local days that already had a Today nudge.
 */
export function planDelivery(row, prefs = {}, sentDays = new Set(), now = Date.now()) {
  if (prefs.notificationsEnabled === false) return { action: 'skip', reason: 'notifications_off' };
  const tz = validTz(row.tz) ? row.tz : 'America/New_York';
  const { day, hhmm } = localParts(now, tz);
  const quiet = prefs.quietHoursEnabled && inQuietHours(hhmm, prefs.quietHoursStart, prefs.quietHoursEnd);
  const capped = sentDays.has(day);
  if (row.kind === 'tonight') {
    // "Tonight" means tonight: if it can't go now, it doesn't go.
    if (quiet) return { action: 'skip', reason: 'quiet_hours' };
    if (capped) return { action: 'skip', reason: 'daily_cap' };
    return { action: 'send' };
  }
  // A follow-up or a morning rundown can wait: try again in an hour (quiet
  // hours) or tomorrow (cap).
  if (quiet) return { action: 'defer', until: new Date(now + 3600000).toISOString() };
  if (capped) return { action: 'defer', until: new Date(now + 86400000).toISOString() };
  return { action: 'send' };
}

async function schedule(req, res) {
  const { user, error, admin: verifiedAdmin } = await verifyUser(req);
  if (!user) return res.status(401).json({ error: error || 'auth_required' });
  const db = verifiedAdmin || getAdmin();
  if (!db) return res.status(500).json({ error: 'server_misconfigured' });
  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch { return res.status(400).json({ error: 'invalid_json' }); }
  const kind = body?.kind;
  const sendAt = Date.parse(body?.sendAt);
  const tz = validTz(body?.tz) ? body.tz : 'America/New_York';
  if (!KINDS.has(kind)) return res.status(400).json({ error: 'invalid_kind' });
  if (!Number.isFinite(sendAt) || sendAt < Date.now() - 5 * 60000 || sendAt > Date.now() + MAX_AHEAD_MS) return res.status(400).json({ error: 'invalid_time' });

  const { data: pending, error: readError } = await db.from('today_reminders')
    .select('id, kind, send_at, tz').eq('user_id', user.id).eq('status', 'scheduled').limit(MAX_SCHEDULED + 1);
  if (readError) return res.status(503).json({ error: 'not_ready' });
  // One "tonight" per local day, and one follow-up per local day: a second tap reuses it.
  const wantDay = localParts(sendAt, tz).day;
  const same = (pending || []).find((r) => r.kind === kind && localParts(Date.parse(r.send_at), validTz(r.tz) ? r.tz : tz).day === wantDay);
  if (same) return res.status(200).json({ ok: true, id: same.id, existing: true });
  if ((pending || []).length >= MAX_SCHEDULED) return res.status(429).json({ error: 'too_many_reminders' });
  const { data, error: insertError } = await db.from('today_reminders')
    .insert({ user_id: user.id, kind, send_at: new Date(sendAt).toISOString(), tz }).select('id').single();
  if (insertError) return res.status(503).json({ error: 'not_ready' });
  return res.status(200).json({ ok: true, id: data?.id || null });
}

async function prefsFor(admin, userIds) {
  const { data } = await admin.from('notification_preferences')
    .select('user_id, notifications_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end').in('user_id', userIds);
  return new Map((data || []).map((r) => [r.user_id, {
    notificationsEnabled: r.notifications_enabled !== false,
    quietHoursEnabled: r.quiet_hours_enabled === true,
    quietHoursStart: r.quiet_hours_start || '22:00',
    quietHoursEnd: r.quiet_hours_end || '07:00',
  }]));
}

export async function sweep(admin, { now = Date.now(), push = pushToUser } = {}) {
  const stats = { due: 0, sent: 0, skipped: 0, deferred: 0, failed: 0 };
  const { data: due, error } = await admin.from('today_reminders')
    .select('id, user_id, kind, send_at, tz').eq('status', 'scheduled').lte('send_at', new Date(now).toISOString())
    .order('send_at', { ascending: true }).limit(PAGE);
  if (error) throw new Error('reminder_read_failed');
  if (!due?.length) return stats;
  stats.due = due.length;
  const users = [...new Set(due.map((r) => r.user_id))];
  const prefs = await prefsFor(admin, users);
  const since = new Date(now - 2 * 86400000).toISOString();
  const { data: recent } = await admin.from('today_reminders').select('user_id, sent_at, tz').eq('status', 'sent').gte('sent_at', since).in('user_id', users);
  const sentDays = new Map(users.map((u) => [u, new Set()]));
  for (const r of recent || []) if (Number.isFinite(Date.parse(r.sent_at))) sentDays.get(r.user_id)?.add(localParts(Date.parse(r.sent_at), validTz(r.tz) ? r.tz : 'America/New_York').day);

  for (const row of due) {
    const plan = planDelivery(row, prefs.get(row.user_id) || {}, sentDays.get(row.user_id), now);
    if (plan.action === 'skip') {
      await admin.from('today_reminders').update({ status: 'skipped', skip_reason: plan.reason }).eq('id', row.id);
      stats.skipped += 1;
      continue;
    }
    if (plan.action === 'defer') {
      await admin.from('today_reminders').update({ send_at: plan.until }).eq('id', row.id);
      stats.deferred += 1;
      continue;
    }
    let result = { sent: 0, devices: 0 };
    try { result = await push(admin, row.user_id, messageFor(row.kind)); } catch { result = { sent: 0, devices: -1 }; }
    if (result.sent > 0) {
      await admin.from('today_reminders').update({ status: 'sent', sent_at: new Date(now).toISOString() }).eq('id', row.id);
      sentDays.get(row.user_id)?.add(localParts(now, validTz(row.tz) ? row.tz : 'America/New_York').day);
      stats.sent += 1;
    } else {
      await admin.from('today_reminders').update({ status: 'skipped', skip_reason: result.devices === 0 ? 'no_device' : 'push_failed' }).eq('id', row.id);
      stats.failed += 1;
    }
  }
  return stats;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  const isCron = String(req.query?.sweep || '') === '1' || req.method === 'GET';
  if (isCron) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || (req.headers.authorization || '') !== `Bearer ${cronSecret}`) return res.status(401).json({ error: 'unauthorized' });
    if (!apnsConfigured()) return res.status(200).json({ ok: true, configured: false, sent: 0 });
    const admin = getAdmin();
    if (!admin) return res.status(503).json({ error: 'not_configured' });
    try {
      return res.status(200).json({ ok: true, ...(await sweep(admin)) });
    } catch (e) {
      console.error('[today-reminders] sweep failed:', e?.message);
      return res.status(500).json({ error: 'sweep_failed' });
    }
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  return schedule(req, res);
}
