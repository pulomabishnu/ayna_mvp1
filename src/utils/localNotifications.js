import { LocalNotifications as Plugin } from '@capacitor/local-notifications';

/**
 * Nov 25 (founder: "do the notifs buzz / make a noise?"). On iOS the local-notifications plugin only sets a
 * sound when one is given, and with no sound a reminder arrives silently: no tone, no vibration. Every
 * reminder now asks for the system default, which also vibrates when the phone is on silent. (A sound name
 * the app doesn't bundle makes iOS play its default tone.) Push already sends sound: 'default' (api/_apns.js).
 */
export const NOTIFICATION_SOUND = 'default';

export function withSound(options) {
  if (!options || !Array.isArray(options.notifications)) return options;
  return { ...options, notifications: options.notifications.map((n) => ({ sound: NOTIFICATION_SOUND, ...n })) };
}

/** Same plugin, but schedule() always asks for a sound. Use this instead of importing the plugin directly. */
export const LocalNotifications = new Proxy(Plugin, {
  get(target, key) {
    if (key === 'schedule') return (options) => target.schedule(withSound(options));
    const value = target[key];
    return typeof value === 'function' ? value.bind(target) : value;
  },
});
