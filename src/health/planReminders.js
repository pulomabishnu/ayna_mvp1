import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { readMeds } from './medications.js';
import { readActivities } from './dayPlan.js';

/**
 * Phone reminders for her medication times and timed activities. They fire with the app closed
 * (iOS local notifications). By default the lock screen never names the medication or activity (it could
 * say something about her health); since Nov 16 she can turn names on herself. Tapping one opens her Routine.
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
const NAMES_KEY = 'ayna_reminder_names_v1';
/** Nov 16 (founder chose "her choice, off by default"): she can let reminders name the medication or activity. */
export function reminderNamesOn() { try { return localStorage.getItem(NAMES_KEY) === '1'; } catch { return false; } }
export function setReminderNames(on) { try { localStorage.setItem(NAMES_KEY, on ? '1' : '0'); } catch { /* storage off */ } }
const andList = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] || '');

export function planReminderText({ time, meds = 0, acts = 0, medNames = [], actNames = [], showNames = false }) {
  const at = clock(time);
  if (showNames && (medNames.length || actNames.length)) {
    const bits = [medNames.length ? `take your ${andList(medNames)}` : '', actNames.length ? andList(actNames.map((t) => t.charAt(0).toLowerCase() + t.slice(1))) : ''].filter(Boolean);
    return { title: `ayna · ${at}`, body: `Time to ${bits.join(', and ')}. Tap to check ${meds + acts > 1 ? 'them' : 'it'} off.` };
  }
  if (meds + acts > 1) {
    const parts = [meds && `${meds === 1 ? 'a medication' : `${meds} medications`}`, acts && `${acts === 1 ? 'an activity' : `${acts} activities`}`].filter(Boolean);
    return { title: `ayna plan · ${at}`, body: `Time for ${parts.join(' and ')}. Tap to check them off.` };
  }
  return meds
    ? { title: `ayna plan · ${at}`, body: 'Time for your medication. Tap to check it off.' }
    : { title: `ayna plan · ${at}`, body: 'Time for your activity. Tap to check it off.' };
}

/** Pure: the notifications to schedule (tested). Capacitor weekday is 1 = Sunday … 7 = Saturday. */
export function planNotifications({ meds = readMeds().meds, activities = readActivities().items, today = null, showNames = reminderNamesOn() } = {}) {
  // One notification per time slot, however many things are due then.
  const slots = new Map();
  const add = (time, weekday, kind, name = '') => {
    const k = `${time}|${weekday ?? '*'}`;
    const slot = slots.get(k) || { time, weekday, meds: 0, acts: 0, medNames: [], actNames: [] };
    slot[kind] += 1;
    const list = kind === 'meds' ? slot.medNames : slot.actNames;
    if (name && !list.includes(name)) list.push(name);
    slots.set(k, slot);
  };
  for (const m of meds) {
    if (!m.active || !m.remind || m.kind !== 'scheduled') continue;
    if (today && m.end && m.end < today) continue;
    for (const t of m.times) {
      if (m.freq === 'daily') add(t, null, 'meds', m.name);
      else for (const d of m.days) add(t, d + 1, 'meds', m.name);
    }
  }
  for (const a of activities) {
    if (!a.active || !a.remind || !a.time) continue;
    if (!a.days?.length) add(a.time, null, 'acts', a.title);
    else for (const d of a.days) add(a.time, d + 1, 'acts', a.title);
  }
  // A daily slot already covers that time on every weekday.
  for (const [k, slot] of slots) {
    if (slot.weekday == null) continue;
    const daily = slots.get(`${slot.time}|*`);
    if (daily) { daily.meds += slot.meds; daily.acts += slot.acts; daily.medNames.push(...slot.medNames.filter((n) => !daily.medNames.includes(n))); daily.actNames.push(...slot.actNames.filter((n) => !daily.actNames.includes(n))); slots.delete(k); }
  }
  const out = [];
  const used = new Set();
  for (const slot of slots.values()) {
    const [hour, minute] = slot.time.split(':').map(Number);
    let id = BASE + (hash(`slot|${slot.time}|${slot.weekday ?? '*'}`) % SPAN);
    while (used.has(id)) id = BASE + ((id - BASE + 1) % SPAN);
    used.add(id);
    const { title, body } = planReminderText({ ...slot, showNames });
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
