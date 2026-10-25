/**
 * "Say ayna to start" while the app is open (founder, Oct 24 20:12): only
 * with an on-device wake word, nothing recorded, stored or sent.
 *
 * The web layer cannot promise that: the Web Speech API streams audio to a
 * speech service (Google's in Chrome; Apple's Speech framework in Safari and
 * the iOS web view, with no way to require on-device recognition from the
 * web). So always-on listening is NOT built on it. The setting exists, is off
 * by default, and can only be turned on when the app ships a native,
 * on-device wake-word plugin named "AynaWakeWord" (see the report: an
 * SFSpeechRecognizer with requiresOnDeviceRecognition, or a keyword model).
 * Until then it says so plainly.
 */
const KEY = 'ayna_wake_word_v1';
export const WAKE_PLUGIN = 'AynaWakeWord';

let capacitor = null;
async function cap() {
  if (capacitor !== null) return capacitor;
  try { capacitor = (await import('@capacitor/core')).Capacitor; } catch { capacitor = false; }
  return capacitor;
}

/** { available, reason }: available only with the native on-device plugin. */
export async function wakeWordSupport() {
  const C = await cap();
  const native = Boolean(C && C.isNativePlatform?.());
  if (native && C.isPluginAvailable?.(WAKE_PLUGIN)) return { available: true, reason: '' };
  return {
    available: false,
    reason: native
      ? 'Listening for “ayna” needs an app update that keeps the listening on this phone. Until then, tap the mic.'
      : 'Listening for “ayna” only comes with the ayna app, with the listening kept on the phone. Here, tap the mic.',
  };
}

/** Her choice, off unless she turned it on (and only kept when it can run). */
export function readWakeWordPref() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}
export function writeWakeWordPref(on) {
  try { if (on) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch { /* storage blocked */ }
  return Boolean(on);
}

/**
 * Starts the native listener when it exists and she turned it on. Calls
 * onWake() when the plugin hears "ayna". Returns a stop function (a no-op
 * when nothing started).
 */
export async function startWakeWord(onWake) {
  const support = await wakeWordSupport();
  if (!support.available || !readWakeWordPref()) return () => {};
  try {
    const { registerPlugin } = await import('@capacitor/core');
    const plugin = registerPlugin(WAKE_PLUGIN);
    const handle = await plugin.addListener('wake', () => onWake?.());
    await plugin.start({ keyword: 'ayna' });
    return () => { try { plugin.stop(); handle?.remove?.(); } catch { /* gone */ } };
  } catch { return () => {}; }
}
