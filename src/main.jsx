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

// Keep the public Vercel alias from becoming a second app origin.
// Auth, local storage, and session storage should all live on the canonical site.
// Unique Vercel preview deployment URLs are intentionally left untouched.
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

// The iOS app is opt-in: on a fresh install PostHog may initialize in a fully
// opted-out state so the privacy controls can talk to the SDK, but it cannot
// emit a pageview, exception, or other analytics event until the user chooses
// Allow analytics. The website keeps its existing opt-out model; a prior web
// opt-out and Global Privacy Control are still honored before the first event.
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
    // Automatic exception capture can include raw messages/stacks. In a health
    // app those can contain user-entered context, so only a coarse app_error
    // event is sent by ErrorBoundary below, and only when analytics is allowed.
    errorTracking: { autocaptureExceptions: false },
    loaded: (ph) => {
      // Exposed only so the app's explicit Privacy settings can change the SDK
      // choice. Do not log the distinct ID or health/account information.
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
    try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch (_) { /* private mode */ }
  }
  componentDidCatch(error) {
    // Keep production telemetry deliberately coarse: no error message, stack,
    // component props, request body, prompt, or user-entered text is attached.
    try {
      posthog.capture('app_error', {
        errorName: String(error?.name || 'Error').slice(0, 64),
        isChunkLoadError: isChunkLoadError(error),
      });
    } catch (_) { /* PostHog unavailable or opted out */ }

    if (isChunkLoadError(error)) {
      let alreadyTried = false;
      try { alreadyTried = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1'; } catch (_) { /* private mode */ }
      if (!alreadyTried) {
        try { sessionStorage.setItem(CHUNK_RELOAD_KEY, '1'); } catch (_) { /* private mode */ }
        this.setState({ recovering: true });
        window.location.reload();
      } else {
        try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch (_) { /* private mode */ }
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

// Native apps (iOS/Android via Capacitor) have no /mobile-preview URL to
// check — they always show the mobile UI. The web build still gates it
// behind the path, so the live website's normal routing is unaffected.
const isMobilePreview = window.location.pathname === '/mobile-preview' || Capacitor.isNativePlatform();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {isMobilePreview ? <MobileApp /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>,
)
