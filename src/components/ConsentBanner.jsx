import { useEffect, useRef, useState } from 'react'
import { hasRecordedChoice, acknowledgeAnalytics, denyConsent, isMandatoryGpcVisitor, isGpcActive, PRIVACY_CHOICES_EVENT } from '../utils/analyticsConsent'

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
 *  2. Closing the notice is an explicit privacy-preserving opt-out,
 *     exactly like the "Keep analytics off" button. Ignoring the banner
 *     never turns on analytics.
 *
 * GPC visitors remain opted out. Other visitors can choose to enable optional
 * analytics after seeing the notice; ignoring it never enables tracking.
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
  const bannerRef = useRef(null)

  // The Ask Ayna launcher (ProfileChatbot.jsx) sits fixed bottom-right and
  // would otherwise land underneath this bar while it's up — .ayna-ask-
  // launcher and .ayna-ask-panel in index.css read this custom property
  // (falling back to 0px once it's removed) to lift above the banner, then
  // drop back to their normal spot the moment it's dismissed.
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

  // Footer "Privacy choices" (openPrivacyChoices) reopens the banner, even
  // after a choice, so anyone can change their mind.
  useEffect(() => {
    const reopen = () => { setPh(window.posthog); setVisible(true) }
    window.addEventListener(PRIVACY_CHOICES_EVENT, reopen)
    return () => window.removeEventListener(PRIVACY_CHOICES_EVENT, reopen)
  }, [])

  if (!visible) return null

  const close = () => setVisible(false)
  const keepAnalyticsOff = () => { if (ph) denyConsent(ph); close() }

  // Global Privacy Control (or PostHog blocked/unavailable): nothing to choose,
  // so confirm the opt-out instead of offering Turn on.
  if (isGpcActive() || !ph) {
    return (
      <div ref={bannerRef} role="dialog" aria-live="polite" aria-label="Privacy choices" className="consent-banner">
        <button type="button" className="consent-banner__close" aria-label="Close" onClick={close}>
          <span aria-hidden="true">×</span>
        </button>
        <p>
          {isGpcActive()
            ? <><strong>Opt-out request honored.</strong> Your browser&apos;s Global Privacy Control is on, so analytics stay off, including the anonymous visit count.</>
            : <>Analytics aren&apos;t running in this browser, so nothing is being collected.</>}
          {' '}<a href="/privacy-policy#analytics" target="_blank" rel="noreferrer">What we collect</a>
        </p>
      </div>
    )
  }

  return (
    <div ref={bannerRef} role="dialog" aria-live="polite" aria-label="Analytics choice" className="consent-banner">
      <button
        type="button"
        className="consent-banner__close"
        aria-label="Close and keep analytics off"
        title="Keep off"
        onClick={keepAnalyticsOff}
      >
        <span aria-hidden="true">×</span>
      </button>
      <p>
        <strong className="consent-banner__title">Help us improve ayna for women like you</strong>
        Turn on analytics so we can see which pages and products help, across your visits. Never sold,
        never used for ads. Until you choose, we only count visits anonymously; Keep off stops that too.{' '}
        <a href="/privacy-policy#analytics" target="_blank" rel="noreferrer">What we collect</a>
      </p>
      {/* Both buttons share one class and style: equal size, colour and weight. */}
      <div className="consent-banner__actions">
        <button
          type="button"
          data-testid="consent-decline"
          onClick={keepAnalyticsOff}
        >
          Keep off
        </button>
        <button
          type="button"
          data-testid="consent-accept"
          onClick={() => { acknowledgeAnalytics(ph); close() }}
        >
          Turn on
        </button>
      </div>
    </div>
  )
}
