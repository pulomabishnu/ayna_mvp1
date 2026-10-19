/**
 * /api/sms-reminders, daily reminder texts (Vercel cron, see vercel.json).
 *
 * Same CRON_SECRET Bearer auth as /api/discover-products and the fda-recall
 * sweep: Vercel sends `Authorization: Bearer $CRON_SECRET` on cron calls.
 *
 * Who gets a text: reminders=true in sms_preferences, a verified number in
 * phone_numbers, and no STOP on either table. At most one reminder per person
 * per New York day (sms_events kind 'reminder').
 *
 *   health details ON:  her stored period logs (health_daily_metrics,
 *                       menstrual_flow; WHOOP is never stored) give a
 *                       next-period estimate exactly 3 days away -> restock text.
 *   anyone, on the 1st: a generic monthly check-in nudge with nothing
 *                       health-specific in it.
 *
 * Nothing is sent, and nothing throws, while Twilio is not configured.
 */
/* global process */
import { getServiceClient } from './_usageLimit.js';
import { readMetrics } from './_healthStore.js';
import { buildInsights } from '../src/health/insights.js';
import { SITE } from './_email.js';
import { isSmsConfigured, sendSms } from './_twilio.js';
import { canText, countEventsToday, etDay, logSmsEvent, prefsFromRow } from './_smsStore.js';

export const PERIOD_TEXT = `ayna: your next period may start in about 3 days. Restock your period products? ${SITE}/shop`;
export const CHECKIN_TEXT = `ayna: your monthly check-in is ready. ${SITE}/you`;
const PAGE = 500;
const DAY = 86400000;

const addDays = (isoDay, n) => new Date(Date.parse(`${isoDay}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);

/** The next-period estimate day from her own stored rows, or null. */
export function nextPeriodDay(rows, today) {
  const cycle = buildInsights(rows, { today }).sections.find((s) => s.id === 'cycle');
  return cycle?.estimate?.day || null;
}

/** Which reminder (if any) she should get today. Health details decide what may be read. */
export async function pickReminder(admin, userId, prefs, today) {
  if (prefs.healthDetails) {
    const rows = (await readMetrics(admin, userId)).filter((r) => r.metric === 'menstrual_flow' && r.source !== 'whoop');
    if (rows.length && nextPeriodDay(rows, today) === addDays(today, 3)) return { kind: 'period', body: PERIOD_TEXT };
  }
  if (today.endsWith('-01')) return { kind: 'checkin', body: CHECKIN_TEXT };
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[sms-reminders] CRON_SECRET is not set; refusing all requests.');
    return res.status(401).json({ error: 'unauthorized' });
  }
  if ((req.headers.authorization || '') !== `Bearer ${cronSecret}`) return res.status(401).json({ error: 'unauthorized' });

  if (!isSmsConfigured()) return res.status(200).json({ ok: true, configured: false, sent: 0 });
  const admin = getServiceClient();
  if (!admin) return res.status(503).json({ error: 'not_configured' });

  const now = Date.now();
  const today = etDay(now);
  const stats = { considered: 0, sent: 0, skipped: 0, failed: 0 };

  try {
    for (let from = 0; ; from += PAGE) {
      const { data: subs, error } = await admin.from('sms_preferences')
        .select('user_id, reminders, orders, chat, health_details, stopped_at')
        .eq('reminders', true)
        .order('user_id', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw new Error('subscriber_read_failed');
      const live = (subs || []).filter((s) => !s.stopped_at);
      if (live.length) {
        const { data: phones, error: phoneError } = await admin.from('phone_numbers')
          .select('user_id, phone_number, is_verified, sms_opted_out')
          .in('user_id', live.map((s) => s.user_id));
        if (phoneError) throw new Error('phone_read_failed');
        const phoneBy = new Map((phones || []).map((p) => [p.user_id, p]));

        for (const sub of live) {
          stats.considered += 1;
          const phone = phoneBy.get(sub.user_id);
          if (!canText(phone, sub, 'reminders')) { stats.skipped += 1; continue; }
          try {
            if (await countEventsToday(admin, sub.user_id, 'reminder', now) > 0) { stats.skipped += 1; continue; }
            const pick = await pickReminder(admin, sub.user_id, prefsFromRow(sub), today);
            if (!pick) { stats.skipped += 1; continue; }
            // Logged before sending, so a retry of this cron run can never double-text her.
            await logSmsEvent(admin, sub.user_id, 'reminder', { type: pick.kind });
            const out = await sendSms(phone.phone_number, pick.body);
            if (out.ok) stats.sent += 1; else stats.failed += 1;
          } catch (e) {
            stats.failed += 1;
            console.error('[sms-reminders] one person failed:', e?.message);
          }
        }
      }
      if (!subs || subs.length < PAGE) break;
    }
  } catch (e) {
    console.error('[sms-reminders] run failed:', e?.message);
    return res.status(500).json({ error: 'reminders_failed', ...stats });
  }

  return res.status(200).json({ ok: true, configured: true, today, ...stats });
}
