import './trial.css';
import { useState } from 'react';
import { useTrialAvailable } from './useTrialAvailable.js';
import { requestPro } from '../utils/proApi.js';
import { PRO_CHANGED_EVENT } from './paywall.js';
import posthog from 'posthog-js';
import { freeTrialDays, perPeriod, startAppleFreeTrial, useAppleProducts, usesAppleIap } from './appleIap.js';
import { scheduleAppleTrialReminder } from './trialNotices.js';

const captureProEvent = (event, props = {}) => { try { posthog.capture(event, props); } catch { /* analytics never blocks */ } };

/**
 * Website: ayna's own no-card trial, one per account (api/pro.js `trialAvailable`); nothing renews.
 * iPhone app (Nov 27, founder: "a normal free trial, card on file, automatic, really easy to cancel"): Apple's
 * free trial on ayna Pro Yearly. Shows only while Apple says she can still get it. It renews automatically
 * unless she cancels in Settings › Subscriptions; we remind her 2 days before it ends.
 */
export default function TrialStart({ source = 'paywall', onStarted, className = '', label = '' }) {
  const apple = usesAppleIap();
  const web = useTrialAvailable(!apple);
  const { products } = useAppleProducts(apple);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const year = products.year;
  const days = apple ? freeTrialDays(year) : web.days;
  if (apple ? !days : !web.available) return null;
  const start = async () => {
    if (busy) return;
    setBusy(true); setMsg('');
    try {
      let started = false;
      if (apple) {
        const r = await startAppleFreeTrial('year');
        if (r !== 'success') { setBusy(false); return; } // cancelled, or waiting on Ask to Buy
        started = true;
        scheduleAppleTrialReminder(days, perPeriod(year));
      } else {
        const r = await requestPro({ action: 'start_trial' });
        if (r?.reason === 'cancelled' || r?.reason === 'pending') { setBusy(false); return; }
        started = Boolean(r?.started);
        if (!started) setMsg(r?.reason === 'already_pro' ? 'You already have ayna Pro.' : 'You have already used your free trial.');
      }
      if (started) {
        captureProEvent('pro_trial_started', { source, store: apple ? 'apple' : 'web' });
        try { window.dispatchEvent(new Event(PRO_CHANGED_EVENT)); } catch { /* old browser */ }
        setMsg(apple ? 'Your free trial has started. Cancel anytime in Profile › Settings › Manage subscription.' : `Your free ayna Pro trial has started. It ends on its own in ${days} days.`);
        onStarted?.();
      }
    } catch (e) {
      setMsg(e?.code === 'sign_in_required' ? 'Sign in first to start your free trial.' : e?.message || 'Couldn’t start your free trial. Try again.');
    }
    setBusy(false);
  };
  return (
    <div className={`ay-trial ${className}`.trim()}>
      {/* 3.1.2(c): in the app the billed amount is the button; the free trial is the smaller line under it. */}
      <button type="button" className="ay-trial__btn" onClick={start} disabled={busy}>{busy ? 'Starting…' : apple ? `Subscribe · ${perPeriod(year)}` : label || `Try ayna Pro free for ${days} days`}</button>
      <p className="ay-trial__fine">
        {apple ? `Starts with ${days} days free. Renews automatically; cancel before the trial ends and you pay nothing (Settings › Subscriptions).` : 'No card needed. Nothing renews.'}
      </p>
      {msg && <p className="ay-trial__msg" role="status">{msg}</p>}
    </div>
  );
}
