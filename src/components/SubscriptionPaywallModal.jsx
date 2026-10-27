import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeToClose } from '../utils/useEscapeToClose';
import { useFocusTrap } from '../utils/useFocusTrap';
import { requestPro } from '../utils/proApi.js';
import { PRO_FEATURES } from '../pro/features.js';
import '../styles/pro-v4.css';

const MONTHLY_PRICE = '$4.99';
const MONTHLY_REGULAR = '$8.99';
const ANNUAL_PRICE = '$45';
const ANNUAL_REGULAR = '$90';

// "Best value" on Yearly holds on every count: $45 today vs $4.99 + 11 x $8.99 = $103.88
// for a first year paid monthly, and $90/year regular vs 12 x $8.99 = $107.88.
const PLANS = [
  { id: 'month', label: 'Monthly', price: MONTHLY_PRICE, regular: MONTHLY_REGULAR, per: 'month',
    renew: `Renews at ${MONTHLY_REGULAR}/month after your first month. Cancel anytime.`,
    terms: `Your first paid month begins at launch, then renews at ${MONTHLY_REGULAR}/month unless canceled.` },
  { id: 'year', label: 'Yearly', price: ANNUAL_PRICE, regular: ANNUAL_REGULAR, per: 'year', best: true,
    renew: `Renews at ${ANNUAL_REGULAR}/year after your first year. Cancel anytime.`,
    terms: `Your first paid year begins at launch, then renews at ${ANNUAL_REGULAR}/year unless canceled.` },
];

// Gate feature ids that differ from the Pro features list ids.
const FEATURE_ALIAS = { trial: 'tracking' };
const DEFAULT_ROWS = ['ask', 'reads', 'playlists'];

/** 3-4 short benefit rows from the Pro features list: the feature she tapped first
 *  (when it is available today), then the everyday ones. Nothing still in development. */
function benefitRows(feature) {
  const available = PRO_FEATURES.filter((f) => f.stage === 'available');
  const first = available.find((f) => f.id === (FEATURE_ALIAS[feature] || feature));
  const rest = DEFAULT_ROWS.map((id) => available.find((f) => f.id === id)).filter((f) => f && f !== first);
  return [first, ...rest].filter(Boolean).slice(0, 4);
}

function Check() {
  return <svg className="pro-sheet__tick" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function SubscriptionPaywallModal({ onClose, feature = '', featureName = 'this feature', featureDescription = 'deeper personalized health tools and insights' }) {
  useEscapeToClose(true, onClose);
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
  const chosen = PLANS.find((p) => p.id === plan) || PLANS[1];
  const rows = benefitRows(feature);

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
      window.location.assign(url.href);
    } catch (e) {
      setError(e.message);
      setBusy('');
    }
  };

  if (!host) return <span ref={anchorRef} hidden />;

  return createPortal(
    <div className="pro-sheet" onClick={onClose}>
      <section
        ref={trapRef}
        tabIndex={-1}
        className="pro-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="pro-sheet__band">
          <span className="pro-sheet__grab" aria-hidden="true" />
          <button type="button" className="pro-sheet__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <h2 id={titleId} className="pro-sheet__title">Unlock ayna Pro</h2>
          <p className="pro-sheet__lede">Get {featureName} plus {featureDescription}.</p>
        </header>

        <div className="pro-sheet__body">
          <ul className="pro-sheet__rows" aria-label="Included with ayna Pro">
            {rows.map((f) => <li key={f.id}><Check />{f.label}</li>)}
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
                <span className="pro-plan__top">
                  <span className="pro-plan__label">{p.label}</span>
                  {p.best && <span className="pro-plan__best">Best value</span>}
                </span>
                <del className="pro-plan__was"><span className="pro-sr">Regular price </span>{p.regular}/{p.per}</del>
                <strong className="pro-plan__price">{p.price}</strong>
                <span className="pro-plan__today">today</span>
              </button>
            ))}
          </div>

          {error && <p className="pro-sheet__error" role="alert">{error}</p>}

          <button type="button" className="pro-sheet__cta" disabled={Boolean(busy)} aria-busy={busy ? 'true' : undefined} onClick={checkout}>
            {busy ? 'Opening checkout…' : `Continue · ${chosen.price}`}
          </button>
          <p className="pro-sheet__renew">{chosen.renew}</p>

          <button type="button" className="pro-sheet__more" aria-expanded={billingOpen} aria-controls={billingId} onClick={() => setBillingOpen((v) => !v)}>
            How billing works
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div id={billingId} className="pro-sheet__billing" hidden={!billingOpen}>
            <p>Pay the Early Access price today and use Pro immediately. Your purchased month or year starts January 1, 2027, so the beta period before launch is included.</p>
            <p>Early Access pricing is applied now. Save up to 50% on your first paid term.</p>
            <p><b>Monthly.</b> {PLANS[0].terms}</p>
            <p><b>Yearly.</b> {PLANS[1].terms}</p>
            <p>Cancel automatic renewal anytime. Access already paid for stays active through the end of that purchased period.</p>
          </div>
        </div>
      </section>
    </div>,
    host,
  );
}
