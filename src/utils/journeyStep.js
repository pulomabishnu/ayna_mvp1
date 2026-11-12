import { Capacitor } from '@capacitor/core';
import { apiUrl } from './apiUrl.js';
import { buyCountingRefused } from './productEventProps.js';
import { hasPersistedInternalBrowserMarker } from './founderAnalytics.js';
import { analyticsPlatform } from './analyticsPlatform.js';

/**
 * Anonymous journey step counter (same design as the Buy counter,
 * productEventProps.js countBuyClick). Tells /api/step "one visitor reached
 * this step on this platform". Only the step name and platform are sent: no
 * cookie, no account, no analytics id, no referrer. Stored as a daily count
 * per step in public.journey_step_daily.
 *
 * Runs before a consent choice and after Turn on. Nothing is sent after Keep
 * off, an account/app opt-out, or with Global Privacy Control
 * (buyCountingRefused), nor from founder browsers and test phones.
 * Fire-and-forget: never blocks or breaks the page.
 */
/**
 * Landing page buttons and links (2026-11-11), one step each. Counted on a
 * normal click only; the same skip rules as every other step. The main
 * "Sign up free" button still also counts as sign_up_free_clicked.
 */
export const LANDING_CTA_STEPS = [
  // Top bar, while the landing page is open.
  'cta_signup_topbar', 'cta_login_topbar', 'cta_pricing_topbar', 'cta_shop_topbar', 'cta_library_topbar', 'cta_community_topbar', 'cta_ask_topbar', 'cta_cart_topbar',
  // The main "Sign up free" button, by where on the page it was pressed.
  'cta_signup_hero', 'cta_signup_problem', 'cta_signup_demo', 'cta_signup_testimonials', 'cta_signup_end',
  // The main button when it says something else, and "Start over" under it.
  'cta_finish_quiz', 'cta_start_over', 'cta_go_home',
  // Everything else on the page.
  'cta_search', 'cta_brands', 'cta_how_we_match', 'cta_see_all_products', 'cta_product_card', 'cta_sources', 'cta_library', 'cta_read_article', 'cta_community', 'cta_meet_us', 'cta_get_pro', 'cta_pro_yearly', 'cta_pro_monthly', 'cta_see_pro', 'cta_faq_ask_us',
];
export const JOURNEY_STEPS = new Set(['landed', 'sign_up_free_clicked', 'quiz_started', 'quiz_completed', 'health_connected', 'account_created', ...LANDING_CTA_STEPS]);

function currentPlatform() {
  try {
    const p = analyticsPlatform(Capacitor.isNativePlatform(), Capacitor.getPlatform());
    return p === 'ios_app' || p === 'android_app' ? p : 'web';
  } catch { return 'web'; }
}

export function countJourneyStep(step) {
  if (!JOURNEY_STEPS.has(step)) return;
  try {
    if (buyCountingRefused()) return;
    if (hasPersistedInternalBrowserMarker()) return;
    if (typeof fetch !== 'function') return;
    // Not sendBeacon: a beacon always carries the site's cookies.
    fetch(apiUrl('/api/step'), {
      method: 'POST',
      body: JSON.stringify({ s: step, pl: currentPlatform() }),
      headers: { 'Content-Type': 'text/plain' },
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    }).catch(() => {});
  } catch { /* the counter never blocks the page */ }
}

/**
 * Is this page load the first of a visit? Uses no storage: a reload, or a
 * full page load that came from another ayna page, is not a new visit. The
 * app counts each cold start (main.jsx runs once per launch).
 */
export function isFirstLoadOfVisit({ doc = typeof document !== 'undefined' ? document : undefined, perf = typeof performance !== 'undefined' ? performance : undefined, isNative = false } = {}) {
  if (isNative) return true;
  try {
    const nav = perf?.getEntriesByType?.('navigation')?.[0];
    if (nav?.type === 'reload' || nav?.type === 'back_forward') return false;
  } catch { /* old browser: fall through */ }
  try {
    const ref = doc?.referrer ? new URL(doc.referrer) : null;
    const here = doc?.location?.hostname || '';
    if (ref && here && ref.hostname.replace(/^www\./, '') === here.replace(/^www\./, '')) return false;
  } catch { /* bad referrer: treat as a new visit */ }
  return true;
}

let landedSent = false;
/** Tests only. */
export function resetLandedForTests() { landedSent = false; }
/** "landed": once per page load, only for the first load of a visit. */
export function countLanded(opts = {}) {
  if (landedSent) return;
  landedSent = true;
  let native = false;
  try { native = Capacitor.isNativePlatform(); } catch { /* web */ }
  if (isFirstLoadOfVisit({ ...opts, isNative: native })) countJourneyStep('landed');
}
