import { Capacitor } from '@capacitor/core';

/**
 * App Review 2.3.10: an iPhone app may not name other mobile platforms (Android,
 * Health Connect, Play Store). On iOS the copy names only what works there.
 */
export function onIosApp() {
  try { return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'; } catch { return false; }
}

/** "Apple Health, Health Connect and Oura", or "Apple Health and Oura" in the iPhone app. */
export function healthSourcesText({ or = false } = {}) {
  const join = or ? 'or' : 'and';
  return onIosApp() ? `Apple Health ${join} Oura` : `Apple Health, Health Connect ${join} Oura`;
}
