import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import posthog from 'posthog-js'
import { tagInternalUserIfNeeded } from './utils/posthogInternal'

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST
  || 'https://us.i.posthog.com';

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
    person_profiles: 'identified_only',
    autocapture: false,
    capture_pageview: true,
    mask_all_text: true,
    disable_session_recording: true,
    ip: false,
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

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }
  render() {
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
