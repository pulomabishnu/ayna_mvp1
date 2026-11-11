/**
 * essentialAnalytics.js
 *
 * Two tiers of PostHog capture on the website and in the app:
 *
 * 1. ESSENTIAL (everyone who has not made a choice yet): an anonymous count of
 *    page visits, app errors and new accounts (signed_up, method only), so the founders can tell whether people reach
 *    the site and whether it is broken. posthog-js runs in cookieless mode
 *    (`cookieless_mode: 'on_reject'` in main.jsx): no cookies, no local or
 *    session storage, no analytics ID. PostHog's servers derive a daily-rotating
 *    hash instead. Only the events in ESSENTIAL_EVENTS are sent, with no person
 *    properties, and page addresses are cut down to the site section
 *    (/product, /community) so no product, topic, search or condition is sent.
 *
 * 2. OPTIONAL (only after "Enable optional analytics"): the full, sanitized
 *    product analytics described in analyticsConsent.js.
 *
 * "Keep analytics off", closing the notice, and Global Privacy Control send
 * nothing at all, not even the essential tier.
 *
 * Why this exists: on 2026-11-06 analytics became opt-in only, and because
 * nothing was sent before a choice, daily visitors in PostHog fell from
 * 45-105 to 1-10. That looked exactly like the site going down.
 */

export const ESSENTIAL_EVENTS = new Set(['$pageview', '$pageleave', 'app_error', 'signed_up']);

// PostHog's cookieless placeholder id. Every anonymous event carries this,
// never an account's analytics id: if the visitor is signed in (identify ran)
// but hasn't chosen, the event still can't be tied to her account.
export const COOKIELESS_ID = '$posthog_cookieless';

// Top-level sections of the site. Before opt-in, a page address is reduced
// to one of these (/product/monistat-7?q=yeast#symptoms -> /product); any
// other first segment becomes /other. essentialAnalytics.test.js fails if
// vercel.json or App.jsx serves a section missing from this list.
export const KNOWN_SECTIONS = new Set([
  'a', 'about', 'admin', 'appointment-prep', 'ask', 'auth', 'campus-resources', 'community',
  'compare', 'comparison', 'confirmed', 'consumer-health-data', 'contact', 'delete-account',
  'discovery', 'ecosystem', 'explore', 'free-product', 'gift', 'health', 'health-data', 'home',
  'how-it-works', 'how-we-make-money', 'internal', 'join', 'library', 'mobile-preview',
  'my-ecosystem', 'omitted', 'partner-brands', 'partners', 'pricing', 'privacy', 'privacy-policy',
  'pro', 'product', 'profile', 'quiz', 'recalls', 'recommendations', 'screenings', 'services',
  'shop', 'startups', 'terms', 'terms-of-use', 'text-ayna', 'today', 'tracked', 'wrapped', 'you',
]);

// Properties an anonymous event may carry, besides the generalized URL
// fields below. Everything else (page title, ad-click IDs such as fbclid or
// gclid, utm_campaign/term/content, feature-flag details, scroll depth) is
// dropped. token/distinct_id/$cookieless_mode are needed for PostHog to
// accept and count the event.
const KEEP = new Set([
  'token', 'distinct_id', 'platform', '$cookieless_mode', '$insert_id', '$time', '$lib',
  '$lib_version', '$lib_custom_api_host', '$sdk_dist_channel', '$pageview_id', '$prev_pageview_id',
  '$prev_pageview_duration', '$host', '$os', '$os_version', '$browser', '$browser_version',
  '$device_type', '$raw_user_agent', '$browser_language', '$browser_language_prefix', '$timezone',
  '$timezone_offset', '$screen_height', '$screen_width', '$viewport_height', '$viewport_width',
  '$referring_domain', '$is_identified', '$process_person_profile', 'utm_source', 'utm_medium',
]);
// app_error's own coarse fields (built by appErrorProperties, message redacted).
const KEEP_FOR_ERRORS = new Set(['errorName', 'errorMessage', 'component', 'view', 'isChunkLoadError']);
// signed_up keeps only how the account was made (email / google / apple / phone).
const KEEP_FOR_SIGNUP = new Set(['method']);

/** '/product/monistat-7?q=x#y' -> '/product'; unknown sections -> '/other'. */
export function sectionPath(pathname) {
  const first = String(pathname || '/').split(/[?#]/)[0].split('/').filter(Boolean)[0];
  if (!first) return '/';
  return KNOWN_SECTIONS.has(first.toLowerCase()) ? `/${first.toLowerCase()}` : '/other';
}

/** Full URL -> origin + section path, no query or fragment. */
export function sectionUrl(value) {
  if (typeof value !== 'string' || !value) return value;
  try {
    const u = new URL(value);
    return `${u.origin}${sectionPath(u.pathname)}`;
  } catch {
    return sectionPath(value);
  }
}

/** Referrer: just the site it came from ('https://www.google.com'), or '$direct'. */
function referrerOrigin(value) {
  if (typeof value !== 'string' || !value || value === '$direct') return value;
  try {
    const u = new URL(value);
    // An ayna page as referrer is reduced to its section like any other address.
    return /(^|\.)aynahealth\.co$/i.test(u.hostname) ? sectionUrl(value) : u.origin;
  } catch {
    return '$direct';
  }
}

/** Reduce an anonymous event's properties to the allowlist above. */
export function essentialProperties(event) {
  const props = event?.properties || {};
  const out = {};
  for (const [key, value] of Object.entries(props)) {
    if (KEEP.has(key) || (event.event === 'app_error' && KEEP_FOR_ERRORS.has(key)) || (event.event === 'signed_up' && KEEP_FOR_SIGNUP.has(key))) out[key] = value;
  }
  if ('$current_url' in props) out.$current_url = sectionUrl(props.$current_url);
  if ('$pathname' in props) out.$pathname = sectionPath(props.$pathname);
  if ('$prev_pageview_pathname' in props) out.$prev_pageview_pathname = sectionPath(props.$prev_pageview_pathname);
  if ('$referrer' in props) out.$referrer = referrerOrigin(props.$referrer);
  return out;
}

/**
 * Apply the consent tier to an event that already went through
 * sanitizeEventPayload(). Returns the event to send, or null to drop it.
 *
 * @param {object|null} event   posthog-js CaptureResult
 * @param {object} state
 * @param {boolean} state.optedIn  posthog.has_opted_in_capturing()
 * @param {boolean} state.gpc      navigator.globalPrivacyControl === true
 * @param {string|undefined} state.stored  getStoredConsent(): 'granted' | 'denied' | undefined
 */
export function applyConsentTier(event, { optedIn, gpc, stored }) {
  if (!event) return null;
  if (optedIn) return event;
  if (gpc || stored === 'denied') return null;
  if (!ESSENTIAL_EVENTS.has(event.event)) return null;
  const out = { ...event, properties: { ...essentialProperties(event), distinct_id: COOKIELESS_ID, $cookieless_mode: true } };
  if ('distinct_id' in out) out.distinct_id = COOKIELESS_ID;
  // No person profile in the essential tier ($initial_referrer and the like).
  delete out.$set;
  delete out.$set_once;
  return out;
}
