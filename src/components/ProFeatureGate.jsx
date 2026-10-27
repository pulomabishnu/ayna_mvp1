import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PREMIUM_READ_IDS } from '../pro/premiumReads.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { loadProFeatureRules, requestPro } from '../utils/proApi.js';
import SubscriptionPaywallModal from './SubscriptionPaywallModal.jsx';
import '../styles/pro-v4.css';

const LOCKED_COPY = {
  dashboard: ['Your health dashboard', 'Unlock your health dashboard and connect supported health apps and wearables with ayna Pro. Your ecosystem stays available.'],
  reads: ['Unlimited Reads', 'Free ayna includes one Read each week. Pro members can open unlimited Reads.'],
  wearables: ['Connect health apps and wearables', 'Connecting supported health apps and wearables is included with ayna Pro.'],
  insights: ['Deeper personalized insights', 'Deeper personalized health insights are included with ayna Pro.'],
  history: ['Health trends and history', 'Detailed health trends and history are included with ayna Pro. Your basic health view stays free.'],
  recap: ['Personalized recaps', 'Personalized recaps are included with ayna Pro.'],
  trial: ['Advanced tracking', 'Personal try-and-check-back tracking is included with ayna Pro.'],
  appointment: ['Appointment prep', 'Appointment prep is included with ayna Pro.'],
  quiz: ['Unlimited quiz retakes', 'Free ayna includes one personalization quiz retake each week. Pro members can retake it anytime.'],
};

function CheckedProFeatureGate({ feature, readId = '', title, onBack, onEcosystem, children }) {
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
    const recheck = () => { setResult(null); setRefresh(n => n + 1); };
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      listener?.data?.subscription.unsubscribe();
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    const check = async () => {
      try {
        const rules = await loadProFeatureRules(controller.signal);
        if (typeof rules.enabled !== 'boolean') throw new Error('We couldn’t check Pro access.');
        let allowed = !rules.enabled || (feature === 'reads' && !rules.premiumReadIds.includes(readId));
        let expiresAt = null;
        if (!allowed) {
          const status = feature === 'reads'
            ? await requestPro({ action: 'read', readId, signal: controller.signal })
            : await requestPro({ signal: controller.signal });
          allowed = feature === 'reads' ? status.allowed : status.active;
          // The server accounts for overlapping paid, temporary and staff grants.
          expiresAt = status.accessExpiresAt || null;
        }
        if (!controller.signal.aborted) {
          setResult({ key, allowed });
          const delay = expiresAt && allowed ? Math.min(60000, Math.max(0, expiresAt - Date.now())) : 60000;
          timer = setTimeout(() => { setResult(null); setRefresh(n => n + 1); }, delay);
        }
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key, allowed: false, error: error.message });
      }
    };
    check();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [feature, readId, key, refresh]);

  if (result?.key === key && result.allowed) return children;

  return <section className="pro-access" aria-label={gateTitle}>
    {onBack && <button type="button" className="pro-access__back" onClick={onBack}>← Back</button>}
    <div className="pro-access__card">
      <p className="pro-access__eyebrow">ayna Pro Early Access</p>
      <h2 className="pro-access__title">{gateTitle}</h2>
      {result?.key !== key ? <div className="pro-access__copy"><p role="status">Checking access…</p></div> : <>
        <div className="pro-access__copy">
          {contextTitle && <p className="pro-access__context">{contextTitle}</p>}
          <p>{copy}</p>
          {result.error && <p className="pro-access__error" role="status">{result.error}</p>}
          <p>Your basic matching, safety information, Community, and privacy controls stay free.</p>
        </div>
        <ul className="pro-access__included" aria-label="ayna Pro includes">
          <li>Unlimited Reads</li>
          <li>Up to 50 Ask ayna chats</li>
          <li>Unlimited playlists</li>
        </ul>
        {!Capacitor.isNativePlatform() ? (
          <div className="pro-access__actions">
            <button type="button" className="pro-access__primary" onClick={() => setShowPaywall(true)}>{feature === 'dashboard' ? 'Get ayna Pro' : 'Unlock ayna Pro · from $4.99'}</button>
            <button type="button" className="pro-access__secondary" onClick={() => setRefresh(n => n + 1)}>Check access again</button>
          </div>
        ) : (
          <>
            <p className="pro-access__fine">Already a Pro member? Sign in with the ayna account that has your membership.</p>
            <div className="pro-access__actions">
              <button type="button" className="pro-access__secondary" onClick={() => setRefresh(n => n + 1)}>Check access again</button>
            </div>
          </>
        )}
        {onEcosystem && <div className="pro-access__actions"><button type="button" className="pro-access__secondary" onClick={onEcosystem}>See my ecosystem</button></div>}
        {!Capacitor.isNativePlatform() && <p className="pro-access__fine">Early Access unlocks Pro now. Your paid month or year starts January 1, 2027.</p>}
      </>}
    </div>
    {showPaywall && <SubscriptionPaywallModal onClose={() => setShowPaywall(false)} featureName={gateTitle} featureDescription="all available ayna Pro features" />}
  </section>;
}

export default function ProFeatureGate(props) {
  if (props.feature === 'reads' && !PREMIUM_READ_IDS.includes(props.readId)) return props.children;
  return <CheckedProFeatureGate {...props} />;
}
