import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PREMIUM_READ_IDS } from '../pro/premiumReads.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { loadProFeatureRules, requestPro } from '../utils/proApi.js';
import SubscriptionPaywallModal from './SubscriptionPaywallModal.jsx';
import '../styles/pro-v4.css';

const LOCKED_COPY = {
  reads: ['Unlimited Reads', 'Free ayna includes one Read each week. Pro members can open unlimited Reads.'],
  wearables: ['Connect health apps and wearables', 'Connecting supported health apps and wearables is included with ayna Pro.'],
  insights: ['Deeper personalized insights', 'Deeper personalized health insights are included with ayna Pro.'],
  history: ['Health trends and history', 'Detailed health trends and history are included with ayna Pro. Your basic health view stays free.'],
  recap: ['Personalized recaps', 'Personalized recaps are included with ayna Pro.'],
  trial: ['Advanced tracking', 'Personal try-and-check-back tracking is included with ayna Pro.'],
  appointment: ['Appointment prep', 'Appointment prep is included with ayna Pro.'],
  quiz: ['Update your ecosystem anytime', 'Free ayna includes one ecosystem update each month. Pro members can update it anytime.'],
};

function CheckedProFeatureGate({ feature, readId = '', title, onBack, children }) {
  const owner = useRef(null);
  const [revision, setRevision] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const key = `${feature}:${readId}:${revision}`;
  const [defaultTitle, copy] = LOCKED_COPY[feature] || ['ayna Pro', 'This feature is included with ayna Pro.'];
  const gateTitle = feature === 'reads' ? defaultTitle : (title || defaultTitle);
  const contextTitle = feature === 'reads' && title ? title : '';

  useEffect(() => {
    const listener = getSupabaseClient()?.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id || null;
      if (owner.current !== id) {
        owner.current = id;
        setRevision(n => n + 1);
      }
    });
    return () => listener?.data?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    const check = async () => {
      try {
        const rules = await loadProFeatureRules(controller.signal);
        if (typeof rules.enabled !== 'boolean') throw new Error('We couldn’t check Pro access.');
        let allowed = !rules.enabled || (feature === 'reads' && !rules.premiumReadIds.includes(readId));
        if (!allowed) {
          const status = feature === 'reads'
            ? await requestPro({ action: 'read', readId, signal: controller.signal })
            : await requestPro({ signal: controller.signal });
          allowed = feature === 'reads' ? status.allowed : status.active;
        }
        if (!controller.signal.aborted) {
          setResult({ key, allowed });
          timer = setTimeout(() => setRefresh(n => n + 1), 60000);
        }
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key, allowed: false, error: error.message });
      }
    };
    check();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [feature, readId, key, refresh]);

  if (result?.key === key && result.allowed) return children;

  const native = Capacitor.isNativePlatform();
  const checking = result?.key !== key;

  return <section className="pro-access" aria-label={gateTitle}>
    {onBack && <button type="button" className="pro-access__back" onClick={onBack}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Back
    </button>}
    <div className="pro-access__card">
      <div className="pro-access__head">
        <span className="pro-access__lock" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </span>
        <span className="pro-access__tag">ayna Pro</span>
      </div>
      <h2 className="pro-access__title">{gateTitle}</h2>
      {contextTitle && <p className="pro-access__context">{contextTitle}</p>}
      {checking ? <p className="pro-access__copy" role="status">Checking access…</p> : <>
        <p className="pro-access__copy">{copy}</p>
        {result.error && <p className="pro-access__error" role="status">{result.error}</p>}
        <div className="pro-access__actions">
          {!native && <button type="button" className="pro-access__primary" onClick={() => setShowPaywall(true)}>Unlock with Pro</button>}
          <button type="button" className="pro-access__secondary" onClick={() => setRefresh(n => n + 1)}>Check access again</button>
        </div>
        {native && <p className="pro-access__fine">Already a Pro member? Sign in with the ayna account that has your membership.</p>}
        <p className="pro-access__fine">Your basic matching, safety information, Community, and privacy controls stay free.</p>
        {!native && <p className="pro-access__fine">Early Access unlocks Pro now. Your paid month or year starts January 1, 2027.</p>}
      </>}
    </div>
    {showPaywall && <SubscriptionPaywallModal onClose={() => setShowPaywall(false)} feature={feature} featureName={gateTitle} featureDescription="all available ayna Pro features" />}
  </section>;
}

export default function ProFeatureGate(props) {
  if (props.feature === 'reads' && !PREMIUM_READ_IDS.includes(props.readId)) return props.children;
  return <CheckedProFeatureGate {...props} />;
}
