import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import posthog from 'posthog-js';
import { tagInternalUserIfNeeded } from './utils/posthogInternal';

if (window.location.hostname === 'aynamvp1.vercel.app') {
  window.location.replace(
    'https://www.aynahealth.co' + window.location.pathname + window.location.search + window.location.hash
  );
}

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || '/ingest';
const GPC_ENABLED = typeof navigator !== 'undefined' && navigator.globalPrivacyControl === true;

// Health-related free text should never become analytics payload. This is a
// final network-boundary guard in addition to keeping analytics events coarse
// at their call sites. Exact keys only so useful non-sensitive counters such as
// queryLength/concernsCount remain available for product analytics.
const SENSITIVE_ANALYTICS_KEYS = new Set([
  'query', 'searchquery', 'search_query', 'email', 'prompt', 'message', 'notes',
  'healthprofile', 'health_profile', 'fullhealthintake', 'full_health_intake',
  'conditions', 'medications', 'allergies', 'symptoms', 'diagnosis', 'diagnoses',
  'concerns', 'intake', 'fhirsummary', 'fhir_summary', 'wearablesummary',
  'wearable_summary', 'freetext', 'free_text', 'supportothertext',
  'support_other_text', 'customconcerns', 'custom_concerns',
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
    opt_out_capturing_by_default: GPC_ENABLED,
    before_send: sanitizePosthogEvent,
    // Automatic exception capture can include raw error messages/stacks. In a
    // health product those may accidentally contain user-entered context, so
    // we send only a coarse, explicitly-sanitized app_error event below.
    errorTracking: { autocaptureExceptions: false },
    loaded: (ph) => {
      window.posthog = ph;
      if (GPC_ENABLED) ph.opt_out_capturing?.();
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
