import { useEffect, useMemo, useRef, useState } from 'react';
import { askPromptGroups } from '../../utils/askGroups.js';
import { askSafetyFlags } from '../../utils/askSafety.js';
import { getTodayAskContext, TODAY_ASK_EVENT } from '../../utils/askToday.js';

/**
 * What Ask's first screen needs, the same on the app sheet and the website
 * panel: her safety flags (Safety first when one applies), her top match %
 * from the one engine (for "Why is my top match 92%?"), a topic from her own
 * needs for the reads prompt, and the grouped prompts built from those.
 * The catalog and engine load lazily, after the sheet opens.
 */
export function useAskSetup({ open = true, profile = null, healthProfile = null, matchOpts, products = [], signedIn = false, focusProduct = null, hasHealthData = false } = {}) {
  const [safety, setSafety] = useState(null);
  const [top, setTop] = useState({ percent: null, topic: '' });
  const [signals, setSignals] = useState(() => getTodayAskContext()?.signals || {});
  useEffect(() => {
    const on = () => setSignals(getTodayAskContext()?.signals || {});
    window.addEventListener(TODAY_ASK_EVENT, on);
    return () => window.removeEventListener(TODAY_ASK_EVENT, on);
  }, []);
  // Callers rebuild these objects on every render: read them from a ref and
  // re-run only when the sheet opens, her answers change or her products do.
  const latest = useRef({});
  useEffect(() => { latest.current = { products, healthProfile, matchOpts, profile }; });
  // Her answers by value: callers may hand a new object with the same answers on every render.
  let profileKey = '';
  try { profileKey = profile ? JSON.stringify(profile) : ''; } catch { profileKey = String(Date.now()); }
  const productKey = (Array.isArray(products) ? products : Object.values(products || {})).map((p) => p?.id).join(',');
  useEffect(() => {
    if (!open) return undefined;
    let live = true;
    const cur = latest.current;
    const profile = cur.profile; // eslint-disable-line no-shadow
    askSafetyFlags(profile, { products: cur.products, healthProfile: cur.healthProfile, matchOpts: cur.matchOpts }).then((r) => { if (live) setSafety(r); });
    if (profile) {
      import('../../data/products.js').then(({ getTopMatch, getProductMatchDetailsForProduct, getSelectedNeeds }) => {
        if (!live) return;
        let percent = null; let topic = '';
        try {
          const p = getTopMatch(profile, cur.healthProfile, cur.matchOpts);
          const d = p ? getProductMatchDetailsForProduct(p, profile, cur.healthProfile, cur.matchOpts) : null;
          if (d?.matchStatus === 'scored' && Number(d.percent) > 0) percent = Math.round(d.percent);
          topic = (getSelectedNeeds(profile, cur.healthProfile) || []).map((n) => n.phrase).find((x) => x && x.length <= 32) || '';
        } catch { /* engine unavailable: plain prompts */ }
        setTop({ percent, topic });
      }).catch(() => {});
    } else setTop({ percent: null, topic: '' });
    return () => { live = false; };
  }, [open, profileKey, productKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const groups = useMemo(() => askPromptGroups({
    signedIn, hasProfile: Boolean(profile), signals, safety, focusProduct, topPercent: top.percent, topic: top.topic, hasHealthData,
  }), [signedIn, profileKey, signals, safety, focusProduct, top, hasHealthData]); // eslint-disable-line react-hooks/exhaustive-deps
  return { safety, groups };
}
