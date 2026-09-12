import { useEffect, useState } from 'react'
import { hasRecordedChoice, acknowledgeAnalytics, denyConsent } from '../utils/analyticsConsent'

function gpcEnabled() {
  try {
    return typeof navigator !== 'undefined' && navigator.globalPrivacyControl === true
  } catch {
    return false
  }
}

/**
 * Bottom-of-screen analytics consent bar.
 *
 * Deliberately thin: every decision this makes lives in
 * src/utils/analyticsConsent.js, which is unit-tested. That matches how the
 * rest of this repo is organised — logic in utils with tests, components
 * untested.
 *
 * Two things about the visual design are intentional and shouldn't be
 * "improved" without reading why first:
 *
 *  1. BOTH buttons use the identical `.ayna-landing-chips button` pill style.
 *     Neither is filled or primary. A visually dominant Accept next to a
 *     de-emphasised decline is the exact dark pattern California penalised
 *     Sephora for under CCPA.
 *  2. There is no dismiss/close control. Silence is not a decision, so the
 *     bar persists across reloads until one of the two buttons is clicked,
 *     or until it's answered some other way (see the GPC/hasRecordedChoice
 *     checks below).
 *
 * Never shown when the browser sends Global Privacy Control (GPC) — main.jsx
 * already force-opts-out for that case, so there's no decision left to ask
 * for — or when the visitor already has an explicit analytics decision on
 * record from elsewhere (e.g. the "Usage analytics" toggle in account
 * settings), so returning users are never asked twice.
 *
 * The copy says "necessary storage", not "necessary cookies", because this
 * app sets no cookies — the necessary thing is the Supabase session living
 * in localStorage.
 */
export default function ConsentBanner() {
  // main.jsx assigns window.posthog inside posthog.init's `loaded` callback,
  // which can resolve after this component first renders. Rendering the bar
  // before then would give us buttons that call methods on `undefined`, so
  // we wait for it — but we have to actually re-render when it arrives, not
  // just check once, or the banner would never appear at all.
  const [ph, setPh] = useState(() => (typeof window !== 'undefined' ? window.posthog : undefined))
  const [visible, setVisible] = useState(() => !!ph && !gpcEnabled() && !hasRecordedChoice(ph))

  useEffect(() => {
    if (ph) return
    const id = setInterval(() => {
      if (window.posthog) {
        setPh(window.posthog)
        setVisible(!gpcEnabled() && !hasRecordedChoice(window.posthog))
      }
    }, 150)
    // If PostHog never loads (no VITE_PUBLIC_POSTHOG_KEY, blocked by an
    // extension, offline), stop polling and leave the banner hidden — there
    // is no analytics running, so there is no decision to ask for.
    const giveUp = setTimeout(() => clearInterval(id), 10000)
    return () => { clearInterval(id); clearTimeout(giveUp) }
  }, [ph])

  if (!visible) return null

  return (
    <div role="dialog" aria-live="polite" aria-label="Analytics notice" className="consent-banner">
      <p>
        Usage analytics are on by default so we can understand how people use ayna and improve it.
        We don&apos;t use analytics for advertising or sell it. Health-search text, account email, direct
        account IDs and common health-profile fields are stripped from analytics; session recording and
        automatic text/click capture are off. You can turn analytics off now or anytime from Privacy
        Preferences. Read our{' '}
        <a href="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>.
      </p>
      <div className="consent-banner__actions">
        <button
          type="button"
          data-testid="consent-decline"
          onClick={() => { denyConsent(ph); setVisible(false) }}
        >
          Turn analytics off
        </button>
        <button
          type="button"
          data-testid="consent-accept"
          onClick={() => { acknowledgeAnalytics(ph); setVisible(false) }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
