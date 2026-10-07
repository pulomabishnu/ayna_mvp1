import { useEffect, useRef, useState } from 'react'
import { hasRecordedChoice, acknowledgeAnalytics, denyConsent, isMandatoryGpcVisitor } from '../utils/analyticsConsent'

/**
 * Bottom-of-screen analytics consent bar.
 *
 * Consent behavior lives in src/utils/analyticsConsent.js. The two choices
 * intentionally keep equal visual weight: accepting analytics should not be
 * presented as the more prominent option. There is also no dismiss control;
 * silence is not recorded as a privacy choice.
 *
 * The notice stays concise, but preserves the important points from the
 * longer reviewed copy: analytics are for product improvement, not ads or
 * sale; sensitive health/account fields and automatic recording/capture are
 * excluded; and analytics can be turned off now or later.
 */
export default function ConsentBanner() {
  const [ph, setPh] = useState(() => (typeof window !== 'undefined' ? window.posthog : undefined))
  const [visible, setVisible] = useState(false)
  const bannerRef = useRef(null)

  // Keep fixed UI (including Ask Ayna) above the notice while it is visible.
  useEffect(() => {
    if (!visible) {
      document.documentElement.style.removeProperty('--consent-banner-height')
      return undefined
    }
    const el = bannerRef.current
    if (!el) return undefined
    const setHeight = () => {
      document.documentElement.style.setProperty('--consent-banner-height', `${el.offsetHeight}px`)
    }
    setHeight()
    const ro = new ResizeObserver(setHeight)
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.style.removeProperty('--consent-banner-height')
    }
  }, [visible])

  useEffect(() => {
    let cancelled = false

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

    // If PostHog never loads, there is no analytics decision to ask for.
    const giveUp = setTimeout(() => clearInterval(id), 10000)
    return () => { cancelled = true; clearInterval(id); clearTimeout(giveUp) }
  }, [ph])

  if (!visible) return null

  return (
    <div ref={bannerRef} role="dialog" aria-live="polite" aria-label="Analytics notice" className="consent-banner">
      <p>
        We use privacy-safe analytics to improve ayna — not for ads, and we don&apos;t sell the data. Sensitive health/account fields, session recording, and automatic text/click capture are excluded. You can turn analytics off now or anytime in Privacy Preferences.{' '}
        <a href="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>
      </p>
      <div className="consent-banner__actions">
        <button
          type="button"
          data-testid="consent-decline"
          onClick={() => { denyConsent(ph); setVisible(false) }}
        >
          Turn off
        </button>
        <button
          type="button"
          data-testid="consent-accept"
          onClick={() => { acknowledgeAnalytics(ph); setVisible(false) }}
        >
          OK
        </button>
      </div>
    </div>
  )
}
