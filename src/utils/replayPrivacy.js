/**
 * replayPrivacy.js
 *
 * Session replay (PostHog) for the website and the app. The app runs
 * posthog-js inside its Capacitor WebView, so one set of rules covers both.
 *
 * What the privacy policy promises, and how this file keeps it:
 *
 *  - Only with consent. Replay runs only for a visitor who clicked "Turn on"
 *    after the notice described recording (hasReplayConsent in
 *    analyticsConsent.js). An older "Turn on" from before replay existed does
 *    not count. Keep off, the closed notice, GPC, and the founders' own
 *    browsers never record.
 *  - Never quiz answers, conditions, symptoms or other health details.
 *    Replay runs only on browse-and-read screens (allowlist below); every
 *    screen where she enters or sees her own health information is not
 *    recorded at all. New screens are NOT recorded until someone adds them
 *    here on purpose.
 *  - Never what she types or reads. All text and every input is masked, so
 *    a replay shows layout, taps and scrolling, not words. Text-carrying
 *    attributes (alt, aria-label, title, placeholder, value, data-*) are
 *    masked too, and links/images have search text and health-topic slugs
 *    removed (scrubUrl). Images she uploads (blob:/data:), video and canvas
 *    are never captured; console logs and network requests are not recorded.
 *  - Campus Resources sends nothing at all (main.jsx before_send).
 *
 * Belt and braces: recording is stopped when she opens a screen that isn't
 * on the allowlist, and before_send also drops any buffered replay frame
 * whose timestamp falls inside a time she was on such a screen
 * (createReplayGuard), so a late flush can't leak one.
 */
import { scrubUrl } from './analyticsSanitize.js';

// Website views (App.jsx currentView) where replay may run.
export const REPLAY_SAFE_WEB_VIEWS = new Set([
  'welcome', 'hero', 'explore', 'explore-services', 'explore-topics', 'discovery', 'product',
  'comparison', 'recalls', 'omitted', 'waitlist', 'community', 'privacy-policy',
  'consumer-health-data', 'terms-of-use', 'how-we-make-money', 'how-it-works', 'about',
  'contact', 'confirmed', 'not-found',
]);

// App screens/overlays (MobileApp.jsx appScreenName) where replay may run.
// Not here on purpose: quiz, intake, reveal, why-match, plan, today, ask,
// checkin, connect, eco, saved, profile, article.
export const REPLAY_SAFE_APP_VIEWS = new Set([
  'landing', 'signin', 'browse', 'explore', 'library', 'community', 'product', 'compare', 'about',
]);

// Health-topic and content detail pages: the address alone names a topic
// (same rule analyticsSanitize.js applies to URLs), so they are not recorded
// even inside an allowed section.
const HEALTH_DETAIL_PATH = /^\/(?:a|read|reads|article|articles|library|playlists|community\/.+|explore\/topics|campus-resources)(?:\/|$)/i;
const HEALTH_DETAIL_EXCEPT = /^\/explore\/topics\/?$/i; // the topic list itself is fine
// Community posts (/community/p/<id>) and member pages are under
// /community/... and are caught above; only the list at /community is recorded.

/**
 * May this screen be recorded?
 * @param {{ view?: string, pathname?: string, native?: boolean }} where
 */
export function isReplaySafeLocation({ view, pathname = '/', native = false } = {}) {
  const v = String(view || '');
  if (!v) return false; // view not known yet: don't record
  const path = String(pathname || '/');
  if (HEALTH_DETAIL_PATH.test(path) && !HEALTH_DETAIL_EXCEPT.test(path)) return false;
  // The app, and the web preview of the app, name screens the app's way.
  if (native || /^\/mobile-preview(\/|$)/.test(path)) return REPLAY_SAFE_APP_VIEWS.has(v);
  return REPLAY_SAFE_WEB_VIEWS.has(v);
}

/** Should replay be running right now? Every condition must hold. */
export function replayAllowed({ optedIn, replayConsent, gpc, internal, safeLocation }) {
  return optedIn === true && replayConsent === true && gpc !== true && internal !== true && safeLocation === true;
}

// Attributes that carry words someone could read.
const TEXT_ATTRIBUTES = new Set(['alt', 'aria-label', 'aria-description', 'aria-valuetext', 'title', 'placeholder', 'value', 'label', 'content', 'download']);
const URL_ATTRIBUTES = new Set(['href', 'src', 'action', 'formaction', 'poster', 'cite']);

export function maskReplayAttribute(name, value) {
  if (typeof value !== 'string' || !value) return value;
  const n = String(name).toLowerCase();
  if (TEXT_ATTRIBUTES.has(n) || n.startsWith('data-')) return '*'.repeat(Math.min(value.length, 12));
  if (URL_ATTRIBUTES.has(n)) return scrubUrl(value, { allowProducts: true });
  if (n === 'srcset') return '';
  return value;
}

/** posthog-js `session_recording` options. */
export const SESSION_RECORDING_OPTIONS = {
  maskAllInputs: true,
  maskTextSelector: '*',
  maskAttributeFn: maskReplayAttribute,
  // Uploaded health screenshots and previews are blob:/data: images.
  // [data-replay-block] lets a component opt a region out entirely.
  blockSelector: 'img[src^="blob:"], img[src^="data:"], video, iframe, [data-replay-block]',
  // Charts (cycle, wearable data) can draw health data on a canvas.
  captureCanvas: { recordCanvas: false },
  recordHeaders: false,
  recordBody: false,
  maskCapturedNetworkRequestFn: () => null,
  maskNetworkRequestFn: () => null,
};

// Frames this close before a switch to an unsafe screen are dropped too:
// React draws the new screen a moment before the view effect runs.
export const UNSAFE_LEAD_MS = 1500;

/**
 * Remembers when the visitor was on a screen that may not be recorded, and
 * removes replay frames from those times.
 */
export function createReplayGuard(now = () => Date.now()) {
  const unsafe = []; // [{ start, end }] end === null while still on it
  let current = null;
  return {
    update(safe) {
      if (!safe && !current) {
        current = { start: now() - UNSAFE_LEAD_MS, end: null };
        unsafe.push(current);
      } else if (safe && current) {
        current.end = now();
        current = null;
      }
      // Old windows can't matter once their frames have been flushed.
      while (unsafe.length > 20) unsafe.shift();
    },
    isUnsafeAt(ts) {
      if (typeof ts !== 'number') return current !== null;
      return unsafe.some((w) => ts >= w.start && (w.end === null || ts <= w.end));
    },
    /** Returns the $snapshot event with unsafe frames removed, or null. */
    filterSnapshot(event) {
      const data = event?.properties?.$snapshot_data;
      if (data == null) return null;
      const frames = Array.isArray(data) ? data : [data];
      const kept = frames.filter((f) => !this.isUnsafeAt(f?.timestamp));
      if (!kept.length) return null;
      if (kept.length === frames.length) return event;
      return { ...event, properties: { ...event.properties, $snapshot_data: Array.isArray(data) ? kept : kept[0] } };
    },
  };
}

export const VIEW_CHANGED_EVENT = 'ayna:view-changed';
/**
 * App.jsx and MobileApp.jsx already record the current screen in
 * window.__aynaView (app_error uses it). Turn that into an event, so main.jsx
 * can start or stop replay whenever the screen changes.
 */
export function installReplayViewWatch() {
  if (typeof window === 'undefined') return;
  const desc = Object.getOwnPropertyDescriptor(window, '__aynaView');
  if (desc && desc.set) return; // already installed
  let current = window.__aynaView;
  try {
    Object.defineProperty(window, '__aynaView', {
      configurable: true,
      get: () => current,
      set: (name) => {
        const changed = name !== current;
        current = name;
        if (changed) { try { window.dispatchEvent(new Event(VIEW_CHANGED_EVENT)); } catch { /* ignore */ } }
      },
    });
  } catch { /* can't watch: replay stays off until the next address change */ }
}

/**
 * Some screens change the address without changing the view (opening a
 * community post, a topic). Re-check replay on every address change too.
 */
export function installReplayHistoryWatch() {
  if (typeof window === 'undefined' || window.__aynaReplayHistoryWatch) return;
  window.__aynaReplayHistoryWatch = true;
  const fire = () => { try { window.dispatchEvent(new Event(VIEW_CHANGED_EVENT)); } catch { /* ignore */ } };
  for (const method of ['pushState', 'replaceState']) {
    const original = window.history?.[method];
    if (typeof original !== 'function') continue;
    window.history[method] = function patchedHistory(...args) {
      const result = original.apply(this, args);
      fire();
      return result;
    };
  }
  window.addEventListener('popstate', fire);
}
