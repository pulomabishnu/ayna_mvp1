import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import posthog from 'posthog-js';
import { getInternalIds, tagInternalUserIfNeeded } from './utils/posthogInternal';
import { hasInternalBrowserMarker, tagFounderAnalyticsIfNeeded } from './utils/founderAnalytics';
import { applyStoredConsent, getStoredConsent } from './utils/analyticsConsent';

if (window.location.hostname === 'aynamvp1.vercel.app') {
  window.location.replace(
    'https://www.aynahealth.co' + window.location.pathname + window.location.search + window.location.hash
  );
}

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || '/ingest';
const GPC_ENABLED = typeof navigator !== 'undefined' && navigator.globalPrivacyControl === true;
const STORED_ANALYTICS_PREF = getStoredConsent();
const ANALYTICS_ID_PREFIX = 'ayna_analytics_id_v1:';

// PostHog must not use the same identifier as Supabase. A random analytics ID
// per signed-in account/browser keeps product analytics useful without making
// the analytics warehouse directly joinable to reproductive-health rows by ID.
function opaqueAccountKey(value) {
  const s = String(value || '');
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 2246822519);
  }
  return `${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}`;
}

function randomAnalyticsId() {
  try {
    if (globalThis.crypto?.randomUUID) return `ayna_${globalThis.crypto.randomUUID()}`;
  } catch (_) {}
  return `ayna_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

function analyticsIdForAuthId(authId) {
  if (!authId || typeof window === 'undefined') return randomAnalyticsId();
  const key = `${ANALYTICS_ID_PREFIX}${opaqueAccountKey(authId)}`;
  try {
    const existing = window.localStorage.getItem(key);
    if (existing?.startsWith('ayna_')) return existing;
    const next = randomAnalyticsId();
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    // Private mode: keep analytics working for this session without falling
    // back to the Supabase UUID.
    return randomAnalyticsId();
  }
}

// App.jsx still calls posthog.identify(supabaseUserId, { email }) in two legacy
// auth paths. Intercept at the analytics boundary: discard those PII person
// properties and substitute a dedicated random analytics identifier. The email
// is inspected locally only to recognize the three founders; it is never passed
// through to PostHog.
const originalIdentify = typeof posthog.identify === 'function'
  ? posthog.identify.bind(posthog)
  : null;
if (originalIdentify) {
  posthog.identify = (authId, properties = {}) => {
    const analyticsId = analyticsIdForAuthId(authId);
    const result = originalIdentify(analyticsId);

    // Founder filtering is account-based, so a new phone/laptop/browser becomes
    // internal as soon as Ameera, Eliz, or Puloma signs in once. The helper also
    // persists a local browser marker for future signed-out visits.
    tagFounderAnalyticsIfNeeded(posthog, properties?.email);

    // Preserve the older explicit-ID filter for previously-known internal test
    // devices and accounts.
    try {
      const internalIds = getInternalIds();
      if (internalIds.has(String(authId)) || internalIds.has(analyticsId)) {
        posthog.register?.({ is_internal: true });
        posthog.people?.set?.({ is_internal: true });
      }
    } catch (_) {}
    return result;
  };
}

// Health-related free text and direct account identifiers should never become
// analytics payload. Exact keys only so useful non-sensitive counters such as
// queryLength/concernsCount and product/category analytics remain available.
const SENSITIVE_ANALYTICS_KEYS = new Set([
  'query', 'searchquery', 'search_query', 'email', 'useremail', 'prompt', 'message', 'notes',
  'healthprofile', 'health_profile', 'fullhealthintake', 'full_health_intake',
  'conditions', 'medications', 'allergies', 'symptoms', 'diagnosis', 'diagnoses',
  'concerns', 'intake', 'fhirsummary', 'fhir_summary', 'wearablesummary',
  'wearable_summary', 'freetext', 'free_text', 'supportothertext',
  'support_other_text', 'customconcerns', 'custom_concerns',
  'userid', 'user_id', 'authuserid', 'auth_user_id', 'phone', 'phonenumber',
  'phone_number', 'zipcode', 'zip', 'full_name', 'first_name', 'last_name',
]);

function sanitizeAnalyticsObject(value) {
  if (Array.isArray(value)) return value.map(sanitizeAnalyticsObject);
  if (!value || typeof value !== 'object') return value;

  const clean = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    const normalized = String(key).toLowerCase();
    if (SENSITIVE_ANALYTICS_KEYS.has(normalized)) continue;
    clean[key] = sanitizeAnalyticsObject(nestedValue);
  }
  return clean;
}

function sanitizePosthogEvent(event) {
  // Once this browser has been recognized as one of the three founders, do not
  // send further analytics at all. The PostHog person is also tagged internal
  // at sign-in so any earlier anonymous events from a brand-new browser can be
  // excluded by the internal-user filter after identity merge.
  if (hasInternalBrowserMarker()) return null;
  if (!event?.properties) return event;
  return { ...event, properties: sanitizeAnalyticsObject(event.properties) };
}

if (!POSTHOG_KEY) {
  console.warn('[Ayna/PostHog] VITE_PUBLIC_POSTHOG_KEY is not set; analytics are disabled.');
} else {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: 'https://us.posthog.com',
    person_profiles: 'always',
    autocapture: false,
    capture_pageview: true,
    mask_all_text: true,
    disable_session_recording: true,
    ip: false,
    // Usage analytics are on by default, but a prior opt-out or Global
    // Privacy Control must be honored before PostHog can emit the initial
    // pageview. Health free text and direct identifiers are still stripped by
    // before_send below, and session recording/autocapture remain disabled.
    opt_out_capturing_by_default: GPC_ENABLED || STORED_ANALYTICS_PREF === 'denied',
    before_send: sanitizePosthogEvent,
    // Automatic exception capture can include raw error messages/stacks. In a
    // health product those may accidentally contain user-entered context, so
    // we send only a coarse, explicitly-sanitized app_error event below.
    errorTracking: { autocaptureExceptions: false },
    loaded: (ph) => {
      window.posthog = ph;
      if (GPC_ENABLED) ph.opt_out_capturing?.();
      else applyStoredConsent(ph);
      tagFounderAnalyticsIfNeeded(ph);
      tagInternalUserIfNeeded(ph);
    },
  });
}

const CHUNK_RELOAD_KEY = 'ayna_chunk_reload_attempted';
function isChunkLoadError(error) {
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(
    String(error?.message || error || '')
  );
}

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, recovering: false };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidMount() {
    try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch { /* storage unavailable */ }
  }

  componentDidCatch(error) {
    console.error('App error:', error);
    try {
      posthog.capture('app_error', {
        errorName: String(error?.name || 'Error').slice(0, 64),
        isChunkLoadError: isChunkLoadError(error),
      });
    } catch { /* analytics unavailable */ }

    if (!isChunkLoadError(error)) return;

    let alreadyTried = false;
    try { alreadyTried = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1'; } catch { /* storage unavailable */ }

    if (!alreadyTried) {
      try { sessionStorage.setItem(CHUNK_RELOAD_KEY, '1'); } catch { /* storage unavailable */ }
      this.setState({ recovering: true });
      window.location.reload();
    } else {
      try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch { /* storage unavailable */ }
    }
  }

  render() {
    if (this.state.recovering) {
      return <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 600, margin: '2rem auto', color: '#666' }}>Updating…</div>;
    }

    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 600, margin: '2rem auto' }}>
          <h1>Something went wrong</h1>
          <p style={{ color: '#666' }}>Please reload the page and try again.</p>
          <button type="button" onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
