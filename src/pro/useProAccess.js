import { useEffect, useState } from 'react';
import { PRO_CHANGED_EVENT } from './paywall.js';
import { loadProFeatureRules, requestPro } from '../utils/proApi.js';

/**
 * Small access check for entry-point UI (profile rows, upgrade prompts).
 * It uses the same server-checked Pro status and rollout switch as the full
 * ProFeatureGate, but does not render a paywall itself.
 */
export function useProAccess(userId = null) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ checking: Boolean(userId), allowed: false });

  useEffect(() => {
    if (!userId) {
      setState({ checking: false, allowed: false });
      return undefined;
    }

    const controller = new AbortController();
    setState((prev) => ({ ...prev, checking: true }));
    (async () => {
      try {
        const rules = await loadProFeatureRules(controller.signal);
        if (typeof rules.enabled !== 'boolean') throw new Error('pro_rules_unavailable');
        let allowed = !rules.enabled;
        if (!allowed) {
          const status = await requestPro({ signal: controller.signal });
          allowed = Boolean(status?.active);
        }
        if (!controller.signal.aborted) setState({ checking: false, allowed });
      } catch {
        if (!controller.signal.aborted) setState({ checking: false, allowed: false });
      }
    })();
    return () => controller.abort();
  }, [userId, revision]);

  useEffect(() => {
    const recheck = () => setRevision((n) => n + 1);
    const visible = () => { if (document.visibilityState === 'visible') recheck(); };
    window.addEventListener(PRO_CHANGED_EVENT, recheck);
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', visible);
    return () => {
      window.removeEventListener(PRO_CHANGED_EVENT, recheck);
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', visible);
    };
  }, []);

  return state;
}
