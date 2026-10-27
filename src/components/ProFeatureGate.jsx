import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PREMIUM_READ_IDS } from '../pro/premiumReads.js';
import { PRO_CHANGED_EVENT, proFeatureName } from '../pro/paywall.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { loadProFeatureRules, requestPro } from '../utils/proApi.js';
import ProLock from './ProLock.jsx';
import '../styles/pro-v4.css';

function CheckedProFeatureGate({ feature, readId = '', title, onBack, onEcosystem, children }) {
  const owner = useRef(null);
  const [revision, setRevision] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const key = `${feature}:${readId}:${revision}`;
  const gateTitle = feature === 'reads' ? proFeatureName('reads') : (title || proFeatureName(feature));
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

  // Check again when Pro may have changed: after checkout, "already Pro", or
  // when she comes back to this tab from another one.
  useEffect(() => {
    const again = () => setRefresh(n => n + 1);
    const visible = () => { if (document.visibilityState === 'visible') again(); };
    window.addEventListener(PRO_CHANGED_EVENT, again);
    document.addEventListener('visibilitychange', visible);
    return () => { window.removeEventListener(PRO_CHANGED_EVENT, again); document.removeEventListener('visibilitychange', visible); };
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

  // While the first check runs, a quiet line only: a Pro member never sees a lock flash.
  if (result?.key !== key) {
    return <section className="pro-gate pro-gate--checking" aria-busy="true">
      <p className="pro-gate__checking" role="status">Checking access…</p>
    </section>;
  }

  return <section className="pro-gate" aria-label={gateTitle}>
    {onBack && <button type="button" className="pro-gate__back" onClick={onBack}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Back
    </button>}
    <ProLock
      feature={feature}
      title={gateTitle}
      context={contextTitle}
      native={Capacitor.isNativePlatform()}
      onNotNow={onBack || onEcosystem}
      error={result.error || ''}
      onRetry={() => setRefresh(n => n + 1)}
    >
      {onEcosystem && <p className="pro-lock__alt"><button type="button" className="ct-link" onClick={onEcosystem}>See my ecosystem</button></p>}
    </ProLock>
  </section>;
}

export default function ProFeatureGate(props) {
  if (props.feature === 'reads' && !PREMIUM_READ_IDS.includes(props.readId)) return props.children;
  return <CheckedProFeatureGate {...props} />;
}
