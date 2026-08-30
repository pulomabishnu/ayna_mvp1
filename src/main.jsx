import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import posthog from 'posthog-js'
import { tagInternalUserIfNeeded } from './utils/posthogInternal'

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
// Default to the first-party /ingest proxy (see vercel.json rewrites) rather
// than PostHog's own domain directly — ad blockers (uBlock, Brave, Safari's
// tracking prevention) block requests to *.posthog.com/*.i.posthog.com by
// domain, silently dropping every event for a real share of visitors. Same
// project, same data — just routed through our own domain so it isn't
// recognizable as third-party analytics traffic.
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || '/ingest';

if (!POSTHOG_KEY) {
  console.warn(
    '[Ayna/PostHog] VITE_PUBLIC_POSTHOG_KEY is not set. ' +
    'PostHog will not initialize. ' +
    'Add it to Vercel environment variables. ' +
    'Get the key from: app.posthog.com → Settings → Project API Key'
  );
} else {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Only meaningful when api_host is a same-origin proxy (the default
    // above) — tells the SDK where the real PostHog app lives so in-app
    // links (session recordings, the toolbar) still resolve correctly
    // instead of trying to open a URL under our own /ingest path.
    ui_host: 'https://us.posthog.com',
    person_profiles: 'always',
    autocapture: false,
    capture_pageview: true,
    mask_all_text: true,
    disable_session_recording: true,
    ip: false,
    // Catches uncaught JS errors and unhandled promise rejections anywhere
    // in the app (event handlers, async code) and reports them to PostHog's
    // Error tracking automatically. Doesn't cover React render errors caught
    // by ErrorBoundary below — those are explicitly reported via
    // posthog.captureException() in componentDidCatch, since React swallows
    // them before they'd ever reach window.onerror.
    errorTracking: { autocaptureExceptions: true },
    loaded: (ph) => {
      // Expose on window so Puloma can verify from browser console in any environment:
      // Run: window.posthog.get_distinct_id()
      // Run: window.posthog.get_property('is_internal')
      window.posthog = ph;

      console.info(
        '[Ayna/PostHog] Initialized successfully. ' +
        'Distinct ID: ' + ph.get_distinct_id() + '. ' +
        'To verify internal filtering: ' +
        'window.posthog.get_property("is_internal") should return true ' +
        'if this device is in the internal ID list.'
      );

      tagInternalUserIfNeeded(ph);
    },
  });
}

// Vite's lazy-loaded chunks are hashed per deploy. A tab left open across a
// new deploy (we ship many in a session) still has the OLD hash cached in its
// React.lazy() closures, so the next click into Discovery/MyEcosystem/
// Articles 404s on a chunk that no longer exists on the CDN — surfacing as
// "Failed to fetch dynamically imported module" in this boundary. That's not
// a real app error, it's a stale asset manifest: reload once, automatically,
// rather than dead-ending on a scary error screen the user has to notice and
// click through. The sessionStorage flag caps it at one silent retry per
// session so a genuinely broken deploy still surfaces the real error instead
// of reload-looping forever.
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
    // A clean mount means this reload (if any) actually fixed things — clear
    // the one-shot flag so a LATER, unrelated chunk error in the same tab
    // session (e.g. another deploy landing while it's still open) still gets
    // its own automatic retry instead of going straight to the error screen.
    try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch (_) { /* private mode */ }
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info)
    try {
      posthog.captureException(error, {
        componentStack: info?.componentStack,
        isChunkLoadError: isChunkLoadError(error),
      });
    } catch (_) { /* posthog not initialized (missing key) — never block error handling on this */ }
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
          <p style={{ color: '#666' }}>{String(this.state.error?.message || this.state.error)}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
