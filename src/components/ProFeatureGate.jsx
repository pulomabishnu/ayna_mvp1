import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PRO_CHANGED_EVENT, proFeatureName, openProPaywall } from '../pro/paywall.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { loadProFeatureRules, requestPro } from '../utils/proApi.js';
import ProLock, { CheckerFrame, LockIcon } from './ProLock.jsx';
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
        // Every signed-in Read uses the same one-per-week Free allowance. The
        // server's atomic claim lets the same Read reopen during that week;
        // Pro remains unlimited. Other Pro features use the normal active check.
        let allowed = !rules.enabled;
        let expiresAt = null;
        let choose = false;
        let usedOn = null;
        if (!allowed) {
          const status = await requestPro({ signal: controller.signal });
          // The server accounts for overlapping paid, temporary and staff grants.
          expiresAt = status.accessExpiresAt || null;
          if (feature !== 'reads') allowed = status.active;
          else if (status.active) allowed = true;
          // Reads (founder, Oct 28: "letting you only choose one"): the free
          // Read is never spent silently. Her chosen Read opens; with none
          // chosen yet she picks this one on purpose; otherwise it is locked
          // and says which one she used.
          else if (status.weeklyRead && status.weeklyRead === readId) allowed = true;
          else if (!status.weeklyRead) choose = true;
          else usedOn = status.weeklyRead;
        }
        if (!controller.signal.aborted) {
          setResult({ key, allowed, choose, usedOn });
          const delay = expiresAt && allowed ? Math.min(60000, Math.max(0, expiresAt - Date.now())) : 60000;
          timer = setTimeout(() => { setResult(null); setRefresh(n => n + 1); }, delay);
        }
      } catch {
        if (!controller.signal.aborted) setResult({ key, allowed: false, error: 'We couldn’t confirm your Pro access. Please try again.' });
      }
    };
    check();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [feature, readId, key, refresh]);

  if (result?.key === key && result.allowed) return children;

  if (result?.key === key && result.choose) {
    const claim = async () => {
      setResult({ key, claiming: true, choose: true });
      try {
        const out = await requestPro({ action: 'read', readId });
        setResult({ key, allowed: Boolean(out?.allowed), usedOn: out?.allowed ? null : 'another' });
      } catch {
        setResult({ key, choose: true, error: 'We couldn’t open this Read. Please try again.' });
      }
    };
    return <section className="pro-gate" aria-label="Your free Read this week">
      {onBack && <button type="button" className="pro-gate__back" onClick={onBack}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Back
      </button>}
      <section className="pro-lock pro-lock--page pro-choose">
        <CheckerFrame square={12} radius={22}>
          <div className="pro-lock__card">
            <span className="pro-lock__seal" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13V4Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg></span>
            <div className="pro-lock__text">
              <p className="pro-lock__kicker">Your free Read this week</p>
              <h2 className="pro-lock__title">{contextTitle || 'Read this one?'}</h2>
              <p className="pro-lock__line">Free accounts choose one Read a week. You can reopen it until Sunday. ayna Pro opens every Read.</p>
              {result.error && <p className="pro-lock__error" role="status">{result.error}</p>}
            </div>
            <div className="pro-lock__actions">
              <button type="button" className="pro-lock__cta" onClick={claim} disabled={result.claiming}>{result.claiming ? 'Opening…' : 'Use my free Read'}</button>
              <button type="button" className="pro-lock__quiet" onClick={() => { if (!openProPaywall({ feature: 'reads', featureName: proFeatureName('reads') })) window.open('https://www.aynahealth.co/pro?feature=reads', '_blank', 'noopener'); }}><LockIcon size={16} /> Get every Read with Pro</button>
              {onBack && <button type="button" className="pro-lock__quiet" onClick={onBack}>Not now</button>}
            </div>
          </div>
        </CheckerFrame>
      </section>
    </section>;
  }

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
      line={feature === 'reads' && result?.usedOn ? 'You’ve used this week’s free Read. A new one opens Monday, or get every Read with ayna Pro.' : undefined}
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