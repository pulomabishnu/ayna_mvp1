import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Capacitor } from '@capacitor/core'
import MobileApp from './mobile/MobileApp.jsx'
import './index.css'
import posthog from 'posthog-js'
import { tagInternalUserIfNeeded } from './utils/posthogInternal'
import { getStoredConsent, isGpcActive } from './utils/analyticsConsent.js'
import { sanitizePosthogEvent } from './utils/posthogPrivacy.js'

if (window.location.hostname === 'aynamvp1.vercel.app') {
  window.location.replace(
    'https://www.aynahealth.co' +
    window.location.pathname +
    window.location.search +
    window.location.hash
  );
}

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || '/ingest';
const IS_NATIVE_IOS = Capacitor.getPlatform() === 'ios';
const STORED_ANALYTICS_PREF = getStoredConsent();
const GPC_ENABLED = isGpcActive();

const SHOULD_CAPTURE_AT_START = !GPC_ENABLED && (
  IS_NATIVE_IOS
    ? STORED_ANALYTICS_PREF === 'granted'
    : STORED_ANALYTICS_PREF !== 'denied'
);

if (!POSTHOG_KEY) {
  console.warn(
    '[Ayna/PostHog] VITE_PUBLIC_POSTHOG_KEY is not set. ' +
    'PostHog will not initialize.'
  );
} else {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: 'https://us.posthog.com',
    person_profiles: 'always',
    autocapture: false,
    capture_pageview: SHOULD_CAPTURE_AT_START,
    mask_all_text: true,
    disable_session_recording: true,
    ip: false,
    opt_out_capturing_by_default: !SHOULD_CAPTURE_AT_START,
    before_send: sanitizePosthogEvent,
    errorTracking: { autocaptureExceptions: false },
    loaded: (ph) => {
      window.posthog = ph;
      if (SHOULD_CAPTURE_AT_START) tagInternalUserIfNeeded(ph);
    },
  });
}

const CHUNK_RELOAD_KEY = 'ayna_chunk_reload_attempted';
function isChunkLoadError(error) {
  const msg = String(error?.message || error || '');
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(msg);
}

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, recovering: false }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidMount() {
    try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch { /* private mode */ }
  }
  componentDidCatch(error) {
    try {
      posthog.capture('app_error', {
        errorName: String(error?.name || 'Error').slice(0, 64),
        isChunkLoadError: isChunkLoadError(error),
      });
    } catch { /* PostHog unavailable or opted out */ }

    if (isChunkLoadError(error)) {
      let alreadyTried = false;
      try { alreadyTried = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1'; } catch { /* private mode */ }
      if (!alreadyTried) {
        try { sessionStorage.setItem(CHUNK_RELOAD_KEY, '1'); } catch { /* private mode */ }
        this.setState({ recovering: true });
        window.location.reload();
      } else {
        try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch { /* private mode */ }
      }
    }
  }
  render() {
    if (this.state.recovering) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '2rem auto', color: '#666' }}>
          Updating…
        </div>
      )
    }
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '2rem auto' }}>
          <h1>Something went wrong</h1>
          <p style={{ color: '#666' }}>Please reload the app and try again.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}

const isMobilePreview = window.location.pathname === '/mobile-preview' || Capacitor.isNativePlatform();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {isMobilePreview ? <MobileApp /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>,
)
