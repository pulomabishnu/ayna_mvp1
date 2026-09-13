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
  if (typeof window === 'undefined' || !window.posthog) return null

  const stored = getStoredConsent()
  let sdkStatus
  try { sdkStatus = window.posthog.get_explicit_consent_status?.() } catch { sdkStatus = undefined }
  const current = stored || (sdkStatus === 'denied' ? 'denied' : 'granted')

  const toggle = () => {
    if (current === 'granted') denyConsent(window.posthog)
    else grantConsent(window.posthog)
    window.location.reload()
  }

  return (
    <>
      {' · '}
      <button type="button" className="privacy-preferences-link" style={style} onClick={toggle}>
        {current === 'granted' ? 'Turn usage analytics off' : 'Turn usage analytics on'}
      </button>
    </>
  )
}
