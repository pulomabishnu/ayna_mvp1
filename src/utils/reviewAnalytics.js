import posthog from 'posthog-js';

/**
 * Product review and withheld-match events (matching P0, Oct 29).
 *
 * PRIVATE HEALTH DATA NEVER GOES TO POSTHOG. These events carry only:
 *   product_id, hold_state (a product-side state, or 'profile' when the hold
 *   is waiting on her answers, never WHICH answer), surface, review_id,
 *   outcome, and counts. No needs, stages, medicines, allergies, conditions,
 *   reason text or missing-field codes. Anything else passed in is dropped.
 *
 * Events:
 *   match_score_withheld       a hold was shown instead of a percent
 *   product_review_required    a hold that only a product review can clear
 *   product_review_assigned / _started / _completed / _reopened / _expired
 *                              staff-side queue lifecycle (product_review_queue)
 */
export const REVIEW_EVENTS = [
  'match_score_withheld', 'product_review_required', 'product_review_assigned',
  'product_review_started', 'product_review_completed', 'product_review_reopened', 'product_review_expired',
];
const PRODUCT_STATES = new Set(['researching', 'in_review', 'verified_unknown']);
const ALLOWED = new Set(['product_id', 'hold_state', 'surface', 'review_id', 'outcome', 'status', 'days_open']);
const SURFACE = /^[a-z0-9_]{1,40}$/;

/** The only state that leaves the device: product states as-is, anything about her as 'profile'. */
export function publicHoldState(state) {
  return PRODUCT_STATES.has(state) ? state : 'profile';
}

/** Allow-listed, length-limited properties. Exported for tests. */
export function reviewEventProps(props = {}) {
  const out = {};
  for (const [k, v] of Object.entries(props || {})) {
    if (!ALLOWED.has(k) || v == null) continue;
    if (k === 'hold_state') out[k] = publicHoldState(v);
    else if (k === 'surface') { if (SURFACE.test(String(v))) out[k] = String(v); }
    else if (k === 'days_open') { const n = Number(v); if (Number.isFinite(n)) out[k] = Math.max(0, Math.round(n)); }
    else out[k] = String(v).slice(0, 64);
  }
  return out;
}

function capture(event, props) {
  if (!REVIEW_EVENTS.includes(event)) return;
  try { posthog.capture(event, reviewEventProps(props)); } catch { /* analytics never blocks */ }
}

const seen = new Set();
/** A hold shown instead of a percent: once per product, state and surface per page load. */
export function trackMatchWithheld({ productId, state, surface = 'unknown' }) {
  if (!productId) return;
  const key = `${surface}:${productId}:${state}`;
  if (seen.has(key)) return;
  seen.add(key);
  capture('match_score_withheld', { product_id: productId, hold_state: state, surface });
  if (state === 'researching' || state === 'in_review') capture('product_review_required', { product_id: productId, hold_state: state, surface });
}

/** Staff-side queue lifecycle (for the review tool). */
export function trackReviewLifecycle(step, { productId, reviewId, outcome, status, daysOpen } = {}) {
  capture(`product_review_${step}`, { product_id: productId, review_id: reviewId, outcome, status, days_open: daysOpen });
}

/** Tests only. */
export function _resetReviewEvents() { seen.clear(); }
