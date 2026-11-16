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

function clock(time) {
  const [h, m] = time.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/**
 * What the lock screen says (founder, Nov 16: "make the notif more specific"). Specific about the
 * kind, the time and how many, never the name: "8:00 AM: time for your medication."
 */
export function planReminderText({ time, meds = 0, acts = 0 }) {
  const at = clock(time);
  if (meds + acts > 1) {
    const parts = [meds && `${meds === 1 ? 'a medication' : `${meds} medications`}`, acts && `${acts === 1 ? 'an activity' : `${acts} activities`}`].filter(Boolean);
    return { title: `ayna plan · ${at}`, body: `Time for ${parts.join(' and ')}. Tap to check them off.` };
  }
  return meds
    ? { title: `ayna plan · ${at}`, body: 'Time for your medication. Tap to check it off.' }
    : { title: `ayna plan · ${at}`, body: 'Time for your activity. Tap to check it off.' };
}

/** Pure: the notifications to schedule (tested). Capacitor weekday is 1 = Sunday … 7 = Saturday. */
export function planNotifications({ meds = readMeds().meds, activities = readActivities().items, today = null } = {}) {
  // One notification per time slot, however many things are due then.
  const slots = new Map();
  const add = (time, weekday, kind) => {
    const k = `${time}|${weekday ?? '*'}`;
    const slot = slots.get(k) || { time, weekday, meds: 0, acts: 0 };
    slot[kind] += 1;
    slots.set(k, slot);
  };
  for (const m of meds) {
    if (!m.active || !m.remind || m.kind !== 'scheduled') continue;
    if (today && m.end && m.end < today) continue;
    for (const t of m.times) {
      if (m.freq === 'daily') add(t, null, 'meds');
      else for (const d of m.days) add(t, d + 1, 'meds');
    }
  }
  for (const a of activities) {
    if (!a.active || !a.remind || !a.time) continue;
    if (!a.days?.length) add(a.time, null, 'acts');
    else for (const d of a.days) add(a.time, d + 1, 'acts');
  }
  // A daily slot already covers that time on every weekday.
  for (const [k, slot] of slots) {
    if (slot.weekday == null) continue;
    const daily = slots.get(`${slot.time}|*`);
    if (daily) { daily.meds += slot.meds; daily.acts += slot.acts; slots.delete(k); }
  }
  const out = [];
  const used = new Set();
  for (const slot of slots.values()) {
    const [hour, minute] = slot.time.split(':').map(Number);
    let id = BASE + (hash(`slot|${slot.time}|${slot.weekday ?? '*'}`) % SPAN);
    while (used.has(id)) id = BASE + ((id - BASE + 1) % SPAN);
    used.add(id);
    const { title, body } = planReminderText(slot);
    out.push({ id, title, body, schedule: { on: slot.weekday ? { weekday: slot.weekday, hour, minute } : { hour, minute }, allowWhileIdle: true }, extra: { route: 'routine' } });
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
    // Nov 16: make sure iOS really holds them; if not, say so instead of failing silently.
    try {
      const pending = await LocalNotifications.getPending();
      const ids = new Set((pending?.notifications || []).map((n) => Number(n.id)));
      if (!list.some((n) => ids.has(n.id))) return 'error';
    } catch { /* older plugin: trust the schedule call */ }
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

/** A reminder 5 seconds from now, so she can see what one looks like (and that they work). Generic text only. */
export async function sendTestReminder() {
  if (!native()) return 'unavailable';
  try {
    const p = await LocalNotifications.checkPermissions();
    let ok = p.display === 'granted';
    if (!ok && p.display !== 'denied') ok = (await LocalNotifications.requestPermissions()).display === 'granted';
    if (!ok) return 'denied';
    await LocalNotifications.schedule({ notifications: [{ id: BASE + SPAN - 1, title: 'ayna plan', body: 'This is how your reminders will look. Tap to open your plan.', schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true }, extra: { route: 'routine' } }] });
    return 'test_sent';
  } catch {
    return 'error';
  }
}
