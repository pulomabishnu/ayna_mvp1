import posthog from 'posthog-js';

/* Google's "preferred sources" deeplink (Notion AYNA-340). Opens Google, where
   the person confirms the choice. Google sends nothing back, so this click is
   the last step we can see. */
export const PREFERRED_SOURCE_URL = 'https://www.google.com/preferences/source?q=aynahealth.co';

/** PostHog: someone clicked through to Google's preferred-source page. location: 'landing_end' | 'footer'. */
export function trackPreferredSourceClick(location) {
  try { posthog.capture('preferred_source_clicked', { location }); } catch { /* analytics never blocks */ }
}
