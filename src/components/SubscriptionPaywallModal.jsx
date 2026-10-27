import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { useEscapeToClose } from '../utils/useEscapeToClose';
import { useFocusTrap } from '../utils/useFocusTrap';
import { requestPro } from '../utils/proApi.js';
import { announceProChanged, rememberProReturn, saveProResume } from '../pro/paywall.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { PRO_TAGLINE } from '../pro/features.js';
import { EARLY_ACCESS_LINE, PAID_TERM_STARTS, PLANS, proGroups } from '../pro/plans.js';
import '../styles/pro-v4.css';

const reducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; }
};

export default function SubscriptionPaywallModal({ onClose, feature = '', featureName = '', initialPlan = '', onRequireAuth }) {
  // Close with the exit animation, then unmount. Reduced motion closes at once.
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef(0);
  const close = useCallback(() => {
    if (closeTimer.current) return;
    if (reducedMotion()) { onClose?.(); return; }
    setClosing(true);
    closeTimer.current = window.setTimeout(() => onClose?.(), 200);
  }, [onClose]);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);
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
  const groups = proGroups(feature);
  const unlocking = featureName && featureName !== 'ayna Pro' ? featureName : '';
  // The iPhone app does not sell Pro (founder, Oct 27 16:43): same benefits and prices,
  // and the button opens /pro on the website (main.jsx opens external links in the in-app browser).
  const native = Capacitor.isNativePlatform();
  const webUrl = `https://www.aynahealth.co/pro${feature ? `?feature=${encodeURIComponent(feature)}` : ''}`;

  const checkout = async () => {
    if (busy) return;
    const target = chosen.id;
    setBusy(target);
    setError('');
    attempts.current[target] ||= crypto.randomUUID();
    try {
      const result = await requestPro({ plan: target, requestId: attempts.current[target] });
      const url = new URL(result.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Checkout is unavailable. Please try again.');
      rememberProReturn(feature);
      window.location.assign(url.href);
    } catch (e) {
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
        <span className="pro-march" aria-hidden="true" />
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
          <ol className="pro-groups" aria-label="Included with ayna Pro">
            {groups.map((g) => <li key={g.id} className="pro-groups__item">
              <b className="pro-groups__name">{g.name}</b>
              <span className="pro-groups__promise">{g.promise}</span>
              <ul className="pro-groups__chips">
                {g.features.map((f) => <li key={f.id} className={`pro-chip${f.on ? ' is-on' : ''}`}>{f.short}{f.growing && <span className="pro-chip__tag">{'\u00a0· growing'}</span>}</li>)}
              </ul>
            </li>)}
          </ol>

          <div className="pro-sheet__plans" role="radiogroup" aria-label="Choose a plan">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={plan === p.id}
                className={`pro-plan${plan === p.id ? ' is-on' : ''}`}
                disabled={Boolean(busy)}
                onClick={() => setPlan(p.id)}
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
            <p className="pro-sheet__webnote">ayna Pro is available on the web for now.</p>
            <a className="pro-sheet__cta" href={webUrl} target="_blank" rel="noopener noreferrer">Get ayna Pro on the web</a>
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
            <li><b>{PAID_TERM_STARTS}</b><span>Your paid {chosen.per} starts. The beta before it is included.</span></li>
            <li><b>After that</b><span>{chosen.renew}</span></li>
          </ol>

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
          <button type="button" className="pro-sheet__notnow" onClick={close}>Not now</button>
        </div>
      </section>
    </div>,
    host,
  );
}
