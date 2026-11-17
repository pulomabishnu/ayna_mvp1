import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { useProPurchaseMode } from '../pro/appStorefront.js';
import TrialStart from '../pro/TrialStart.jsx';
import posthog from 'posthog-js';
import { useEscapeToClose } from '../utils/useEscapeToClose';
import { useFocusTrap } from '../utils/useFocusTrap';
import { requestPro } from '../utils/proApi.js';
import { announceProChanged, rememberProReturn, saveProResume } from '../pro/paywall.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { PRO_TAGLINE } from '../pro/features.js';
import { EARLY_ACCESS_LINE, PAID_TERM_STARTS, PLANS } from '../pro/plans.js';
import ProStory, { PRO_ICONS, PRO_STORY } from './pro/ProStory.jsx';
import '../styles/pro-v4.css';

const ANALYTICS_SOURCE = 'subscription_paywall';
const reducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; }
};
const planAmount = (plan) => Number(String(plan?.price || '').replace(/[^0-9.]/g, '')) || undefined;

function captureProEvent(event, properties = {}) {
  try {
    posthog.capture(event, { source: ANALYTICS_SOURCE, ...properties });
  } catch {
    // Analytics must never interrupt auth or checkout.
  }
}

export default function SubscriptionPaywallModal({ onClose, feature = '', featureName = '', initialPlan = '', onRequireAuth }) {
  // Close with the exit animation, then unmount. Reduced motion closes at once.
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef(0);
  const closeTracked = useRef(false);
  const close = useCallback(() => {
    if (closeTimer.current) return;
    if (!closeTracked.current) {
      closeTracked.current = true;
      captureProEvent('pro_paywall_closed', { feature: feature || 'general' });
    }
    if (reducedMotion()) { onClose?.(); return; }
    setClosing(true);
    closeTimer.current = window.setTimeout(() => onClose?.(), 200);
  }, [feature, onClose]);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  useEffect(() => {
    captureProEvent('pro_paywall_viewed', { feature: feature || 'general' });
    captureProEvent('pro_gate_viewed', { gate_reason: feature || 'general' });
  }, [feature]);
  useEscapeToClose(true, close);
  // Portal to the themed app root (the app's .ayna-mobile or the website's .app-container), so the
  // sheet sits above the tab bar and screen stacking contexts but keeps light/dark.
  const anchorRef = useRef(null);
  const [host, setHost] = useState(null);
  useLayoutEffect(() => {
    setHost(anchorRef.current?.closest('.ayna-mobile, .app-container') || document.body);
  }, []);
  const trapRef = useFocusTrap(Boolean(host));
  const uid = useId();
  const titleId = `${uid}-title`;
  const billingId = `${uid}-billing`;
  const [plan, setPlan] = useState(PLANS.some((p) => p.id === initialPlan) ? initialPlan : 'year');
  // Signed out: the button becomes "Sign in to get ayna Pro" and brings her back here after.
  const [signedOut, setSignedOut] = useState(false);
  useEffect(() => {
    let live = true;
    const client = getSupabaseClient();
    if (!client) { setSignedOut(true); return undefined; }
    client.auth.getSession().then(({ data }) => { if (live) setSignedOut(!data?.session?.user); }).catch(() => {});
    return () => { live = false; };
  }, []);
  const signIn = () => {
    saveProResume({ proFeature: feature, plan });
    if (onRequireAuth) { onRequireAuth(); onClose?.(); return; }
    window.location.assign('/you');
  };
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [billingOpen, setBillingOpen] = useState(false);
  const attempts = useRef({});
  const chosen = PLANS.find((p) => p.id === plan) || PLANS[0];
  const unlocking = featureName && featureName !== 'ayna Pro' ? featureName : '';
  // The iPhone app does not sell Pro (founder, Oct 27 16:43): same benefits and prices,
  // and the button opens /pro on the website (main.jsx opens external links in the in-app browser).
  const native = Capacitor.isNativePlatform();
  // US App Store: prices and a link to checkout on the web; elsewhere in the app: neither (Apple 3.1.1).
  const purchaseMode = useProPurchaseMode(native);

  const choosePlan = (nextPlan) => {
    setPlan(nextPlan.id);
    captureProEvent('pro_plan_selected', {
      feature: feature || 'general',
      plan: nextPlan.id,
      amount: planAmount(nextPlan),
      currency: 'USD',
    });
  };

  const checkout = async () => {
    if (busy) return;
    const target = chosen.id;
    const amount = planAmount(chosen);
    setBusy(target);
    setError('');
    attempts.current[target] ||= crypto.randomUUID();
    try {
      const result = await requestPro({ plan: target, requestId: attempts.current[target] });
      const url = new URL(result.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Checkout is unavailable. Please try again.');
      captureProEvent('pro_checkout_started', { feature: feature || 'general', plan: target, amount, currency: 'USD' });
      rememberProReturn(feature);
      // Nov 16 (founder: "Get ayna Pro opens a page where you can't even see where to buy"): in the app, go straight
      // to Stripe checkout for her signed-in account (no second sign-in on the website). Closing the sheet after
      // paying re-checks Pro (main.jsx browserFinished), so it unlocks right away.
      if (native) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: url.href, presentationStyle: 'popover' });
        setBusy('');
        return;
      }
      window.location.assign(url.href);
    } catch (e) {
      captureProEvent('pro_checkout_failed', { feature: feature || 'general', plan: target, error_code: e?.code || 'unknown' });
      if (e?.code === 'sign_in_required') { setSignedOut(true); setBusy(''); return; }
      if (e?.code === 'already_pro') {
        // She already has it: unlock what is on screen instead of showing an error.
        announceProChanged();
        close();
        return;
      }
      setError(e.message);
      setBusy('');
    }
  };

  if (!host) return <span ref={anchorRef} hidden />;
  // Nov 17 (founder: "without scrolling, and don't forget the 14 day free trial"): in the app the sheet is one
  // screen. The free trial first, a short list of what Pro adds, the plans and the button. Billing details fold.
  const inApp = native || Boolean(host.classList?.contains('ayna-mobile'));

  // App Store rule 3.1.1: outside the US App Store the iPhone app never shows Pro prices or a link to
  // pay outside the App Store, so it says so plainly. US App Store users get the full sheet below.
  if (native && purchaseMode !== 'us_link') {
    return createPortal(
      <div className={`pro-sheet${closing ? ' is-closing' : ''}`} onClick={close}>
        <section ref={trapRef} tabIndex={-1} className="pro-sheet__panel" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
          <header className="pro-sheet__head">
            <span className="pro-sheet__grab" aria-hidden="true" />
            <button type="button" className="pro-sheet__close" onClick={close} aria-label="Close">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            <h2 id={titleId} className="pro-sheet__title">ayna <em>Pro</em></h2>
            <p className="pro-sheet__lede">{unlocking ? <>{unlocking} is part of ayna Pro, which you can't buy in the app in your country yet.</> : <>ayna Pro can't be bought in the app in your country yet.</>} Your matches, routine, log and Daily Rundown stay free.</p>
          </header>
          <div className="pro-sheet__body">{!signedOut && <TrialStart source={feature || 'paywall'} onStarted={() => window.setTimeout(close, 1400)} />}<button type="button" className="pro-sheet__cta" onClick={close}>Got it</button></div>
        </section>
      </div>,
      host,
    );
  }

  const plansGroup = (
    <div className="pro-sheet__plans" role="radiogroup" aria-label="Choose a plan">
      {PLANS.map((p) => (
        <button key={p.id} type="button" role="radio" aria-checked={plan === p.id} className={`pro-plan${plan === p.id ? ' is-on' : ''}`} disabled={Boolean(busy)} onClick={() => choosePlan(p)}>
          {p.badge && <span className="pro-plan__best">{p.badge}</span>}
          <span className="pro-plan__top"><span className="pro-plan__dot" aria-hidden="true" /><span className="pro-plan__label">{p.label}</span></span>
          <span className="pro-plan__amount">
            <strong className="pro-plan__price">{p.price}</strong>
            <del className="pro-plan__was"><span className="pro-sr">Regular price </span>{p.regular}</del>
          </span>
          <span className="pro-plan__sub">{p.sub}</span>
        </button>
      ))}
    </div>
  );

  if (inApp) {
    return createPortal(
      <div className={`pro-sheet is-app${closing ? ' is-closing' : ''}`} onClick={close}>
        <section ref={trapRef} tabIndex={-1} className="pro-sheet__panel" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
          <header className="pro-sheet__head">
            <span className="pro-sheet__grab" aria-hidden="true" />
            <button type="button" className="pro-sheet__close" onClick={close} aria-label="Close">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            <h2 id={titleId} className="pro-sheet__title">Get ayna <em>Pro</em></h2>
            {unlocking && <p className="pro-sheet__lede">Unlock <b>{unlocking}</b>.</p>}
          </header>
          <div className="pro-sheet__body">
            <ul className="pro-app__feats" aria-label="What ayna Pro adds">
              {PRO_STORY.map((f) => (
                <li key={f.id}><span className="pro-app__icon" aria-hidden="true"><svg viewBox="0 0 24 24">{PRO_ICONS[f.icon]}</svg></span>{f.t}</li>
              ))}
            </ul>
            {signedOut
              ? <div className="ay-trial"><button type="button" className="ay-trial__btn" onClick={signIn}>Try ayna Pro free for 14 days</button><p className="ay-trial__fine">Sign in to start. No card needed. Nothing renews.</p></div>
              : <TrialStart source={feature || 'paywall'} onStarted={() => window.setTimeout(close, 1400)} />}
            {plansGroup}
            {error && <p className="pro-sheet__error" role="alert">{error}</p>}
            {signedOut
              ? <button type="button" className="pro-sheet__cta" onClick={signIn}>Sign in to get ayna Pro</button>
              : <button type="button" className="pro-sheet__cta" disabled={Boolean(busy)} aria-busy={busy ? 'true' : undefined} onClick={checkout}>{busy ? 'Opening secure checkout…' : `Get ayna Pro · ${chosen.price}`}</button>}
            <div className="pro-app__row">
              <button type="button" className="pro-app__link" aria-expanded={billingOpen} aria-controls={billingId} onClick={() => setBillingOpen((v) => !v)}>How billing works</button>
              <button type="button" className="pro-app__link" onClick={close}>Not now</button>
            </div>
            <div id={billingId} className="pro-sheet__billing" hidden={!billingOpen}>
              <p>Pay securely with Stripe. Pro unlocks here as soon as you're done. Cancel anytime.</p>
              <p>{EARLY_ACCESS_LINE}</p>
              <p><b>Monthly.</b> {PLANS[1].terms}</p>
              <p><b>Yearly.</b> {PLANS[0].terms}</p>
              <p>Access already paid for stays active through the end of that purchased period.</p>
            </div>
          </div>
        </section>
      </div>,
      host,
    );
  }

  return createPortal(
    <div className={`pro-sheet${closing ? ' is-closing' : ''}`} onClick={close}>
      <section
        ref={trapRef}
        tabIndex={-1}
        className="pro-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="pro-sheet__head">
          <span className="pro-sheet__grab" aria-hidden="true" />
          <button type="button" className="pro-sheet__close" onClick={close} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <span className="pro-sheet__sticker">Early Access · up to 50% off</span>
          <h2 id={titleId} className="pro-sheet__title">Get ayna <em>Pro</em></h2>
          <p className="pro-sheet__lede">{unlocking && <>Unlock <b>{unlocking}</b>. </>}{PRO_TAGLINE}</p>
        </header>

        <div className="pro-sheet__body">
          <div className="pro-sheet__col is-info">
          <ProStory feature={feature} />
          <button type="button" className="pro-sheet__more" aria-expanded={billingOpen} aria-controls={billingId} onClick={() => setBillingOpen((v) => !v)}>
            How billing works
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div id={billingId} className="pro-sheet__billing" hidden={!billingOpen}>
            <p>{EARLY_ACCESS_LINE}</p>
            <p>Early Access pricing is applied now. Save up to 50% on your first paid term.</p>
            <p><b>Monthly.</b> {PLANS[1].terms}</p>
            <p><b>Yearly.</b> {PLANS[0].terms}</p>
            <p>Cancel automatic renewal anytime. Access already paid for stays active through the end of that purchased period.</p>
          </div>
          </div>

          <div className="pro-sheet__col is-buy">
          {/* Nov 16 (founder): the free week first, then the paid plans. */}
          {!signedOut && <TrialStart source={feature || 'paywall'} onStarted={() => window.setTimeout(close, 1400)} />}
          <div className="pro-sheet__plans" role="radiogroup" aria-label="Choose a plan">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={plan === p.id}
                className={`pro-plan${plan === p.id ? ' is-on' : ''}`}
                disabled={Boolean(busy)}
                onClick={() => choosePlan(p)}
              >
                {p.badge && <span className="pro-plan__best">{p.badge}</span>}
                <span className="pro-plan__top"><span className="pro-plan__dot" aria-hidden="true" /><span className="pro-plan__label">{p.label}</span></span>
                <span className="pro-plan__amount">
                  <strong className="pro-plan__price">{p.price}</strong>
                  <del className="pro-plan__was"><span className="pro-sr">Regular price </span>{p.regular}</del>
                </span>
                <span className="pro-plan__sub">{p.sub}</span>
              </button>
            ))}
          </div>

          {error && <p className="pro-sheet__error" role="alert">{error}</p>}

          {native ? <>
            {signedOut
              ? <button type="button" className="pro-sheet__cta" onClick={signIn}>Sign in to get ayna Pro</button>
              : <button type="button" className="pro-sheet__cta" disabled={Boolean(busy)} aria-busy={busy ? 'true' : undefined} onClick={checkout}>{busy ? 'Opening secure checkout…' : `Get ayna Pro · ${chosen.price}`}</button>}
            <p className="pro-sheet__webnote">Pay securely with Stripe. Pro unlocks here as soon as you're done.</p>
          </> : <>
          {signedOut
            ? <button type="button" className="pro-sheet__cta" onClick={signIn}>Sign in to get ayna Pro</button>
            : <button type="button" className="pro-sheet__cta" disabled={Boolean(busy)} aria-busy={busy ? 'true' : undefined} onClick={checkout}>
              {busy ? 'Opening secure checkout…' : `Get ayna Pro · ${chosen.price}`}
            </button>}
          <p className="pro-sheet__trust">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6ZM9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Secure checkout with Stripe. Cancel anytime.
          </p>
          </>}

          <ol className="pro-sheet__when" aria-label="How Early Access works">
            <li><b>Today</b><span>Pay {chosen.price}. Pro unlocks right away.</span></li>
            <li><b>{PAID_TERM_STARTS}</b><span>Your purchased {chosen.per} begins. Early Access through January is included.</span></li>
            <li><b>After that</b><span>{chosen.renew}</span></li>
          </ol>

          </div>
          <button type="button" className="pro-sheet__notnow" onClick={close}>Not now</button>
        </div>
      </section>
    </div>,
    host,
  );
}
