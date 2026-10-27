import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeToClose } from '../utils/useEscapeToClose';
import { useFocusTrap } from '../utils/useFocusTrap';
import { requestPro } from '../utils/proApi.js';
import { announceProChanged, rememberProReturn } from '../pro/paywall.js';
import { PAID_TERM_STARTS, PLANS, PRO_VALUE as VALUE, benefitRows } from '../pro/plans.js';
import '../styles/pro-v4.css';

const ICON_PATHS = {
  ask: <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
  reads: <path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5v13c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5ZM12 6v13.5" />,
  playlists: <path d="M4 7h11M4 12h11M4 17h7M18 14v6M15 17h6" />,
  quiz: <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4.5h-4.5" />,
  wearables: <><rect x="7" y="7" width="10" height="10" rx="3" /><path d="M9 7l1-4h4l1 4M9 17l1 4h4l1-4M12 10v2l1.5 1" /></>,
  history: <path d="M4 19h16M6 16l4-5 3 3 5-7" />,
  recap: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 9h16M9 3v4M15 3v4M8 13h3M8 16h6" /></>,
  tracking: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  appointment: <path d="M9 4h6v3H9zM7 5.5H6a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5a2 2 0 0 0-2-2h-1M8 12h8M8 16h5" />,
  early: <path d="M12 3l2.5 5.5L20 9.5l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1Z" />,
};

export function FeatureIcon({ id }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICON_PATHS[id] || ICON_PATHS.early}</svg>;
}

const reducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; }
};

export default function SubscriptionPaywallModal({ onClose, feature = '', featureName = '' }) {
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
  const [plan, setPlan] = useState('year');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [billingOpen, setBillingOpen] = useState(false);
  const attempts = useRef({});
  const chosen = PLANS.find((p) => p.id === plan) || PLANS[0];
  const rows = benefitRows(feature);
  const unlocking = featureName && featureName !== 'ayna Pro' ? featureName : '';

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
          <p className="pro-sheet__lede">{unlocking ? <>Unlock <b>{unlocking}</b>, plus everything else in Pro.</> : 'More Ask ayna, every Read, and an ecosystem you can update anytime.'}</p>
        </header>

        <div className="pro-sheet__body">
          <ul className="pro-sheet__rows" aria-label="Included with ayna Pro">
            {rows.map((f) => <li key={f.id}>
              <span className="pro-sheet__icon"><FeatureIcon id={f.id} /></span>
              <span className="pro-sheet__rowtext"><b>{f.label}</b><span>{VALUE[f.id] || f.description}</span></span>
            </li>)}
          </ul>

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

          <button type="button" className="pro-sheet__cta" disabled={Boolean(busy)} aria-busy={busy ? 'true' : undefined} onClick={checkout}>
            {busy ? 'Opening secure checkout…' : `Get ayna Pro · ${chosen.price}`}
          </button>
          <p className="pro-sheet__trust">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6ZM9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Secure checkout with Stripe. Cancel anytime.
          </p>

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
            <p>Pay the Early Access price today and use Pro immediately. Your purchased month or year starts January 1, 2027, so the beta period before launch is included.</p>
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
