import './trial.css';
import { useState } from 'react';
import { useTrialAvailable } from './useTrialAvailable.js';
import { requestPro } from '../utils/proApi.js';
import { PRO_CHANGED_EVENT } from './paywall.js';
import posthog from 'posthog-js';
import { perPeriod, startAppleTrial, useAppleProducts, usesAppleIap } from './appleIap.js';

const captureProEvent = (event, props = {}) => { try { posthog.capture(event, props); } catch { /* analytics never blocks */ } };

/**
 * Nov 16 (founder): "a 1-week free trial, no card required, that you opt into". One per account, ever.
 * Shows only when the server says her free week is still unused (api/pro.js `trialAvailable`).
 * Nothing renews and nothing is charged: after 14 days she is back on the free plan.
 */
export default function TrialStart({ source = 'paywall', onStarted, className = '', label = '' }) {
  const { available, days } = useTrialAvailable();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const apple = usesAppleIap();
  const { products } = useAppleProducts(apple && available);
  if (!available) return null;
  const start = async () => {
    if (busy) return;
    setBusy(true); setMsg('');
    try {
      // iPhone app: Apple's $0 "14-Day Trial" (guideline 3.1.1). Website: ayna's own no-card trial.
      const r = apple ? await startAppleTrial() : await requestPro({ action: 'start_trial' });
      if (r?.reason === 'cancelled' || r?.reason === 'pending') { setBusy(false); return; }
      if (r?.started) {
        try { captureProEvent('pro_trial_started', { source }); } catch { /* analytics never blocks */ }
        try { window.dispatchEvent(new Event(PRO_CHANGED_EVENT)); } catch { /* old browser */ }
        setMsg(`Your free ayna Pro trial has started. It ends on its own in ${days} days.`);
        onStarted?.(r);
      } else setMsg(r?.reason === 'already_pro' ? 'You already have ayna Pro.' : 'You have already used your free trial.');
    } catch (e) {
      setMsg(e?.code === 'sign_in_required' ? 'Sign in first to start your free trial.' : 'Couldn’t start your free trial. Try again.');
    }
    setBusy(false);
  };
  return (
    <div className={`ay-trial ${className}`.trim()}>
      <button type="button" className="ay-trial__btn" onClick={start} disabled={busy}>{busy ? 'Starting…' : label || `Try ayna Pro free for ${days} days`}</button>
      <p className="ay-trial__fine">
        No card needed. Nothing renews.
        {/* 3.1.1: before an in-app trial, say how long it lasts, what ends, and what it costs after. */}
        {apple && ` After ${days} days, Pro features lock again unless you subscribe${products.month ? ` (${perPeriod(products.month)})` : ''}.`}
      </p>
      {msg && <p className="ay-trial__msg" role="status">{msg}</p>}
    </div>
  );
}
