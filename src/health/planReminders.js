import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { readMeds } from './medications.js';
import { readActivities } from './dayPlan.js';

/**
 * Phone reminders for her medication times and timed activities. They fire with the app closed
 * (iOS local notifications). The lock screen never names the medication or activity: it could say
 * something about her health (founder rule). Tapping one opens her Routine.
 * Ids live in 12000..15999 so they never collide with the rundown (9000s) or product habits (9100s).
 */
export const PLAN_REMINDER_BODY = 'Time for something on your ayna plan.';
const BASE = 12000;
const SPAN = 4000;
const IDS_KEY = 'ayna_plan_notif_ids_v1';

function hash(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Pure: the notifications to schedule (tested). Capacitor weekday is 1 = Sunday … 7 = Saturday. */
export function planNotifications({ meds = readMeds().meds, activities = readActivities().items, today = null } = {}) {
  const out = [];
  const used = new Set();
  const push = (key, time, weekday, route) => {
    const [hour, minute] = time.split(':').map(Number);
    let id = BASE + (hash(`${key}|${time}|${weekday ?? '*'}`) % SPAN);
    while (used.has(id)) id = BASE + ((id - BASE + 1) % SPAN);
    used.add(id);
    out.push({ id, title: '', body: PLAN_REMINDER_BODY, schedule: { on: weekday ? { weekday, hour, minute } : { hour, minute }, allowWhileIdle: true }, extra: { route } });
  };
  for (const m of meds) {
    if (!m.active || !m.remind || m.kind !== 'scheduled') continue;
    if (today && m.end && m.end < today) continue;
    for (const t of m.times) {
      if (m.freq === 'daily') push(`med:${m.id}`, t, null, 'routine');
      else for (const d of m.days) push(`med:${m.id}`, t, d + 1, 'routine');
    }
  }
  for (const a of activities) {
    if (!a.active || !a.remind || !a.time) continue;
    if (!a.days?.length) push(`act:${a.id}`, a.time, null, 'routine');
    else for (const d of a.days) push(`act:${a.id}`, a.time, d + 1, 'routine');
  }
  return out;
}

const native = () => { try { return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications'); } catch { return false; } };
export const planRemindersAvailable = native;

function readIds() { try { const v = JSON.parse(localStorage.getItem(IDS_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } }
function writeIds(ids) { try { localStorage.setItem(IDS_KEY, JSON.stringify(ids)); } catch { /* storage off */ } }

/**
 * Cancel what was scheduled before and schedule what her plan says now. Asks permission only when
 * `ask` is true (she just turned a reminder on). Returns 'scheduled' | 'none' | 'denied' | 'unavailable' | 'error'.
 */
export async function syncPlanReminders({ ask = false, today = null } = {}) {
  if (!native()) return 'unavailable';
  try {
    const old = readIds();
    if (old.length) await LocalNotifications.cancel({ notifications: old.map((id) => ({ id })) }).catch(() => {});
    writeIds([]);
    const list = planNotifications({ today });
    if (!list.length) return 'none';
    const p = await LocalNotifications.checkPermissions();
    let ok = p.display === 'granted';
    if (!ok && ask && p.display !== 'denied') ok = (await LocalNotifications.requestPermissions()).display === 'granted';
    if (!ok) return 'denied';
    await LocalNotifications.schedule({ notifications: list });
    writeIds(list.map((n) => n.id));
    return 'scheduled';
  } catch {
    return 'error';
  }
}

/** Tapping a plan reminder opens her Routine. Returns a remover. */
export function onPlanReminderTap(go) {
  if (!native()) return () => {};
  const handle = LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const id = action?.notification?.id;
    if (typeof id === 'number' && id >= BASE && id < BASE + SPAN) go?.();
  });
  return () => { handle.then((h) => h.remove()).catch(() => {}); };
}
