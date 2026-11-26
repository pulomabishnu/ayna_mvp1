import { useEffect, useState } from 'react';
import { requestPro } from '../utils/proApi.js';
import { PRO_CHANGED_EVENT } from './paywall.js';
import { loadAppleProducts, usesAppleIap } from './appleIap.js';

// One status check shared by every button on screen (Nov 17: many "Get ayna Pro" buttons now ask whether her
// free trial is still unused). Cached for a minute; cleared whenever Pro changes (trial started, purchase).
let cache = null; // { at, promise }
const TTL = 60 * 1000;
function trialStatus() {
  if (!cache || Date.now() - cache.at > TTL) {
    // iPhone app (Nov 25, App Review 3.1.1): the trial is Apple's $0 "14-Day Trial", so it's offered only
    // once Apple returns that product. Never a button that can't work.
    const store = usesAppleIap() ? loadAppleProducts().then((p) => Boolean(p.trial)).catch(() => false) : Promise.resolve(true);
    cache = { at: Date.now(), promise: Promise.all([requestPro(), store]).then(([s, inStore]) => ({ available: inStore && Boolean(s?.trialAvailable) && s?.gates !== false && !s?.active, days: s?.trialDays || 14 })).catch(() => ({ available: false, days: 14 })) };
  }
  return cache.promise;
}
/** Forget the cached answer (the account changed, e.g. she just signed up). */
export function resetTrialStatus() { cache = null; }
if (typeof window !== 'undefined') { try { window.addEventListener(PRO_CHANGED_EVENT, () => { cache = null; }); } catch { /* old browser */ } }

/** Is her free trial of ayna Pro still unused? (api/pro.js `trialAvailable`). Nov 16. */
export function useTrialAvailable(enabled = true) {
  const [state, setState] = useState({ checked: false, available: false, days: 14 });
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    const load = () => trialStatus().then((s) => { if (live) setState({ checked: true, ...s }); });
    load();
    const onChange = () => load();
    try { window.addEventListener(PRO_CHANGED_EVENT, onChange); } catch { /* old browser */ }
    return () => { live = false; try { window.removeEventListener(PRO_CHANGED_EVENT, onChange); } catch { /* old browser */ } };
  }, [enabled]);
  return state;
}

/** Nov 17 (founder): while her free trial is unused, Pro buttons offer it instead of "Get ayna Pro". */
export function useProCta(fallback = 'Get ayna Pro') {
  const { available, days } = useTrialAvailable();
  return available ? `Try Pro free for ${days} days` : fallback;
}
