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

export function hasInternalBrowserMarker() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(INTERNAL_BROWSER_KEY) === 'founder';
  } catch {
    return false;
  }
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
 */
export function tagFounderAnalyticsIfNeeded(ph, email = '') {
  if (!ph) return false;

  const founder = isFounderEmail(email);
  if (founder) persistInternalBrowserMarker();
  if (!founder && !hasInternalBrowserMarker()) return false;

  try {
    ph.register?.({ is_internal: true, internal_role: 'founder' });
    ph.people?.set?.({ is_internal: true, internal_role: 'founder' });
    return true;
  } catch {
    return false;
  }
}
