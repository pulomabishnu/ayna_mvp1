import { useEffect, useState } from 'react'
import { hasRecordedChoice, grantConsent, denyConsent } from '../utils/analyticsConsent'

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
 * Shown to EVERY visitor, including ones whose browser sends Global Privacy
 * Control (GPC) — main.jsx's GPC handling still keeps analytics off by
 * default until this banner is answered, but it must not suppress the
 * banner itself: see the comment at the top of analyticsConsent.js for why
 * conflating "GPC set an opt-out" with "the banner already asked" is wrong.
 * Clicking "Accept" here is a genuine, informed per-site choice a visitor is
 * allowed to make even with GPC on.
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
  const [visible, setVisible] = useState(() => !!ph && !hasRecordedChoice())

  useEffect(() => {
    if (ph) return
    const id = setInterval(() => {
      if (window.posthog) {
        setPh(window.posthog)
        setVisible(!hasRecordedChoice())
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
    <div role="dialog" aria-live="polite" aria-label="Analytics consent" className="consent-banner">
      <p>
        We use analytics to understand how people use Ayna so we can improve it.
        We don&apos;t use this data for advertising, and we don&apos;t sell it. If you
        choose &quot;Necessary only,&quot; we won&apos;t build any profile of your visits —
        we&apos;ll only count that a visit happened, with nothing that identifies
        you or links it to any other visit. Read our{' '}
        <a href="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>.
      </p>
      <div className="consent-banner__actions">
        <button
          type="button"
          data-testid="consent-decline"
          onClick={() => { denyConsent(ph); setVisible(false) }}
        >
          Necessary only
        </button>
        <button
          type="button"
          data-testid="consent-accept"
          onClick={() => { grantConsent(ph); setVisible(false) }}
        >
          Accept
        </button>
      </div>
    </div>
  )
}
