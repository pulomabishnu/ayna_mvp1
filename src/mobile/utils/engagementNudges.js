// Nov 16 (founder: "we need phone notifications, like 'wow you're doing great' if you're walking a lot, 'log your
// symptoms', or if you haven't been on in a while"). Phone reminders scheduled on the device, so they work without
// the push server. Each is re-planned every time she opens the app. They never ask for permission on their own
// (reminders ask when she turns one on) and never say anything about her health beyond steps.
import { Capacitor } from '@capacitor/core';

export const NUDGE_IDS = { log: 9970, away3: 9971, away7: 9972, moving: 9973 };
const MOVING_KEY = 'ayna_nudge_moving_week_v1';

const at = (base, days, h, m = 0) => { const d = new Date(base); d.setDate(d.getDate() + days); d.setHours(h, m, 0, 0); return d; };
const weekOf = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x.toISOString().slice(0, 10); };

/**
 * Pure (tested). now: Date; loggedToday: boolean; steps: [{ day: 'YYYY-MM-DD', value }] (her connected data);
 * movingWeek: the week a "moving more" note was last planned.
 */
export function planNudges({ now = new Date(), loggedToday = false, steps = [], movingWeek = null } = {}) {
  const out = [];
  // Evening log, today, if she hasn't logged yet and it's not too late.
  const evening = at(now, 0, 20, 30);
  if (!loggedToday && evening > now) out.push({ id: NUDGE_IDS.log, title: 'How was today?', body: 'Log it in 10 seconds. It makes tomorrow’s rundown more you.', schedule: { at: evening, allowWhileIdle: true }, extra: { route: 'today' } });
  // Haven't opened the app in a while (moved forward every time she opens it).
  out.push({ id: NUDGE_IDS.away3, title: 'Your rundown has something new', body: 'A few things changed since you last looked. Come see.', schedule: { at: at(now, 3, 18, 30), allowWhileIdle: true }, extra: { route: 'today' } });
  out.push({ id: NUDGE_IDS.away7, title: 'ayna found new picks for you', body: 'New products that fit what you told us. Take a look.', schedule: { at: at(now, 7, 18, 30), allowWhileIdle: true }, extra: { route: 'today' } });
  // Moving more than usual: the last 3 days vs the 3 weeks before, at most once a week.
  const vals = [...steps].filter((r) => Number(r.value) > 0).sort((a, b) => (a.day < b.day ? -1 : 1));
  if (vals.length >= 14 && movingWeek !== weekOf(now)) {
    const recent = vals.slice(-3).map((r) => Number(r.value));
    const before = vals.slice(-24, -3).map((r) => Number(r.value));
    const avg = (xs) => xs.reduce((s, v) => s + v, 0) / xs.length;
    if (before.length >= 10 && avg(recent) >= avg(before) * 1.2) {
      out.push({ id: NUDGE_IDS.moving, title: 'You’re doing great', body: 'You’ve moved more than usual the last few days. Keep it going.', schedule: { at: at(now, 1, 9, 0), allowWhileIdle: true }, extra: { route: 'today' }, movingWeek: weekOf(now) });
    }
  }
  return out;
}

export async function syncEngagementNudges(input) {
  try {
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('LocalNotifications')) return;
    const { LocalNotifications } = await import('../../utils/localNotifications.js');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return;
    let movingWeek = null; try { movingWeek = localStorage.getItem(MOVING_KEY); } catch { /* storage off */ }
    const list = planNudges({ ...input, movingWeek });
    // The moving note stays put once planned this week; everything else is re-planned.
    await LocalNotifications.cancel({ notifications: [NUDGE_IDS.log, NUDGE_IDS.away3, NUDGE_IDS.away7].map((id) => ({ id })) }).catch(() => {});
    const moving = list.find((n) => n.id === NUDGE_IDS.moving);
    if (moving) { try { localStorage.setItem(MOVING_KEY, moving.movingWeek); } catch { /* storage off */ } }
    if (list.length) await LocalNotifications.schedule({ notifications: list.map((n) => { const c = { ...n }; delete c.movingWeek; return c; }) });
  } catch { /* best effort */ }
}
