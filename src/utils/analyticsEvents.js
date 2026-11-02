import posthog from 'posthog-js';
import { localDayKey, localDaysBetween } from './localDate.js';

/**
 * Retention, onboarding and sales tracking.
 * One place for the event names and their allowed properties, so every page
 * sends the same thing. NO health details: only ids, the surface, counts,
 * booleans and short enums. Anything else passed in is dropped here (and
 * main.jsx before_send still scrubs). Analytics never break the page.
 *
 * What each answers in PostHog:
 *   quiz start -> first match   funnel quiz_started -> first_match_shown (seconds_to_match)
 *   signup drop-off             signup_started -> signup_verified -> profile_setup_started -> signup_completed
 *   verification friction      signup_started -> signup_verification_required -> signup_verified
 *   D1 / D7 / D30               retention insight on app_opened (or $screen / $pageview);
 *                               days_since_first_open lets a trend read it without a cohort
 *   check-ins per week          checkin_logged.checkins_this_week
 *   notification opt-in         notification_prompt_answered.granted
 *   card CTR                    product_card_clicked / product_card_viewed (same surface)
 *   PDP -> retailer CTR         pdp_retailer_clicked / pdp_viewed
 *   products with >= 5 reviews  unique product_id on pdp_viewed where has_5_reviews
 */
export const EVENTS = {
  QUIZ_STARTED: 'quiz_started',
  FIRST_MATCH_SHOWN: 'first_match_shown',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_VERIFICATION_REQUIRED: 'signup_verification_required',
  SIGNUP_VERIFIED: 'signup_verified',
  SIGNUP_FAILED: 'signup_failed',
  PROFILE_SETUP_STARTED: 'profile_setup_started',
  PROFILE_SETUP_FINISHED: 'profile_setup_finished',
  SIGNUP_COMPLETED: 'signup_completed',
  APP_OPENED: 'app_opened',
  CHECKIN_LOGGED: 'checkin_logged',
  NOTIFICATION_PROMPT_ANSWERED: 'notification_prompt_answered',
  PRODUCT_CARD_VIEWED: 'product_card_viewed',
  PRODUCT_CARD_CLICKED: 'product_card_clicked',
  PDP_VIEWED: 'pdp_viewed',
  PDP_RETAILER_CLICKED: 'pdp_retailer_clicked',
};

// Allowed property keys and their type. Nothing else leaves the device.
const ALLOWED = {
  surface: 'enum', // 'web' | 'app' | 'mobile_web'
  where: 'id', // page or block id, e.g. 'today', 'explore_for_you', 'rundown'
  product_id: 'id',
  retailer: 'id',
  position: 'count',
  matches_count: 'count',
  seconds_to_match: 'count',
  days_since_first_open: 'count',
  checkins_this_week: 'count',
  review_count: 'count',
  has_5_reviews: 'bool',
  granted: 'bool',
  prompt: 'id', // 'after_rundown' | 'settings'
  signed_in: 'bool',
  method: 'id', // email | phone | google | apple
  verification: 'id', // email_code | sms | oauth | none
  stage: 'id', // account_create | verification | oauth_start
  reason: 'id', // sanitized provider error code only; never message text
  outcome: 'id', // completed | skipped | already_complete
};
const SURFACES = new Set(['web', 'app', 'mobile_web']);
const ID = /^[a-z0-9][a-z0-9_.:-]{0,63}$/i;

/** Keep only allowed keys with safe values (exported for tests). */
export function cleanProps(props = {}) {
  const out = {};
  for (const [k, v] of Object.entries(props || {})) {
    const type = ALLOWED[k];
    if (!type || v == null) continue;
    if (type === 'enum' && SURFACES.has(v)) out[k] = v;
    else if (type === 'id' && ID.test(String(v))) out[k] = String(v);
    else if (type === 'count' && Number.isFinite(Number(v)) && Number(v) >= 0) out[k] = Math.round(Number(v));
    else if (type === 'bool') out[k] = Boolean(v);
  }
  return out;
}

let client = posthog;
/** Tests swap the client. */
export function setAnalyticsClient(c) { client = c || posthog; }

export function trackEvent(name, props = {}) {
  if (!Object.values(EVENTS).includes(name)) return;
  try { client.capture(name, cleanProps(props)); } catch { /* analytics never blocks */ }
}

const store = {
  get(k) { try { return window.localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch { /* private mode */ } },
  remove(k) { try { window.localStorage.removeItem(k); } catch { /* private mode */ } },
};
const K_QUIZ = 'ayna:an:quiz_started_at';
const K_FIRST_MATCH = 'ayna:an:first_match_done';
const K_FIRST_OPEN = 'ayna:an:first_open_day';
const K_LAST_OPEN = 'ayna:an:last_open_day';
const K_CHECKINS = 'ayna:an:checkin_days';
const K_SIGNUP_FLOW = 'ayna:an:signup_flow_v1';
const SIGNUP_FLOW_TTL_MS = 48 * 60 * 60 * 1000;
const seen = new Set();

function safeId(value, fallback = 'unknown') {
  const v = String(value || '').trim().toLowerCase();
  return ID.test(v) ? v : fallback;
}

function readSignupFlow() {
  try {
    const flow = JSON.parse(store.get(K_SIGNUP_FLOW) || 'null');
    if (!flow || !Number.isFinite(Number(flow.started_at))) return null;
    if (Date.now() - Number(flow.started_at) > SIGNUP_FLOW_TTL_MS) {
      store.remove(K_SIGNUP_FLOW);
      return null;
    }
    return flow;
  } catch {
    store.remove(K_SIGNUP_FLOW);
    return null;
  }
}
function writeSignupFlow(flow) { store.set(K_SIGNUP_FLOW, JSON.stringify(flow)); }

/** True while a create-account attempt is still moving through verification/profile setup. */
export function hasPendingSignupFlow() { return Boolean(readSignupFlow()); }

/** A create-account submit or OAuth create-account redirect began. No email/phone is recorded. */
export function trackSignupStarted({ surface = eventSurface(), method = 'unknown', verification = 'none' } = {}) {
  const flow = {
    surface: SURFACES.has(surface) ? surface : eventSurface(),
    method: safeId(method),
    verification: safeId(verification, 'none'),
    started_at: Date.now(),
    verification_required: false,
    verified: false,
    profile_started: false,
    completed: false,
  };
  writeSignupFlow(flow);
  trackEvent(EVENTS.SIGNUP_STARTED, { surface: flow.surface, method: flow.method, verification: flow.verification });
}

/** The account flow now needs a code or provider authorization before a session exists. */
export function trackSignupVerificationRequired({ surface, method, verification } = {}) {
  const flow = readSignupFlow();
  if (!flow || flow.verification_required) return false;
  flow.surface = SURFACES.has(surface) ? surface : flow.surface;
  flow.method = safeId(method, flow.method || 'unknown');
  flow.verification = safeId(verification, flow.verification || 'unknown');
  flow.verification_required = true;
  writeSignupFlow(flow);
  trackEvent(EVENTS.SIGNUP_VERIFICATION_REQUIRED, { surface: flow.surface, method: flow.method, verification: flow.verification });
  return true;
}

/** A real Supabase session exists for the pending create-account attempt. */
export function trackSignupVerified({ surface, method } = {}) {
  const flow = readSignupFlow();
  if (!flow || flow.verified) return false;
  flow.surface = SURFACES.has(surface) ? surface : flow.surface;
  flow.method = safeId(method, flow.method || 'unknown');
  flow.verified = true;
  flow.verified_at = Date.now();
  writeSignupFlow(flow);
  trackEvent(EVENTS.SIGNUP_VERIFIED, { surface: flow.surface, method: flow.method, verification: flow.verification || 'none' });
  return true;
}

/** Provider errors are categorical codes only; raw messages and user-entered values never leave the device. */
export function trackSignupFailed({ surface = eventSurface(), method = 'unknown', stage = 'account_create', reason = 'unknown' } = {}) {
  const flow = readSignupFlow();
  const props = {
    surface: SURFACES.has(surface) ? surface : (flow?.surface || eventSurface()),
    method: safeId(method, flow?.method || 'unknown'),
    stage: safeId(stage),
    reason: safeId(reason),
  };
  trackEvent(EVENTS.SIGNUP_FAILED, props);
  // If account creation / OAuth could not even start, do not leave a stale
  // marker that could make a later ordinary sign-in look like a signup.
  if (flow && stage !== 'verification') store.remove(K_SIGNUP_FLOW);
}

/** Final profile step shown for the newly verified account. Older accounts are ignored. */
export function trackProfileSetupStarted({ surface } = {}) {
  const flow = readSignupFlow();
  if (!flow?.verified || flow.completed || flow.profile_started) return false;
  flow.surface = SURFACES.has(surface) ? surface : flow.surface;
  flow.profile_started = true;
  writeSignupFlow(flow);
  trackEvent(EVENTS.PROFILE_SETUP_STARTED, { surface: flow.surface, method: flow.method });
  return true;
}

/** Finishes the signup funnel whether she completes the profile now or explicitly chooses Finish later. */
export function trackProfileSetupFinished({ surface, outcome = 'completed' } = {}) {
  const flow = readSignupFlow();
  if (!flow?.verified || flow.completed) return false;
  flow.surface = SURFACES.has(surface) ? surface : flow.surface;
  flow.completed = true;
  const safeOutcome = safeId(outcome, 'completed');
  trackEvent(EVENTS.PROFILE_SETUP_FINISHED, { surface: flow.surface, method: flow.method, outcome: safeOutcome });
  trackEvent(EVENTS.SIGNUP_COMPLETED, { surface: flow.surface, method: flow.method, outcome: safeOutcome });
  store.remove(K_SIGNUP_FLOW);
  return true;
}

/** Quiz started (first question on screen). Remembers the time for first_match_shown. */
export function trackQuizStarted({ surface, signed_in = false } = {}) {
  store.set(K_QUIZ, String(Date.now()));
  trackEvent(EVENTS.QUIZ_STARTED, { surface, signed_in });
}

/** First match on screen, once per device. */
export function trackFirstMatchShown({ surface, matches_count = 0 } = {}) {
  if (store.get(K_FIRST_MATCH)) return;
  store.set(K_FIRST_MATCH, '1');
  const started = Number(store.get(K_QUIZ));
  const seconds = started > 0 ? Math.max(0, Math.round((Date.now() - started) / 1000)) : undefined;
  trackEvent(EVENTS.FIRST_MATCH_SHOWN, { surface, matches_count, seconds_to_match: seconds });
}

/** App or site opened; at most once per local day. Feeds D1/D7/D30. */
export function trackAppOpened({ surface, signed_in = false } = {}, now = new Date()) {
  const today = localDayKey(now);
  if (store.get(K_LAST_OPEN) === today) return;
  store.set(K_LAST_OPEN, today);
  let first = store.get(K_FIRST_OPEN);
  if (!first) { first = today; store.set(K_FIRST_OPEN, today); }
  trackEvent(EVENTS.APP_OPENED, { surface, signed_in, days_since_first_open: Math.max(0, localDaysBetween(first, today) || 0) });
}

/** A daily check-in saved. Sends how many local days this week (last 7) had one; never what was logged. */
export function trackCheckin({ surface, where = 'today' } = {}, now = new Date()) {
  const today = localDayKey(now);
  let days = [];
  try { days = JSON.parse(store.get(K_CHECKINS) || '[]'); } catch { days = []; }
  days = [...new Set([...days.filter((d) => typeof d === 'string' && localDaysBetween(d, today) < 7 && localDaysBetween(d, today) >= 0), today])];
  store.set(K_CHECKINS, JSON.stringify(days));
  trackEvent(EVENTS.CHECKIN_LOGGED, { surface, where, checkins_this_week: days.length });
}

/** The notification prompt was answered. */
export function trackNotificationPrompt({ surface, granted, prompt = 'after_rundown' } = {}) {
  trackEvent(EVENTS.NOTIFICATION_PROMPT_ANSWERED, { surface, granted, prompt });
}

/** A product card was on screen (once per surface/where/product per page load). */
export function trackCardViewed({ surface, where, product_id, position } = {}) {
  const key = `${surface}:${where}:${product_id}`;
  if (!product_id || seen.has(key)) return;
  seen.add(key);
  trackEvent(EVENTS.PRODUCT_CARD_VIEWED, { surface, where, product_id, position });
}

export function trackCardClicked({ surface, where, product_id, position } = {}) {
  trackEvent(EVENTS.PRODUCT_CARD_CLICKED, { surface, where, product_id, position });
}

/** Product page opened, with its review count (for "products with >= 5 reviews"). */
export function trackPdpViewed({ surface, product_id, review_count = 0 } = {}) {
  trackEvent(EVENTS.PDP_VIEWED, { surface, product_id, review_count, has_5_reviews: review_count >= 5 });
}

export function trackPdpRetailerClicked({ surface, product_id, retailer } = {}) {
  trackEvent(EVENTS.PDP_RETAILER_CLICKED, { surface, product_id, retailer });
}

/** Surface for an event: the native app or /mobile-preview is 'app'; a phone-width website is 'mobile_web'. */
export function eventSurface() {
  if (typeof window === 'undefined') return 'web';
  if (window.Capacitor?.isNativePlatform?.() || window.location?.pathname?.startsWith('/mobile-preview')) return 'app';
  return window.matchMedia?.('(max-width: 767px)').matches ? 'mobile_web' : 'web';
}
