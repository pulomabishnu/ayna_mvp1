import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { DEFAULT_RUNDOWN_TIME, readRundownPush } from '../../components/today/rundownPush.js';

/**
 * The daily "Your ayna daily rundown is ready." reminder, on the phone itself
 * (founder, Nov 3: every day, default 8:00 am, changeable in Settings).
 *
 * Why on-device: the old server reminder booked one day at a time and only
 * re-booked when she opened a Rundown, so one skipped day stopped it for good;
 * it also needed APNs set up and a sign-in. A repeating local notification
 * fires every day at her time with none of that. Nothing about her health is
 * on the lock screen. Asked for permission in context (after her first
 * Rundown, or when she turns it on in Settings), never at launch (Apple HIG).
 */
export const RUNDOWN_NOTIFICATION_ID = 8800;
export const RUNDOWN_NOTIFICATION_BODY = 'Your ayna daily rundown is ready.';

const native = () => {
  try { return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications'); } catch { return false; }
};
export const localRundownAvailable = native;

/** The schedule we hand the plugin for "HH:MM" (pure, tested). */
export function rundownSchedule(time = DEFAULT_RUNDOWN_TIME) {
  const [h, m] = String(time || DEFAULT_RUNDOWN_TIME).split(':').map((n) => Number.parseInt(n, 10));
  const hour = Number.isFinite(h) && h >= 0 && h < 24 ? h : 8;
  const minute = Number.isFinite(m) && m >= 0 && m < 60 ? m : 0;
  return {
    notifications: [{
      id: RUNDOWN_NOTIFICATION_ID,
      title: '',
      body: RUNDOWN_NOTIFICATION_BODY,
      schedule: { on: { hour, minute }, allowWhileIdle: true },
      extra: { route: 'today', rundown: true },
    }],
  };
}

async function permitted(ask) {
  const now = await LocalNotifications.checkPermissions();
  if (now.display === 'granted') return true;
  if (!ask || now.display === 'denied') return false;
  const asked = await LocalNotifications.requestPermissions();
  return asked.display === 'granted';
}

/**
 * Book (or re-book) the repeating reminder at her time. `ask` lets it show the
 * iOS permission prompt; without it, it only schedules if she already allowed.
 * @returns 'scheduled' | 'off' | 'denied' | 'unavailable' | 'error'
 */
export async function syncRundownReminder({ ask = false, pref = readRundownPush() } = {}) {
  if (!native()) return 'unavailable';
  try {
    await LocalNotifications.cancel({ notifications: [{ id: RUNDOWN_NOTIFICATION_ID }] }).catch(() => {});
    if (!pref.on) return 'off';
    if (!(await permitted(ask))) return 'denied';
    await LocalNotifications.schedule(rundownSchedule(pref.time));
    return 'scheduled';
  } catch {
    return 'error';
  }
}

/** Tapping the reminder opens Today. Returns a remover. */
export function onRundownReminderTap(go) {
  if (!native()) return () => {};
  const handle = LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    if (action?.notification?.id === RUNDOWN_NOTIFICATION_ID || action?.notification?.extra?.rundown) go?.();
  });
  return () => { handle.then((h) => h.remove()).catch(() => {}); };
}
