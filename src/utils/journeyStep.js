import { Capacitor } from '@capacitor/core';
import { apiUrl } from './apiUrl.js';
import { buyCountingRefused } from './productEventProps.js';
import { hasPersistedInternalBrowserMarker } from './founderAnalytics.js';
import { analyticsPlatform } from './analyticsPlatform.js';

/**
 * Anonymous journey step counter (same design as the Buy counter,
 * productEventProps.js countBuyClick). Tells /api/step "one visitor reached
 * this step on this platform". Only the step name and platform are sent: no
 * cookie, no account, no analytics id, no referrer. Stored as a daily count
 * per step in public.journey_step_daily.
 *
 * Runs before a consent choice and after Turn on. Nothing is sent after Keep
 * off, an account/app opt-out, or with Global Privacy Control
 * (buyCountingRefused), nor from founder browsers and test phones.
 * Fire-and-forget: never blocks or breaks the page.
 */
export const JOURNEY_STEPS = new Set(['landed', 'sign_up_free_clicked', 'quiz_started', 'quiz_completed', 'health_connected', 'account_created']);

function currentPlatform() {
  try {
    const p = analyticsPlatform(Capacitor.isNativePlatform(), Capacitor.getPlatform());
    return p === 'ios_app' || p === 'android_app' ? p : 'web';
  } catch { return 'web'; }
}

export function countJourneyStep(step) {
  if (!JOURNEY_STEPS.has(step)) return;
  try {
    if (buyCountingRefused()) return;
    if (hasPersistedInternalBrowserMarker()) return;
    if (typeof fetch !== 'function') return;
    // Not sendBeacon: a beacon always carries the site's cookies.
    fetch(apiUrl('/api/step'), {
      method: 'POST',
      body: JSON.stringify({ s: step, pl: currentPlatform() }),
      headers: { 'Content-Type': 'text/plain' },
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    }).catch(() => {});
  } catch { /* the counter never blocks the page */ }
}

/**
 * Is this page load the first of a visit? Uses no storage: a reload, or a
 * full page load that came from another ayna page, is not a new visit. The
 * app counts each cold start (main.jsx runs once per launch).
 */
export function isFirstLoadOfVisit({ doc = typeof document !== 'undefined' ? document : undefined, perf = typeof performance !== 'undefined' ? performance : undefined, isNative = false } = {}) {
  if (isNative) return true;
  try {
    const nav = perf?.getEntriesByType?.('navigation')?.[0];
    if (nav?.type === 'reload' || nav?.type === 'back_forward') return false;
  } catch { /* old browser: fall through */ }
  try {
    const ref = doc?.referrer ? new URL(doc.referrer) : null;
    const here = doc?.location?.hostname || '';
    if (ref && here && ref.hostname.replace(/^www\./, '') === here.replace(/^www\./, '')) return false;
  } catch { /* bad referrer: treat as a new visit */ }
  return true;
}

let landedSent = false;
/** Tests only. */
export function resetLandedForTests() { landedSent = false; }
/** "landed": once per page load, only for the first load of a visit. */
export function countLanded(opts = {}) {
  if (landedSent) return;
  landedSent = true;
  let native = false;
  try { native = Capacitor.isNativePlatform(); } catch { /* web */ }
  if (isFirstLoadOfVisit({ ...opts, isNative: native })) countJourneyStep('landed');
}
