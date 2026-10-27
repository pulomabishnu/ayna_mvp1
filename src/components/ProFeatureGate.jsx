import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PREMIUM_READ_IDS } from '../pro/premiumReads.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { loadProFeatureRules, requestPro } from '../utils/proApi.js';
import SubscriptionPaywallModal from './SubscriptionPaywallModal.jsx';

const LOCKED_COPY = {
  reads: ['Unlimited Reads', 'Free ayna includes one Read each week. Pro members can open unlimited Reads.'],
  wearables: ['Connect health apps and wearables', 'Connecting supported health apps and wearables is included with ayna Pro.'],
  insights: ['Deeper personalized insights', 'Deeper personalized health insights are included with ayna Pro.'],
  history: ['Health trends and history', 'Detailed health trends and history are included with ayna Pro. Your basic health view stays free.'],
  recap: ['Personalized recaps', 'Personalized recaps are included with ayna Pro.'],
  trial: ['Advanced tracking', 'Personal try-and-check-back tracking is included with ayna Pro.'],
  appointment: ['Appointment prep', 'Appointment prep is included with ayna Pro.'],
  quiz: ['Unlimited quiz retakes', 'Free ayna includes one personalization quiz retake each week. Pro members can retake it anytime.'],
};

function CheckedProFeatureGate({ feature, readId = '', title, onBack, children }) {
  const owner = useRef(null);
  const [revision, setRevision] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const key = `${feature}:${readId}:${revision}`;
  const [defaultTitle, copy] = LOCKED_COPY[feature] || ['ayna Pro', 'This feature is included with ayna Pro.'];

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

  return <section className="pro-access" aria-label={title || defaultTitle}>
    {onBack && <button type="button" className="ay-btn ay-btn--secondary" onClick={onBack}>Back</button>}
    <p className="pro-access__eyebrow">ayna Pro</p>
    <h2>{title || defaultTitle}</h2>
    {result?.key !== key ? <p role="status">Checking access…</p> : <>
      <p>{copy}</p>
      {result.error && <p role="status">{result.error}</p>}
      <p>Your basic matching, safety information, Community, and privacy controls stay free.</p>
      {!Capacitor.isNativePlatform() ? (
        <button type="button" className="ay-btn ay-btn--primary" onClick={() => setShowPaywall(true)}>See Early Access</button>
      ) : (
        <p>Already a Pro member? Sign in with the ayna account that has your membership.</p>
      )}
      <button type="button" className="ay-btn ay-btn--secondary" onClick={() => setRefresh(n => n + 1)}>Check access again</button>
    </>}
    {showPaywall && <SubscriptionPaywallModal onClose={() => setShowPaywall(false)} featureName={title || defaultTitle} featureDescription="all available ayna Pro features" />}
  </section>;
}

export default function ProFeatureGate(props) {
  if (props.feature === 'reads' && !PREMIUM_READ_IDS.includes(props.readId)) return props.children;
  return <CheckedProFeatureGate {...props} />;
}
