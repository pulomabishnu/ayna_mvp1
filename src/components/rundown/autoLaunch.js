/**
 * When the Daily Rundown opens on its own (founder, Oct 25):
 *   - App: the first open of the day at or after 8:00 local time opens it,
 *     once, and only when it has real content.
 *   - Before 8: no interruption; the next open at or after 8 does it.
 *   - Already viewed or skipped today (auto or by hand): never again today.
 *   - Opened from a link or a notification for something else, during the
 *     first-time flow, or with another dialog open: don't take over.
 *   - Website: highlight the card instead of a full screen story.
 *   - Reduced motion (founder, Oct 24): it still opens, but static: no
 *     transitions and no auto-advance (RundownStory reads the same setting).
 * Pure decision here; the memory (viewedDay, autoDay) lives per owner in
 * rundownStore.js.
 */
export const AUTO_HOUR = 8;
export const EXTERNAL_OPEN_MS = 30000;

/**
 * @returns {'open'|'highlight'|'none'}
 */
export function autoLaunchDecision({
  now = new Date(), today, surface = 'app', hasContent = false, memory = {}, reducedMotion = false,
  externalOpen = false, firstTime = false, dialogOpen = false,
} = {}) {
  if (!hasContent || !today) return 'none';
  if (memory.viewedDay === today || memory.autoDay === today) return 'none';
  if (now.getHours() < AUTO_HOUR) return 'none';
  void reducedMotion; // Opens either way; RundownStory makes it static.
  if (surface !== 'app') return 'highlight';
  if (externalOpen || firstTime || dialogOpen) return 'none';
  return 'open';
}

// Opens that came from outside (a deep link or a notification tap for
// something other than Today): remembered briefly so Today never hijacks them.
let lastExternalOpen = 0;
export function noteExternalOpen(at = Date.now()) { lastExternalOpen = at; }
export function openedExternally(now = Date.now()) { return now - lastExternalOpen < EXTERNAL_OPEN_MS; }

const DEEP_PARAMS = ['product', 'article', 'post', 'share', 'ask', 'topic', 'answer', 'q'];
/** True when the page was opened at a specific thing (a shared or deep link). */
export function urlIsDeepLink(search = typeof window !== 'undefined' ? window.location.search : '') {
  try { const p = new URLSearchParams(search); return DEEP_PARAMS.some((k) => p.has(k)); } catch { return false; }
}

let listening = false;
/** Listen once for native deep links and notification taps (no-op on the web). */
export async function listenForExternalOpens() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { App } = await import('@capacitor/app');
    App.addListener('appUrlOpen', () => noteExternalOpen());
    const { PushNotifications } = await import('@capacitor/push-notifications');
    // A Today push ("Your daily rundown is ready.") is not "something else".
    PushNotifications.addListener('pushNotificationActionPerformed', (a) => { if (a?.notification?.data?.route !== 'today') noteExternalOpen(); });
  } catch { /* not native */ }
}
