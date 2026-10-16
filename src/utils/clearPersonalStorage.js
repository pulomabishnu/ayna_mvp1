/**
 * Called on logout. Removes personal and health-adjacent things this browser
 * kept for the signed-in person (ZIP, quiz draft, check-in date, chat trace,
 * pending sign-in hand-offs), so the next person on a shared computer sees
 * none of it. Account data lives on the server and is untouched. Things the
 * person would lose for good if removed here (local reviews, shelf layout)
 * and plain UI preferences (theme, analytics choice, caches) are kept.
 * Reading history is already stored per account (see Articles.jsx).
 */
const KEEP = new Set([
  'ayna_v6_site_theme', 'ayna_v6_quiz_theme', 'ayna_analytics_consent', 'ayna_product_catalog_v4',
  'ayna_product_images_v11', 'ayna_chunk_reload_attempted', 'ayna_internal_analytics_v1', 'ayna_ask_tucked_v1',
  'ayna.powderroom.seen', 'ayna_reviews', 'ayna.drawers.v1', 'ayna_web_quiz_intro_seen', 'ayna_motion_paused', 'ayna_web_theme_v1', 'ayna_mobile_theme_v1',
]);
const KEEP_PREFIX = ['ayna_read_progress_v1:'];
// Unsynced copies: changes the server has not accepted yet are pushed again on
// her next sign-in. They are keyed to her account and live in this tab only
// (sessionStorage), so keeping them loses nothing and shows nothing to others.
const KEEP_IN_TAB_PREFIX = ['ayna_ecosystem_shadow_v2:', 'ayna_health_intake_v2:'];
const KEEP_QUEUES = new Set(['ayna_suggest_queue_v1', 'ayna_retailer_returns_v1']);

function sweep(store, inTab = false) {
  if (!store) return;
  const keys = [];
  for (let i = 0; i < store.length; i += 1) keys.push(store.key(i));
  for (const k of keys) {
    if (!k || !/^ayna/i.test(k)) continue;
    if (KEEP.has(k) || KEEP_QUEUES.has(k) || KEEP_PREFIX.some((p) => k.startsWith(p) && !k.endsWith(':guest'))) continue;
    if (inTab && KEEP_IN_TAB_PREFIX.some((p) => k.startsWith(p))) continue;
    try { store.removeItem(k); } catch { /* storage blocked */ }
  }
}

export function clearPersonalStorage() {
  try { sweep(window.localStorage); } catch { /* storage unavailable */ }
  try { sweep(window.sessionStorage, true); } catch { /* storage unavailable */ }
}

export default clearPersonalStorage;
