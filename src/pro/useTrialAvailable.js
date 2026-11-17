import { useEffect, useState } from 'react';
import { requestPro } from '../utils/proApi.js';

/** Is her free week of ayna Pro still unused? (api/pro.js `trialAvailable`). Nov 16. */
export function useTrialAvailable(enabled = true) {
  const [state, setState] = useState({ checked: false, available: false, days: 14 });
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    requestPro().then((s) => { if (live) setState({ checked: true, available: Boolean(s?.trialAvailable) && s?.gates !== false && !s?.active, days: s?.trialDays || 14 }); })
      .catch(() => { if (live) setState({ checked: true, available: false, days: 14 }); });
    return () => { live = false; };
  }, [enabled]);
  return state;
}

