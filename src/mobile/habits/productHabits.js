import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Per product, on this phone only: the day she started using it, and an optional daily reminder.
 * Focus group: Vivian (Oct 1) wanted start dates on what she uses; Ashlie (Oct 16) wanted reminders
 * to stay consistent with supplements. Nothing here goes to analytics or the server, and the lock
 * screen never names the product (it could say something about her health).
 */
const KEY = 'ayna_product_habits_v1';
export const REMINDER_BODY = 'Time for your ayna routine.';
const BASE_ID = 9100;

export function readHabits() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
function write(all) { try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage unavailable */ } }
export function habitFor(id) { return readHabits()[id] || {}; }
export function setHabit(id, patch) {
  const all = readHabits();
  const next = { ...(all[id] || {}), ...patch };
  if (!next.started && !next.remind) delete all[id]; else all[id] = next;
  write(all);
  return next;
}

/** Stable notification id per product (pure, tested). */
export function reminderId(productId) {
  let h = 0;
  for (const c of String(productId)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return BASE_ID + (h % 800);
}

/** "HH:MM" -> plugin schedule (pure, tested). */
export function reminderSchedule(productId, time = '09:00') {
  const [h, m] = String(time).split(':').map((n) => Number.parseInt(n, 10));
  return { notifications: [{ id: reminderId(productId), title: '', body: REMINDER_BODY, schedule: { on: { hour: Number.isFinite(h) ? h : 9, minute: Number.isFinite(m) ? m : 0 }, allowWhileIdle: true }, extra: { route: 'routine', productId } }] };
}

export const remindersAvailable = () => { try { return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications'); } catch { return false; } };

/** Turn a product's daily reminder on (asks permission in context) or off. Returns 'scheduled' | 'off' | 'denied' | 'unavailable' | 'error'. */
export async function syncProductReminder(productId, { on, time = '09:00' }) {
  if (!remindersAvailable()) return 'unavailable';
  try {
    await LocalNotifications.cancel({ notifications: [{ id: reminderId(productId) }] }).catch(() => {});
    if (!on) return 'off';
    const now = await LocalNotifications.checkPermissions();
    let ok = now.display === 'granted';
    if (!ok && now.display !== 'denied') ok = (await LocalNotifications.requestPermissions()).display === 'granted';
    if (!ok) return 'denied';
    await LocalNotifications.schedule(reminderSchedule(productId, time));
    return 'scheduled';
  } catch {
    return 'error';
  }
}
