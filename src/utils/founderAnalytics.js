const INTERNAL_BROWSER_KEY = 'ayna_internal_analytics_v1';

// Exact founder account aliases observed in PostHog. Keeping this list exact
// avoids broad substring matching that could accidentally suppress analytics
// for a real user with a similar name. The email is only used locally at
// sign-in to decide whether this browser should be marked internal; it is
// never sent to PostHog.
export const INTERNAL_FOUNDER_EMAILS = new Set([
  'ameera@aynahealth.co',
  'ao369@cornell.edu',
  'lalaloops99@gmail.com',
  'o.ameera24@gmail.com',
  'eliz@aynahealth.co',
  'elizcelik2003@gmail.com',
  'puloma@aynahealth.co',
  'pulomabishnu@gmail.com',
]);

export function isFounderEmail(email) {
  return INTERNAL_FOUNDER_EMAILS.has(String(email || '').trim().toLowerCase());
}

export function hasPersistedInternalBrowserMarker() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(INTERNAL_BROWSER_KEY) === 'founder';
  } catch {
    return false;
  }
}

function isNativeRuntime() {
  if (typeof window === 'undefined') return false;
  try {
    return window.Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

/**
 * Whether founder analytics should be suppressed at the capture boundary.
 *
 * Website founder traffic stays fully suppressed. Native/TestFlight traffic is
 * intentionally allowed through so the tester-only PostHog QA dashboard can
 * verify real builds. tagFounderAnalyticsIfNeeded() still tags the native
 * person/session as internal, so customer dashboards continue to exclude it.
 */
export function hasInternalBrowserMarker() {
  return hasPersistedInternalBrowserMarker() && !isNativeRuntime();
}

function persistInternalBrowserMarker() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(INTERNAL_BROWSER_KEY, 'founder');
  } catch {
    // Private browsing can deny storage; person/event properties still work
    // for the active session.
  }
}

/**
 * Marks a founder session/browser as internal without sending the founder's
 * email or auth UUID to PostHog.
 *
 * Once a founder signs in on a browser, the browser marker persists so future
 * signed-out visits on that same Chrome/Safari profile remain internal too.
 * New browsers/devices become internal as soon as the founder signs in once.
 *
 * Native/TestFlight builds deliberately keep this internal tag even though
 * hasInternalBrowserMarker() does not suppress their capture. That separation
 * lets QA see tester events while customer-facing metrics filter them out.
 */
export function tagFounderAnalyticsIfNeeded(ph, email = '') {
  if (!ph) return false;

  const founder = isFounderEmail(email);
  if (founder) persistInternalBrowserMarker();
  if (!founder && !hasPersistedInternalBrowserMarker()) return false;

  try {
    ph.register?.({ is_internal: true, internal_role: 'founder' });
    ph.people?.set?.({ is_internal: true, internal_role: 'founder' });
    return true;
  } catch {
    return false;
  }
}
