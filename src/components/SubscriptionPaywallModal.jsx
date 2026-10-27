import React, { useRef, useState } from 'react';
import { useEscapeToClose } from '../utils/useEscapeToClose';
import { requestPro } from '../utils/proApi.js';
import '../styles/pro-v4.css';

const MONTHLY_PRICE = '$4.99';
const MONTHLY_REGULAR = '$8.99';
const ANNUAL_PRICE = '$45';
const ANNUAL_REGULAR = '$90';

export default function SubscriptionPaywallModal({ onClose, featureName = 'this feature', featureDescription = 'deeper personalized health tools and insights' }) {
  useEscapeToClose(true, onClose);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const attempts = useRef({});

  const checkout = async (plan) => {
    if (busy) return;
    setBusy(plan);
    setError('');
    attempts.current[plan] ||= crypto.randomUUID();
    try {
      const result = await requestPro({ plan, requestId: attempts.current[plan] });
      const url = new URL(result.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Checkout is unavailable. Please try again.');
      window.location.assign(url.href);
    } catch (e) {
      setError(e.message);
      setBusy('');
    }
  };

  return (
    <div className="pro-paywall-v4" onClick={onClose}>
      <section
        className="pro-paywall-v4__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pro-paywall-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="pro-paywall-v4__close" onClick={onClose} aria-label="Close">×</button>

        <div className="pro-paywall-v4__head">
          <p className="pro-paywall-v4__eyebrow">ayna Pro Early Access</p>
          <h2 id="pro-paywall-title" className="pro-paywall-v4__title">Unlock Pro now</h2>
          <p>Get {featureName} plus {featureDescription}.</p>
          <p>Pay the Early Access price today and use Pro immediately. Your purchased month or year starts January 1, 2027, so the beta period before launch is included.</p>
        </div>

        <div className="pro-paywall-v4__offer">Early Access pricing is applied now. Save up to 50% on your first paid term.</div>

        <div className="pro-paywall-v4__plans">
          <article className="pro-paywall-v4__plan">
            <p className="pro-paywall-v4__plan-label">Monthly</p>
            <div className="pro-paywall-v4__price"><del>{MONTHLY_REGULAR}</del><strong>{MONTHLY_PRICE}</strong><span>today</span></div>
            <p>Your first paid month begins at launch, then renews at {MONTHLY_REGULAR}/month unless canceled.</p>
            <button type="button" className="pro-paywall-v4__buy" disabled={Boolean(busy)} onClick={() => checkout('month')}>
              {busy === 'month' ? 'Opening checkout…' : `Choose monthly · ${MONTHLY_PRICE}`}
            </button>
          </article>

          <article className="pro-paywall-v4__plan pro-paywall-v4__plan--best">
            <div className="pro-paywall-v4__badge">Best value · 50% off</div>
            <p className="pro-paywall-v4__plan-label">Yearly</p>
            <div className="pro-paywall-v4__price"><del>{ANNUAL_REGULAR}</del><strong>{ANNUAL_PRICE}</strong><span>today</span></div>
            <p>Your first paid year begins at launch, then renews at {ANNUAL_REGULAR}/year unless canceled.</p>
            <button type="button" className="pro-paywall-v4__buy" disabled={Boolean(busy)} onClick={() => checkout('year')}>
              {busy === 'year' ? 'Opening checkout…' : `Choose yearly · ${ANNUAL_PRICE}`}
            </button>
          </article>
        </div>

        {error && <p className="pro-paywall-v4__error" role="alert">{error}</p>}
        <p className="pro-paywall-v4__renewal">Cancel automatic renewal anytime. Access already paid for stays active through the end of that purchased period.</p>
      </section>
    </div>
  );
}
