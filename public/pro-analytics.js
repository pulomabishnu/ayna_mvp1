(() => {
  // Same public PostHog client token used by the main ayna app. It is a
  // publishable analytics key, not a secret. Keep this standalone page on the
  // same privacy rules as src/main.jsx: founder browsers and explicit opt-outs
  // never emit analytics, and mandatory GPC signals fail closed.
  const POSTHOG_PUBLIC_KEY = 'phc_rkLLzEsibbNfERMPqnqzVy9kz5KxUwBbefQZndK2DYpZ';
  const CONSENT_KEY = 'ayna_analytics_consent';
  const INTERNAL_BROWSER_KEY = 'ayna_internal_analytics_v1';
  const ANON_ID_KEY = 'ayna_pro_analytics_id_v1';
  const ALLOWED_EVENTS = new Set([
    'pro_paywall_viewed',
    'pro_plan_selected',
    'pro_checkout_requested',
    'pro_checkout_canceled',
  ]);

  function isFounderBrowser() {
    try { return window.localStorage.getItem(INTERNAL_BROWSER_KEY) === 'founder'; }
    catch { return false; }
  }

  function hasExplicitOptOut() {
    let raw = null;
    try { raw = window.localStorage.getItem(CONSENT_KEY); } catch { return false; }
    if (!raw) return false;
    if (raw === 'denied') return true;
    try { return JSON.parse(raw)?.decision === 'denied'; }
    catch { return false; }
  }

  async function analyticsAllowed() {
    if (isFounderBrowser() || hasExplicitOptOut()) return false;

    let gpc = false;
    try { gpc = navigator.globalPrivacyControl === true; } catch { /* unavailable */ }
    if (!gpc) return true;

    // Match the main app's region-scoped GPC behavior. Fail closed if the
    // region lookup cannot confirm that analytics may remain on.
    try {
      const response = await fetch('/api/gpc-region', { cache: 'no-store' });
      if (!response.ok) return false;
      const data = await response.json();
      return data?.mandatory === false;
    } catch {
      return false;
    }
  }

  function analyticsId() {
    try {
      const existing = window.localStorage.getItem(ANON_ID_KEY);
      if (existing?.startsWith('ayna_pro_')) return existing;
      const next = `ayna_pro_${crypto.randomUUID()}`;
      window.localStorage.setItem(ANON_ID_KEY, next);
      return next;
    } catch {
      try { return `ayna_pro_${crypto.randomUUID()}`; }
      catch { return `ayna_pro_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`; }
    }
  }

  const allowedPromise = analyticsAllowed();
  const distinctId = analyticsId();

  function capture(event, properties = {}) {
    if (!ALLOWED_EVENTS.has(event)) return;
    allowedPromise.then((allowed) => {
      if (!allowed) return;
      fetch('/ingest/capture/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          api_key: POSTHOG_PUBLIC_KEY,
          event,
          properties: {
            distinct_id: distinctId,
            source: 'pro_page',
            platform: 'web',
            $process_person_profile: false,
            ...properties,
          },
        }),
      }).catch(() => {});
    }).catch(() => {});
  }

  capture('pro_paywall_viewed');

  const params = new URLSearchParams(window.location.search);
  if (params.get('checkout') === 'canceled') capture('pro_checkout_canceled');

  const plans = [
    ['pro-month', 'month', 4.99],
    ['pro-year', 'year', 45],
  ];
  for (const [id, plan, amount] of plans) {
    document.getElementById(id)?.addEventListener('click', () => {
      const properties = { plan, amount, currency: 'USD' };
      capture('pro_plan_selected', properties);
      // This is the user's request to enter Stripe checkout. The authoritative
      // paid event still comes only from the signed Stripe webhook.
      capture('pro_checkout_requested', properties);
    }, { capture: true });
  }
})();
