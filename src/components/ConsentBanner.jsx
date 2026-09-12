import { useEffect, useState } from 'react'
import { hasRecordedChoice, acknowledgeAnalytics, denyConsent, isMandatoryGpcVisitor } from '../utils/analyticsConsent'

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
 *     bar persists across reloads until one of the two buttons is clicked.
 *
 * Hidden only for visitors in a state whose privacy law actually mandates
 * honoring Global Privacy Control (see isMandatoryGpcVisitor() /
 * api/_gpcRegions.js) — GPC's legal scope is narrow (opt-out of sale/
 * sharing, which this app's analytics isn't). A GPC sender OUTSIDE those
 * states is corrected to the same default-on, consent-still-pending state
 * as anyone else in main.jsx (via set_config, not opt_in_capturing — see
 * the comment there), so they see this notice exactly like a normal
 * visitor would, and can decline the same way. The region check is async
 * and only runs at all when GPC is actually active, so most visitors
 * resolve instantly with no network call.
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
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Only mandatory-GPC visitors trigger the async region check; everyone
    // else resolves synchronously (isMandatoryGpcVisitor short-circuits to
    // Promise.resolve(false) without a network call — see
    // analyticsConsent.js), so there's no visible delay for the common case.
    async function resolveVisibility(instance) {
      if (hasRecordedChoice(instance)) return false
      if (await isMandatoryGpcVisitor()) return false
      return true
    }
    if (ph) {
      resolveVisibility(ph).then((v) => { if (!cancelled) setVisible(v) })
      return () => { cancelled = true }
    }
    const id = setInterval(() => {
      if (window.posthog) {
        setPh(window.posthog)
        resolveVisibility(window.posthog).then((v) => { if (!cancelled) setVisible(v) })
      }
    }, 150)
    // If PostHog never loads (no VITE_PUBLIC_POSTHOG_KEY, blocked by an
    // extension, offline), stop polling and leave the banner hidden — there
    // is no analytics running, so there is no decision to ask for.
    const giveUp = setTimeout(() => clearInterval(id), 10000)
    return () => { cancelled = true; clearInterval(id); clearTimeout(giveUp) }
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
