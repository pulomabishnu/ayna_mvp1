import { getStoredConsent, grantConsent, denyConsent } from '../utils/analyticsConsent'

/**
 * Lets a visitor change the analytics decision they made in ConsentBanner,
 * from the site footer. Required counterpart to the banner — a consent
 * mechanism you can't reverse isn't really consent. Complements (does not
 * replace) the "Usage analytics" toggle in account settings — this one also
 * works for signed-out visitors, who have no account settings to go to.
 *
 * Renders nothing until PostHog is on `window` (see the note in
 * ConsentBanner.jsx) and nothing before a first banner decision exists,
 * since in that state the banner itself is already on screen asking.
 *
 * The reload is intentional: posthog.identify() and the pageview both run on
 * mount in App.jsx/main.jsx, so re-running the page is the honest way to get
 * the new decision applied to this visit rather than the next one.
 */
export default function PrivacyPreferencesLink({ style }) {
  const current = getStoredConsent()
  if (typeof window === 'undefined' || !window.posthog || !current) return null

  const toggle = () => {
    if (current === 'granted') denyConsent(window.posthog)
    else grantConsent(window.posthog)
    window.location.reload()
  }

  // Owns its own leading separator so the footer's fine-print line doesn't
  // end in a dangling " · " on the renders where this returns null.
  return (
    <>
      {' · '}
      <button type="button" className="privacy-preferences-link" style={style} onClick={toggle}>
        {current === 'granted' ? 'Switch to necessary only' : 'Turn analytics back on'}
      </button>
    </>
  )
}
