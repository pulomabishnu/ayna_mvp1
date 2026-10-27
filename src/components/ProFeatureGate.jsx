import { PREMIUM_READ_IDS } from '../pro/premiumReads.js';
import { useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { loadProFeatureRules, requestPro } from '../utils/proApi.js';

const LOCKED_COPY = {
  reads: 'Free ayna includes one premium Read each week. Pro members can open unlimited premium Reads.',
  wearables: 'Connecting supported health apps and wearables is included with ayna Pro.',
  insights: 'Deeper personalized health insights are included with ayna Pro.',
  history: 'Detailed health trends and history are included with ayna Pro. Your basic health view stays free.',
  recap: 'Personalized recaps are included with ayna Pro.',
  trial: 'Personal try-and-check-back tracking is included with ayna Pro.',
  appointment: 'Appointment prep is included with ayna Pro.',
  quiz: 'Free ayna includes one personalization quiz retake each week. Pro members can retake it anytime.',
};

/** UI boundary for existing tools; billing and usage are authoritative on the server. */
function CheckedProFeatureGate({ feature, readId = '', title, onBack, children }) {
  const [revision, setRevision] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const owner = useRef(null);
  const [result, setResult] = useState(null);
  const key = `${feature}:${readId}:${revision}`;
  useEffect(() => {
    const listener = getSupabaseClient()?.auth.onAuthStateChange((_event, session) => { const id = session?.user?.id || null; if (owner.current !== id) { owner.current = id; setRevision(n => n + 1); } });
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
          // Timed focus grants also relock an already-open local tool.
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
  return <section className="pro-access" aria-label={title || 'ayna Pro feature'}>
    {onBack && <button type="button" className="ay-btn ay-btn--secondary" onClick={onBack}>Back</button>}
    <p className="pro-access__eyebrow">ayna Pro</p><h2>{title}</h2>
    {result?.key !== key ? <p role="status">Checking access…</p> : <>
      <p>{LOCKED_COPY[feature] || 'This feature is included with ayna Pro.'}</p>
      {result.error && <p role="status">{result.error}</p>}
      <p>Your basic health view, matching, safety information and privacy controls remain available.</p>
      {!Capacitor.isNativePlatform() ? <a className="ay-btn ay-btn--primary" href="/you/pro">See ayna Pro Early Access</a> : <p>Already a Pro member? Use the ayna account with your membership.</p>}
      <button type="button" className="ay-btn ay-btn--secondary" onClick={() => setRefresh(n => n + 1)}>Check access again</button>
    </>}
  </section>;
}

export default function ProFeatureGate(props) {
  // Preserve public Read rendering, discovery and prerendered article text.
  if (props.feature === 'reads' && !PREMIUM_READ_IDS.includes(props.readId)) return props.children;
  return <CheckedProFeatureGate {...props} />;
}
