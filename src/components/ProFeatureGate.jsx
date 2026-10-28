import { useEffect, useRef, useState } from 'react';
import posthog from 'posthog-js';
import { Capacitor } from '@capacitor/core';
import { PRO_CHANGED_EVENT, proFeatureName } from '../pro/paywall.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { loadProFeatureRules, requestPro } from '../utils/proApi.js';
import { analyticsId, ensureAnalyticsContext, eventSurface } from '../utils/analyticsEvents.js';
import ProLock from './ProLock.jsx';
import '../styles/pro-v4.css';

function CheckedProFeatureGate({ feature, readId = '', title, onBack, onEcosystem, children }) {
  const owner = useRef(null);
  const tracked = useRef(new Set());
  const [revision, setRevision] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const key = `${feature}:${readId}:${revision}`;
  const gateTitle = feature === 'reads' ? proFeatureName('reads') : (title || proFeatureName(feature));
  const contextTitle = feature === 'reads' && title ? title : '';

  const captureOnce = (token, event, props = {}) => {
    if (tracked.current.has(token)) return;
    tracked.current.add(token);
    try {
      ensureAnalyticsContext();
      posthog.capture(event, { surface: eventSurface(), feature: analyticsId(feature), ...props });
    } catch { /* analytics never blocks access */ }
  };

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
        let allowed = !rules.enabled;
        let expiresAt = null;
        if (!allowed) {
          const status = feature === 'reads'
            ? await requestPro({ action: 'read', readId, signal: controller.signal })
            : await requestPro({ signal: controller.signal });
          allowed = feature === 'reads' ? status.allowed : status.active;
          expiresAt = status.accessExpiresAt || null;
        }
        if (!controller.signal.aborted) {
          setResult({ key, allowed });
          const id = feature === 'reads' && readId ? analyticsId(readId) : '';
          captureOnce(`access:${key}:${allowed}`, 'pro_feature_access_checked', { allowed, ...(id ? { content_id: id } : {}) });
          if (feature === 'reads') {
            captureOnce(`read:${readId}:${allowed}`, allowed ? 'read_opened' : 'read_limit_reached', { ...(id ? { content_id: id } : {}) });
          }
          if (!allowed) captureOnce(`gate:${key}`, 'pro_gate_shown');
          const delay = expiresAt && allowed ? Math.min(60000, Math.max(0, expiresAt - Date.now())) : 60000;
          timer = setTimeout(() => { setResult(null); setRefresh(n => n + 1); }, delay);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResult({ key, allowed: false, error: 'We couldn’t confirm your Pro access. Please try again.' });
          captureOnce(`access-error:${key}`, 'pro_feature_access_failed');
        }
      }
    };
    check();
    return () => { controller.abort(); clearTimeout(timer); };
    // captureOnce is intentionally stable through refs; re-run only when access inputs change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature, readId, key, refresh]);

  if (result?.key === key && result.allowed) return children;

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
  return <CheckedProFeatureGate {...props} />;
}
