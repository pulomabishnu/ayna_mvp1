import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Capacitor } from '@capacitor/core'
import './styles/fonts.css'
import './index.css'
import './styles/motion.css'
import './styles/finish.css'
import './styles/delight.css'
import { installDelight } from './utils/delightRuntime.js'
import { markPerf } from './utils/perfTimings.js'

// The whole mobile app (src/mobile/**, ~1.6MB of source) was bundled into the
// web entry chunk even though the web only ever shows it on /mobile-preview.
// Lazy-load it so normal website visitors never download it; native
// (Capacitor) builds load it from local assets, where the extra request is
// free.
const MobileApp = React.lazy(() => import('./mobile/MobileApp.jsx'))
import './styles/search-focus.css'
import { installNoEmDash } from './utils/noEmDashDom.js'
installDelight()
// DEV only: remember ?fixture=community for this tab before the router tidies
// the URL (src/utils/community/devFixture.js). Removed from production builds.
if (import.meta.env.DEV) {
  try { if (new URLSearchParams(window.location.search).get('fixture') === 'community') sessionStorage.setItem('ayna_dev_fixture', 'community') } catch { /* private mode */ }
}
import posthog from 'posthog-js'
import { getInternalIds, tagInternalUserIfNeeded } from './utils/posthogInternal'
import { hasInternalBrowserMarker, tagFounderAnalyticsIfNeeded } from './utils/founderAnalytics'
import { applyStoredConsent, getStoredConsent, isMandatoryGpcVisitor } from './utils/analyticsConsent'
import { appErrorProperties } from './utils/errorAnalytics'
import { sanitizeEventPayload } from './utils/analyticsSanitize'
import { analyticsPlatform, resolvePosthogKey } from './utils/analyticsPlatform'

if (window.location.hostname === 'aynamvp1.vercel.app') {
  window.location.replace(
    'https://www.aynahealth.co' + window.location.pathname + window.location.search + window.location.hash
  );
}

// App builds are made on a laptop, not on Vercel, and a missing .env key
// silently turned analytics off: the TestFlight app has never sent an event.
// The native build falls back to the project's public key (the same phc_ key
// every website visitor already downloads), so it can't be built without it.
const POSTHOG_KEY = resolvePosthogKey(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, Capacitor.isNativePlatform());
// Default to the first-party /ingest proxy (see vercel.json rewrites) rather
// than PostHog's own domain directly, ad blockers (uBlock, Brave, Safari's
// tracking prevention) block requests to *.posthog.com/*.i.posthog.com by
// domain, silently dropping every event for a real share of visitors. Same
// project, same data, just routed through our own domain so it isn't
// recognizable as third-party analytics traffic.
//
// The native app is the exception: it loads from a local capacitor:// origin
// (same reason as src/utils/apiUrl.js), so a relative '/ingest' resolves to
// the bundled files and every app event was silently dropped. There's no ad
// blocker in the native WebView, so it talks to PostHog directly. (Ram, PR #43)
const POSTHOG_HOST = Capacitor.isNativePlatform()
  ? 'https://us.i.posthog.com'
  : (import.meta.env.VITE_PUBLIC_POSTHOG_HOST || '/ingest');
// Only the live site and the native app report analytics. Vercel previews
// (*.vercel.app) and local dev used to send into the production project
// (27% of events in 90 days), so they stay off entirely.
const ANALYTICS_HOST_ALLOWED = Capacitor.isNativePlatform()
  || (typeof window !== 'undefined' && /^(www\.)?aynahealth\.co$/i.test(window.location.hostname));
const ANALYTICS_PLATFORM = analyticsPlatform(Capacitor.isNativePlatform(), Capacitor.getPlatform());
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
  } catch { /* ignore */ }
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
    } catch { /* ignore */ }
    return result;
  };
}

function sanitizePosthogEvent(event) {
  // Once this browser has been recognized as one of the three founders, do not
  // send further analytics at all. The PostHog person is also tagged internal
  // at sign-in so any earlier anonymous events from a brand-new browser can be
  // excluded by the internal-user filter after identity merge.
  if (hasInternalBrowserMarker()) return null;
  // Campus Resources (sexual-assault support directory): never send ANY event
  // from this page. A pageview or click there would reveal that a specific
  // visitor looked for these resources.
  if (typeof window !== 'undefined' && /^\/campus-resources(\/|$)/.test(window.location.pathname)) return null;
  // platform on every event, including the first pageview (which can be sent
  // before the `loaded` register below takes effect). Free text typed into
  // Shop/Community search (?q=) is stripped from every URL property.
  return sanitizeEventPayload(event, { platform: ANALYTICS_PLATFORM });
}

if (!POSTHOG_KEY) {
  console.warn('[Ayna/PostHog] VITE_PUBLIC_POSTHOG_KEY is not set; analytics are disabled.');
} else if (!ANALYTICS_HOST_ALLOWED) {
  console.info('[Ayna/PostHog] analytics are off on this host (preview or local).');
} else {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Only meaningful when api_host is a same-origin proxy (the default
    // above), tells the SDK where the real PostHog app lives so in-app
    // links (session recordings, the toolbar) still resolve correctly
    // instead of trying to open a URL under our own /ingest path.
    ui_host: 'https://us.posthog.com',
    person_profiles: 'always',
    autocapture: false,
    // The router uses history.pushState (see App.jsx), so `true` only ever
    // recorded the first page of a visit: 88% of sessions logged exactly one
    // pageview, and in-app routes like /quiz never appeared. 'history_change'
    // also records each client-side navigation. before_send still drops
    // anything on /campus-resources, since it runs after the URL changes. (Ram, PR #47)
    capture_pageview: 'history_change',
    mask_all_text: true,
    disable_session_recording: true,
    ip: false,
    // Usage analytics are on by default, but a prior opt-out or Global
    // Privacy Control must be honored before PostHog can emit the initial
    // pageview. Health free text and direct identifiers are still stripped by
    // before_send below, and session recording/autocapture remain disabled.
    //
    // Every GPC sender starts opted out here, synchronously, regardless of
    // which state they're in. Confirming whether their specific state's law
    // actually mandates honoring GPC requires an async geolocation lookup
    // (isMandatoryGpcVisitor() in `loaded` below), which can't complete
    // before this init call returns. This is the conservative direction to
    // fail in: worst case a GPC visitor outside a mandatory state stays
    // opted out a few hundred ms longer than strictly required; capturing
    // before confirming they're NOT in a mandatory state is not a trade
    // worth making for a slightly earlier pageview.
    opt_out_capturing_by_default: GPC_ENABLED || STORED_ANALYTICS_PREF === 'denied',
    before_send: sanitizePosthogEvent,
    // Automatic exception capture can include raw error messages/stacks. In a
    // health product those may accidentally contain user-entered context, so
    // we send only a coarse, explicitly-sanitized app_error event below.
    // posthog-js reads `capture_exceptions`; `errorTracking` is not an init
    // option, so on its own it never disabled anything (only the project
    // setting did). Kept alongside in case it's referenced elsewhere. (Ram, PR #47)
    capture_exceptions: false,
    errorTracking: { autocaptureExceptions: false },
    loaded: (ph) => {
      window.posthog = ph;
      if (GPC_ENABLED) {
        // isMandatoryGpcVisitor() only makes a network call (to
        // /api/gpc-region) because GPC is active here, see
        // analyticsConsent.js. If this state's law doesn't actually mandate
        // honoring GPC, correct the synchronous default above via
        // set_config rather than opt_in_capturing(): set_config live-updates
        // opt_out_capturing_by_default without ever recording an explicit
        // SDK decision, so this visitor ends up in EXACTLY the same state as
        // anyone else who's never touched the notice: captured by default,
        // consent still "pending", opt-out notice still showing (see
        // ConsentBanner.jsx, which asks the same isMandatoryGpcVisitor()
        // question for that same reason). Calling opt_in_capturing() here
        // instead would mark their consent explicit and wrongly suppress
        // the notice, as if they'd already answered it themselves.
        isMandatoryGpcVisitor().then((mandatory) => {
          if (!mandatory) ph.set_config?.({ opt_out_capturing_by_default: false });
        });
      } else {
        applyStoredConsent(ph);
      }
      tagFounderAnalyticsIfNeeded(ph);
      tagInternalUserIfNeeded(ph);
      // Every event says where it came from, so app and website separate
      // with one filter: platform = ios_app / android_app / web.
      ph.register({ platform: ANALYTICS_PLATFORM });
      if (Capacitor.isNativePlatform()) registerNativeAppAnalytics(ph);
    },
  });
}

// The app runs posthog-js inside its WebView, so the native SDK's lifecycle
// events never existed. Send the same names ("Application Opened" etc.) and
// $app_version / $app_build, which the TestFlight dashboard already uses.
function registerNativeAppAnalytics(ph) {
  import('@capacitor/app').then(async ({ App: CapApp }) => {
    try {
      const info = await CapApp.getInfo();
      ph.register({ $app_version: info?.version || '', $app_build: info?.build || '' });
    } catch { /* app info unavailable */ }
    try { ph.capture('Application Opened', { from_background: false }); } catch { /* ignore */ }
    try {
      CapApp.addListener('appStateChange', ({ isActive }) => {
        try { ph.capture(isActive ? 'Application Opened' : 'Application Backgrounded', isActive ? { from_background: true } : {}); } catch { /* ignore */ }
      });
    } catch { /* listener unavailable */ }
  }).catch(() => { /* plugin missing in this build */ });
}

// Vite's lazy-loaded chunks are hashed per deploy. A tab left open across a
// new deploy (we ship many in a session) still has the OLD hash cached in its
// React.lazy() closures, so the next click into Discovery/MyEcosystem/
// Articles 404s on a chunk that no longer exists on the CDN, surfacing as
// "Failed to fetch dynamically imported module" in this boundary. That's not
// a real app error, it's a stale asset manifest: reload once, automatically,
// rather than dead-ending on a scary error screen the user has to notice and
// click through. The sessionStorage flag caps it at one silent retry per
// session so a genuinely broken deploy still surfaces the real error instead
// of reload-looping forever.
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
    // A clean mount means this reload (if any) actually fixed things, clear
    // the one-shot flag so a LATER, unrelated chunk error in the same tab
    // session (e.g. another deploy landing while it's still open) still gets
    // its own automatic retry instead of going straight to the error screen.
    try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch { /* private mode */ }
  }

  componentDidCatch(error, info) {
    console.error('App error:', error);
    try {
      // What broke and where: redacted message, nearest component (or the
      // current screen), code/status. $pathname comes from posthog-js.
      posthog.capture('app_error', appErrorProperties(error, info, {
        isChunkLoadError: isChunkLoadError(error),
        view: typeof window !== 'undefined' ? window.__aynaView : '',
      }));
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
      return <div style={{ minHeight: '100vh', boxSizing: 'border-box', padding: '48px 20px', background: '#ffedac', color: '#3e2723', font: "500 16px/1.5 'Figtree', system-ui, sans-serif", textAlign: 'center' }}>Updating…</div>;
    }

    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', boxSizing: 'border-box', padding: '64px 20px', background: '#ffedac', color: '#3e2723', font: "400 16px/1.5 'Figtree', system-ui, sans-serif" }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 12px', font: "400 36px/1.1 var(--ay-heading, 'ayna Display', 'Figtree', system-ui, sans-serif)", letterSpacing: '-.01em' }}>This page didn’t load</h1>
          <p style={{ margin: 0, color: 'rgba(62,39,35,.8)' }}>ayna hit an error. Reload the page to try again.</p>
          <button type="button" onClick={() => window.location.reload()} style={{ marginTop: 24, minHeight: 52, padding: '0 28px', border: '1.5px solid #3e2723', borderRadius: 999, background: '#3e2723', color: '#ffedac', boxShadow: '3px 3px 0 #3e2723', font: "600 16px/1 'Figtree', system-ui, sans-serif", cursor: 'pointer' }}>
            Reload
          </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Native apps (iOS/Android via Capacitor) have no /mobile-preview URL to
// check, they always show the mobile UI. The web build still gates it
// behind the path, so the live website's normal routing is unaffected.
const isMobilePreview = window.location.pathname === '/mobile-preview' || Capacitor.isNativePlatform();
// The app's typefaces load only for the app; the website keeps to its two.
if (isMobilePreview) {
  try {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&display=swap';
    document.head.appendChild(l);
  } catch { /* fonts are progressive */ }
}

// Native app: shop and article links open in an in-app browser sheet
// (SFSafariViewController / Custom Tabs) instead of leaving ayna, so people
// don't lose their place (focus group, Oct 19). Done once, for every external
// link, so no screen can forget it.
if (Capacitor.isNativePlatform()) {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    const a = event.target?.closest?.('a[href]');
    if (!a) return;
    let url;
    try { url = new URL(a.getAttribute('href'), window.location.href); } catch { return; }
    if (!/^https?:$/.test(url.protocol) || url.origin === window.location.origin) return;
    event.preventDefault();
    import('@capacitor/browser')
      .then(({ Browser }) => Browser.open({ url: url.toString(), presentationStyle: 'popover' }))
      .catch(() => { window.open(url.toString(), '_blank'); });
  }, true);
}

// Lock pinch-zoom in the native app only. The WKWebView has no browser chrome
// to reset an accidental pinch, so once someone zooms in there is no way
// back to 100% and the whole layout stays broken, this is the "you can
// zoom out when you zoom in" bug. The web build keeps normal pinch-zoom
// (accessibility), so this only touches the meta tag on native.
if (Capacitor.isNativePlatform()) {
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    viewportMeta.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }
}

// While the app code loads: the page colour of the theme she picked (espresso in dark,
// butter in light), so there is no off-white flash before the first screen.
function mobileLoadingBackground() {
  try { return localStorage.getItem('ayna_mobile_theme_v1') === 'dark' ? '#3e2723' : '#ffedac'; } catch { return '#ffedac'; }
}

installNoEmDash(document.body)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {isMobilePreview ? (
        <React.Suspense fallback={<div style={{ minHeight: '100vh', background: mobileLoadingBackground() }} />}>
          <MobileApp />
        </React.Suspense>
      ) : <App />}
    </ErrorBoundary>
  </React.StrictMode>
);

// "page opened → app shell visible": the double rAF fires after the first
// frame React painted, which is exactly when the shell is on screen.
requestAnimationFrame(() => requestAnimationFrame(() => markPerf('shell_visible')));
