import { useEffect, useState } from 'react';
import { PRO_CHANGED_EVENT } from './paywall.js';
import { requestPro } from '../utils/proApi.js';

const SIGNED_OUT = { checking: false, active: false, offerOpen: null };

/**
 * Is she an ayna Pro member, and is the Early Access offer open? For marketing
 * surfaces (the landing) that must stop selling Pro to members and must not
 * show a price nobody can buy. Reads the same server status as /pro
 * (GET /api/pro: the purchase ledger, focus-group grants and staff grants).
 *
 * Unlike useProAccess, `active` is never true just because the rollout switch
 * is off: that would hide the offer from everyone during the beta.
 * Signed out or on any error: { active: false, offerOpen: null }.
 */
export function useProStatus(userId = null) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({ key: '', active: false, offerOpen: null });

  useEffect(() => {
    if (!userId) return undefined;
    const controller = new AbortController();
    const key = `${userId}:${revision}`;
    requestPro({ signal: controller.signal })
      .then((s) => { if (!controller.signal.aborted) setResult({ key, active: Boolean(s?.active), offerOpen: typeof s?.offerOpen === 'boolean' ? s.offerOpen : null }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ key, active: false, offerOpen: null }); });
    return () => controller.abort();
  }, [userId, revision]);

  useEffect(() => {
    const recheck = () => setRevision((n) => n + 1);
    window.addEventListener(PRO_CHANGED_EVENT, recheck);
    return () => window.removeEventListener(PRO_CHANGED_EVENT, recheck);
  }, []);

  if (!userId) return SIGNED_OUT;
  // Keep the last answer while a re-check runs, so the page doesn't flicker.
  const fresh = result.key === `${userId}:${revision}`;
  const known = result.key.startsWith(`${userId}:`);
  return { checking: !fresh, active: known ? result.active : false, offerOpen: known ? result.offerOpen : null };
}
