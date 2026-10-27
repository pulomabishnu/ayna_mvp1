import { useEffect, useRef, useState } from 'react';
import { PRO_PAYWALL_EVENT, RESUME_KEY, clearProResume, proFeatureName, peekProResume, registerProPaywallHost, resumeStep } from '../pro/paywall.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import SubscriptionPaywallModal from './SubscriptionPaywallModal.jsx';

/**
 * The one ayna Pro sheet for the whole app (mounted once in App.jsx and in
 * MobileApp.jsx). Any gate or limit opens it with openProPaywall(); while it
 * is open a second request is ignored, so sheets never stack.
 *
 * Signed out, the sheet's button asks her to sign in (onRequireAuth) after
 * saving where she was. Once a session arrives, this brings her back there and
 * re-opens the sheet for the same feature and plan (or sends her back to /pro).
 */
export default function ProPaywallHost({ priority = 1, onRequireAuth }) {
  const [request, setRequest] = useState(null);
  const hostRef = useRef(null);
  useEffect(() => {
    const host = registerProPaywallHost(priority);
    hostRef.current = host;
    const open = (event) => { if (host.isActive()) setRequest((current) => current || { ...(event.detail || {}) }); };
    window.addEventListener(PRO_PAYWALL_EVENT, open);
    return () => { host.unregister(); window.removeEventListener(PRO_PAYWALL_EVENT, open); };
  }, [priority]);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return undefined;
    let timer;
    const resume = (session) => {
      // Only the answering host (the app's inside /mobile-preview) resumes.
      if (!session?.user || !hostRef.current?.isActive()) return;
      const saved = peekProResume();
      const step = resumeStep(saved, window.location.pathname);
      if (step === 'navigate') {
        try { window.sessionStorage.setItem(RESUME_KEY, JSON.stringify({ ...saved, tries: Number(saved.tries || 0) + 1 })); } catch { /* storage blocked */ }
        window.location.assign(saved.path);
      } else if (step === 'open') {
        clearProResume();
        // After the sign-in screen has closed.
        timer = setTimeout(() => setRequest({ feature: saved.proFeature || '', featureName: saved.proFeature ? proFeatureName(saved.proFeature) : '', plan: saved.plan || '' }), 350);
      } else if (step === 'drop') {
        clearProResume();
      }
    };
    client.auth.getSession().then(({ data }) => resume(data?.session)).catch(() => {});
    const { data } = client.auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_IN') resume(session); });
    return () => { clearTimeout(timer); data?.subscription?.unsubscribe(); };
  }, []);

  if (!request) return null;
  return <SubscriptionPaywallModal
    feature={request.feature || ''}
    featureName={request.featureName || ''}
    initialPlan={request.plan || ''}
    onRequireAuth={onRequireAuth}
    onClose={() => setRequest(null)}
  />;
}
