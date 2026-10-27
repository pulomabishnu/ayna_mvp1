import { useEffect, useState } from 'react';
import { PRO_PAYWALL_EVENT, registerProPaywallHost } from '../pro/paywall.js';
import SubscriptionPaywallModal from './SubscriptionPaywallModal.jsx';

/**
 * The one ayna Pro sheet for the whole app (mounted once in App.jsx and in
 * MobileApp.jsx). Any gate or limit opens it with openProPaywall(); while it
 * is open a second request is ignored, so sheets never stack.
 */
export default function ProPaywallHost({ priority = 1 }) {
  const [request, setRequest] = useState(null);
  useEffect(() => {
    const host = registerProPaywallHost(priority);
    const open = (event) => { if (host.isActive()) setRequest((current) => current || { ...(event.detail || {}) }); };
    window.addEventListener(PRO_PAYWALL_EVENT, open);
    return () => { host.unregister(); window.removeEventListener(PRO_PAYWALL_EVENT, open); };
  }, [priority]);
  if (!request) return null;
  return <SubscriptionPaywallModal
    feature={request.feature || ''}
    featureName={request.featureName || ''}
    onClose={() => setRequest(null)}
  />;
}
