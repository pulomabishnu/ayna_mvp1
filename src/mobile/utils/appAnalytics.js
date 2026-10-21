import posthog from 'posthog-js';

/**
 * PostHog events from the app (the native iOS build and /mobile-preview).
 * Same event names and properties as the website, plus `source: 'app'`, so
 * the website dashboards and the "Mobile App (TestFlight)" dashboard can
 * share one set of insights. main.jsx registers `platform` on every event.
 * Analytics never break the app.
 */
export function trackApp(event, properties = {}) {
  try { posthog.capture(event, { source: 'app', ...properties }); } catch { /* analytics unavailable */ }
}

/** Screen name for $screen: the overlay if one is open, else the base screen. */
export function appScreenName(screen, overlayType) {
  if (overlayType) return String(overlayType);
  return String(screen || 'unknown');
}
