// Nov 16 (founder: "make sure the notifications are set up, like finish setting up your profile"): one phone
// reminder the next evening while set-up isn't finished; cancelled the moment it is. Never asks for permission
// on its own (reminders ask when she turns one on), and never names anything about her health.
import { Capacitor } from '@capacitor/core';

export const SETUP_NUDGE_ID = 9960;

/** Pure (tested): the reminder for `left` steps, at 6:30 PM the next day. */
export function setupNudge(left, now = new Date()) {
  if (!(left > 0)) return null;
  const at = new Date(now); at.setDate(at.getDate() + 1); at.setHours(18, 30, 0, 0);
  return { id: SETUP_NUDGE_ID, title: 'Finish setting up ayna', body: `${left} quick ${left === 1 ? 'step' : 'steps'} left. They make your matches more you.`, schedule: { at, allowWhileIdle: true }, extra: { route: 'today' } };
}

export async function syncSetupNudge(left) {
  try {
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('LocalNotifications')) return;
    const { LocalNotifications } = await import('../utils/localNotifications.js');
    await LocalNotifications.cancel({ notifications: [{ id: SETUP_NUDGE_ID }] }).catch(() => {});
    const n = setupNudge(left);
    if (!n) return;
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return;
    await LocalNotifications.schedule({ notifications: [n] });
  } catch { /* best effort */ }
}
