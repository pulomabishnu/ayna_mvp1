import { LocalNotifications as Plugin } from '@capacitor/local-notifications';

/**
 * Nov 25 (founder: "do the notifs buzz / make a noise?"). On iOS the local-notifications plugin only sets a
 * sound when one is given, and with no sound a reminder arrives silently: no tone, no vibration. Every
 * reminder now asks for the system default, which also vibrates when the phone is on silent. (A sound name
 * the app doesn't bundle makes iOS play its default tone.) Push already sends sound: 'default' (api/_apns.js).
 */
// Nov 25 (founder): ayna's own notification sound, bundled in the iPhone app (ios/App/App/ayna-notify.caf,
// 3.3 s, from Ameera's upload). If iOS can't find it, it plays the default tone.
export const NOTIFICATION_SOUND = 'ayna-notify.caf';

/**
 * Nov 25 (founder: "use all these" notification types). Lock Screen, Notification Center and banners come with
 * the alert permission. On top of that, each reminder gets:
 * - a thread, so iOS groups them by kind (reminders, daily rundown, Pro, updates);
 * - Time Sensitive for the reminders she set herself (medicines, products, plan), so they come through a Focus
 *   or a Scheduled Summary. Apple reserves Time Sensitive for things that matter right now, so nudges and Pro
 *   notices stay at the normal level.
 */
const THREADS = { routine: 'ayna-reminders', today: 'ayna-updates', pro: 'ayna-pro' };

export function withSound(options) {
  if (!options || !Array.isArray(options.notifications)) return options;
  return {
    ...options,
    notifications: options.notifications.map((n) => {
      const route = n?.extra?.route;
      const thread = n?.extra?.rundown ? 'ayna-rundown' : THREADS[route] || 'ayna';
      return { sound: NOTIFICATION_SOUND, threadIdentifier: thread, ...(route === 'routine' ? { interruptionLevel: 'timeSensitive' } : {}), ...n };
    }),
  };
}

/** Same plugin, but schedule() always asks for a sound. Use this instead of importing the plugin directly. */
export const LocalNotifications = new Proxy(Plugin, {
  get(target, key) {
    if (key === 'schedule') return (options) => target.schedule(withSound(options));
    const value = target[key];
    return typeof value === 'function' ? value.bind(target) : value;
  },
});
