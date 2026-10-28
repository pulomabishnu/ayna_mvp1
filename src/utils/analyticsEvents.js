import posthog from 'posthog-js';
import { localDayKey, localDaysBetween } from './localDate.js';

/**
 * Privacy-safe product analytics shared by web + app.
 *
 * Rules:
 * - Never send health answers, Ask/search text, names, emails, cycle dates, or measurements.
 * - Prefer ids, booleans, counts, ranks, buckets, versions and short enums.
 * - Keep event names stable across web/app so one chart can compare both.
 * - Every PR88-era custom event gets the same release/schema tags.
 */
export const ANALYTICS_SCHEMA_VERSION = 2;
export const RELEASE_VERSION = 'pr88';
export const ALGORITHM_VERSION = 'pr88';

export const EVENTS = {
  QUIZ_STARTED: 'quiz_started',
  FIRST_MATCH_SHOWN: 'first_match_shown',
  APP_OPENED: 'app_opened',
  CHECKIN_LOGGED: 'checkin_logged',
  NOTIFICATION_PROMPT_ANSWERED: 'notification_prompt_answered',
  PRODUCT_CARD_VIEWED: 'product_card_viewed',
  PRODUCT_CARD_CLICKED: 'product_card_clicked',
  PDP_VIEWED: 'pdp_viewed',
  PDP_RETAILER_CLICKED: 'pdp_retailer_clicked',
  LANDING_PRIMARY_CTA_CLICKED: 'landing_primary_cta_clicked',
  LANDING_HOW_MATCHING_CLICKED: 'landing_how_matching_clicked',
  LANDING_PRO_CTA_CLICKED: 'landing_pro_cta_clicked',
  SETTINGS_SEARCH_STARTED: 'settings_search_started',
  SETTINGS_SEARCH_RESULT_CLICKED: 'settings_search_result_clicked',
  ASK_QUESTION_SUBMITTED: 'ask_question_submitted',
  HEALTH_MATCH_SETTING_CHANGED: 'health_match_setting_changed',
  HEALTH_MATCH_SETTING_SAVE_FAILED: 'health_match_setting_save_failed',
  HEALTH_SHAPING_STATUS: 'health_shaping_status',
  HEALTH_SHAPING_WHY_CLICKED: 'health_shaping_why_clicked',
  HEALTH_SHAPING_CONNECT_CLICKED: 'health_shaping_connect_clicked',
  PRO_GATE_VIEWED: 'pro_gate_viewed',
  ROUTINE_PRODUCT_ADDED: 'routine_product_added',
  ROUTINE_PRODUCT_REMOVED: 'routine_product_removed',
};

const ALLOWED = {
  surface: 'enum_surface',
  where: 'id',
  source: 'id',
  entry_surface: 'id',
  feature: 'id',
  setting_group: 'id',
  gate_reason: 'id',
  provider: 'id',
  plan: 'id',
  detail_type: 'id',
  failure_code: 'id',
  algorithm_version: 'id',
  recommendation_run_id: 'id',
  brand_id: 'id',
  category: 'id',
  product_id: 'id',
  retailer: 'id',
  match_score_bucket: 'id',
  rank: 'count',
  position: 'count',
  matches_count: 'count',
  seconds_to_match: 'count',
  days_since_first_open: 'count',
  checkins_this_week: 'count',
  review_count: 'count',
  query_length: 'count',
  result_count: 'count',
  affected_goal_count: 'count',
  affected_product_count: 'count',
  source_count: 'count',
  has_5_reviews: 'bool',
  granted: 'bool',
  signed_in: 'bool',
  enabled: 'bool',
  success: 'bool',
  applied: 'bool',
  is_partner: 'bool',
  health_data_enabled: 'bool',
  health_data_applied: 'bool',
  prompt: 'id',
};
const SURFACES = new Set(['web', 'app', 'mobile_web', 'landing', 'pro', 'ask', 'you', 'settings', 'health', 'ecosystem', 'library', 'community', 'shop']);
const ID = /^[a-z0-9][a-z0-9_.:-]{0,95}$/i;
const PRODUCT_CONTEXT_MAX_AGE = 30 * 60 * 1000;

let client = posthog;
let contextRegistered = false;
let capturePatched = false;
let domTrackingInstalled = false;
const recommendationContext = new Map();

export function setAnalyticsClient(c) {
  client = c || posthog;
  contextRegistered = false;
  capturePatched = false;
}

export function analyticsId(value, fallback = 'unknown') {
  const s = String(value || '').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return s || fallback;
}

export function matchScoreBucket(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'unknown';
  if (n >= 90) return '90-100';
  if (n >= 80) return '80-89';
  if (n >= 70) return '70-79';
  if (n >= 60) return '60-69';
  return 'under-60';
}

/**
 * Remember the context in which a product was recommended. Later events for
 * that same product inherit the run/rank/version automatically. This is
 * in-memory only and contains no health answers.
 */
export function rememberRecommendationContext(productId, context = {}) {
  if (!productId) return;
  recommendationContext.set(String(productId), {
    recommendation_run_id: context.recommendation_run_id,
    algorithm_version: context.algorithm_version,
    rank: Number.isFinite(Number(context.rank)) ? Math.round(Number(context.rank)) : undefined,
    match_score_bucket: context.match_score_bucket,
    brand_id: context.brand_id,
    is_partner: typeof context.is_partner === 'boolean' ? context.is_partner : undefined,
    health_data_applied: typeof context.health_data_applied === 'boolean' ? context.health_data_applied : undefined,
    remembered_at: Date.now(),
  });
}

function normalizeCapturedProps(_eventName, props) {
  if (!props || typeof props !== 'object' || Array.isArray(props)) return props;
  const out = { ...props };

  // Canonical aliases so old and new screens can share one dashboard.
  const productId = out.product_id ?? out.productId;
  if (productId != null && String(productId)) {
    out.product_id = String(productId);
    const ctx = recommendationContext.get(String(productId));
    if (ctx && Date.now() - ctx.remembered_at <= PRODUCT_CONTEXT_MAX_AGE) {
      if (out.recommendation_run_id == null && ctx.recommendation_run_id) out.recommendation_run_id = ctx.recommendation_run_id;
      if (out.algorithm_version == null && ctx.algorithm_version) out.algorithm_version = ctx.algorithm_version;
      if (out.rank == null && ctx.rank != null) out.rank = ctx.rank;
      if (out.match_score_bucket == null && ctx.match_score_bucket) out.match_score_bucket = ctx.match_score_bucket;
      if (out.brand_id == null && ctx.brand_id) out.brand_id = ctx.brand_id;
      if (out.is_partner == null && ctx.is_partner != null) out.is_partner = ctx.is_partner;
      if (out.health_data_applied == null && ctx.health_data_applied != null) out.health_data_applied = ctx.health_data_applied;
    }
  }
  if (out.brand_id == null && out.brand) out.brand_id = analyticsId(out.brand);
  if (out.rank == null && Number.isFinite(Number(out.position))) out.rank = Math.round(Number(out.position));
  if (out.match_score_bucket == null) {
    const score = out.matchPercent ?? out.matchPercentage ?? out.match_score ?? out.matchScore;
    if (score != null) out.match_score_bucket = matchScoreBucket(score);
  }
  return out;
}

function patchCapture() {
  if (capturePatched || typeof client?.capture !== 'function') return;
  const original = client.capture.bind(client);
  client.capture = (eventName, props, ...rest) => original(eventName, normalizeCapturedProps(eventName, props), ...rest);
  capturePatched = true;
}

/** Register common tags once. Direct posthog.capture calls inherit these too. */
export function ensureAnalyticsContext() {
  patchCapture();
  if (contextRegistered) return;
  try {
    client.register?.({
      analytics_schema_version: ANALYTICS_SCHEMA_VERSION,
      release_version: RELEASE_VERSION,
    });
    contextRegistered = true;
  } catch { /* analytics never blocks */ }
}

export function cleanProps(props = {}) {
  const out = {};
  for (const [k, v] of Object.entries(props || {})) {
    const type = ALLOWED[k];
    if (!type || v == null) continue;
    if (type === 'enum_surface' && SURFACES.has(String(v))) out[k] = String(v);
    else if (type === 'id' && ID.test(String(v))) out[k] = String(v);
    else if (type === 'count' && Number.isFinite(Number(v)) && Number(v) >= 0) out[k] = Math.round(Number(v));
    else if (type === 'bool') out[k] = Boolean(v);
  }
  return out;
}

export function trackEvent(name, props = {}) {
  if (!Object.values(EVENTS).includes(name)) return;
  ensureAnalyticsContext();
  try { client.capture(name, cleanProps(props)); } catch { /* analytics never blocks */ }
}

const store = {
  get(k) { try { return window.localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const K_QUIZ = 'ayna:an:quiz_started_at';
const K_FIRST_MATCH = 'ayna:an:first_match_done';
const K_FIRST_OPEN = 'ayna:an:first_open_day';
const K_LAST_OPEN = 'ayna:an:last_open_day';
const K_CHECKINS = 'ayna:an:checkin_days';
const seen = new Set();

export function trackQuizStarted({ surface, signed_in = false } = {}) {
  store.set(K_QUIZ, String(Date.now()));
  trackEvent(EVENTS.QUIZ_STARTED, { surface, signed_in });
}

export function trackFirstMatchShown({ surface, matches_count = 0 } = {}) {
  if (store.get(K_FIRST_MATCH)) return;
  store.set(K_FIRST_MATCH, '1');
  const started = Number(store.get(K_QUIZ));
  const seconds = started > 0 ? Math.max(0, Math.round((Date.now() - started) / 1000)) : undefined;
  trackEvent(EVENTS.FIRST_MATCH_SHOWN, { surface, matches_count, seconds_to_match: seconds });
}

export function trackAppOpened({ surface, signed_in = false } = {}, now = new Date()) {
  ensureAnalyticsContext();
  installPr88InteractionTracking();
  const today = localDayKey(now);
  if (store.get(K_LAST_OPEN) === today) return;
  store.set(K_LAST_OPEN, today);
  let first = store.get(K_FIRST_OPEN);
  if (!first) { first = today; store.set(K_FIRST_OPEN, today); }
  trackEvent(EVENTS.APP_OPENED, { surface, signed_in, days_since_first_open: Math.max(0, localDaysBetween(first, today) || 0) });
}

export function trackCheckin({ surface, where = 'today' } = {}, now = new Date()) {
  const today = localDayKey(now);
  let days = [];
  try { days = JSON.parse(store.get(K_CHECKINS) || '[]'); } catch { days = []; }
  days = [...new Set([...days.filter((d) => typeof d === 'string' && localDaysBetween(d, today) < 7 && localDaysBetween(d, today) >= 0), today])];
  store.set(K_CHECKINS, JSON.stringify(days));
  trackEvent(EVENTS.CHECKIN_LOGGED, { surface, where, checkins_this_week: days.length });
}

export function trackNotificationPrompt({ surface, granted, prompt = 'after_rundown' } = {}) {
  trackEvent(EVENTS.NOTIFICATION_PROMPT_ANSWERED, { surface, granted, prompt });
}

export function trackCardViewed({ surface, where, product_id, position } = {}) {
  const key = `${surface}:${where}:${product_id}`;
  if (!product_id || seen.has(key)) return;
  seen.add(key);
  trackEvent(EVENTS.PRODUCT_CARD_VIEWED, { surface, where, product_id, position });
}

export function trackCardClicked({ surface, where, product_id, position } = {}) {
  trackEvent(EVENTS.PRODUCT_CARD_CLICKED, { surface, where, product_id, position });
}

export function trackPdpViewed({ surface, product_id, review_count = 0 } = {}) {
  trackEvent(EVENTS.PDP_VIEWED, { surface, product_id, review_count, has_5_reviews: review_count >= 5 });
}

export function trackPdpRetailerClicked({ surface, product_id, retailer } = {}) {
  trackEvent(EVENTS.PDP_RETAILER_CLICKED, { surface, product_id, retailer });
}

export function eventSurface() {
  if (typeof window === 'undefined') return 'web';
  if (window.Capacitor?.isNativePlatform?.() || window.location?.pathname?.startsWith('/mobile-preview')) return 'app';
  return window.matchMedia?.('(max-width: 767px)').matches ? 'mobile_web' : 'web';
}

/** Small PR88 interaction layer. Never sends button text or input contents. */
export function installPr88InteractionTracking(doc = globalThis.document) {
  if (domTrackingInstalled || !doc?.addEventListener) return;
  domTrackingInstalled = true;
  const once = new Set();

  doc.addEventListener('focusin', (event) => {
    const input = event.target?.closest?.('.ay-set-search input');
    if (!input || once.has('settings_search_started')) return;
    once.add('settings_search_started');
    trackEvent(EVENTS.SETTINGS_SEARCH_STARTED, { surface: 'settings' });
  }, true);

  doc.addEventListener('submit', (event) => {
    if (!event.target?.matches?.('.ay-askp-composer')) return;
    trackEvent(EVENTS.ASK_QUESTION_SUBMITTED, { surface: 'ask' });
  }, true);

  doc.addEventListener('click', (event) => {
    const target = event.target?.closest?.('button,a');
    if (!target) return;
    const path = globalThis.location?.pathname || '';

    if (path === '/' && target.closest?.('.wl-sts')) {
      trackEvent(EVENTS.LANDING_PRIMARY_CTA_CLICKED, { surface: 'landing' });
    } else if (path === '/' && target.matches?.('.wl-how')) {
      trackEvent(EVENTS.LANDING_HOW_MATCHING_CLICKED, { surface: 'landing' });
    } else if (path === '/' && target.getAttribute?.('href')?.startsWith('/pro')) {
      trackEvent(EVENTS.LANDING_PRO_CTA_CLICKED, { surface: 'landing' });
    }

    if (target.matches?.('.ay-hsn__why')) {
      trackEvent(EVENTS.HEALTH_SHAPING_WHY_CLICKED, { surface: 'health' });
    }
    if (target.matches?.('.ay-hsn__cta')) {
      trackEvent(EVENTS.HEALTH_SHAPING_CONNECT_CLICKED, { surface: 'health' });
    }

    const settingCard = target.closest?.('.ay-set-card');
    if (settingCard && doc.querySelector?.('.ay-set-search input')?.value) {
      const group = target.closest?.('.ay-set-group')?.querySelector?.('h2')?.textContent || '';
      trackEvent(EVENTS.SETTINGS_SEARCH_RESULT_CLICKED, {
        surface: 'settings',
        setting_group: analyticsId(group),
      });
    }
  }, true);
}
