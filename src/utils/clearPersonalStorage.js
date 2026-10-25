/**
 * Called on logout. Removes personal and health-adjacent things this browser
 * kept for the signed-in person (ZIP, quiz draft, check-in date, chat trace,
 * pending sign-in hand-offs), so the next person on a shared computer sees
 * none of it. Account data lives on the server and is untouched. Things the
 * person would lose for good if removed here (local reviews, shelf layout)
 * and plain UI preferences (theme, analytics choice, caches) are kept.
 * Reading history is already stored per account (see Articles.jsx).
 */
// Her own on-device records, kept per account (src/health/ownedStore.js), so
// nothing unsynced is lost. Signing out switches them to the signed-out
// (device) bucket below, which signing in had emptied into hers, so the next person on this computer sees none of it.
export const OWNED_KEYS = ['ayna_daily_log_v1', 'ayna_tries_v1', 'ayna_today_v1', 'ayna_routine_plan_v1', 'ayna_saved_reminders_v1', 'ayna_rundown_v1', 'ayna_home_layout_v1', 'ayna_tour_v1'];
// Keyed by account id inside the value (src/mobile/utils/aynaGuide.js).
const KEEP_PER_ACCOUNT = ['ayna_guide_v1'];
const KEEP = new Set([
  'ayna_v6_site_theme', 'ayna_v6_quiz_theme', 'ayna_analytics_consent', 'ayna_product_catalog_v4',
  'ayna_product_images_v11', 'ayna_chunk_reload_attempted', 'ayna_internal_analytics_v1', 'ayna_ask_tucked_v1',
  'ayna.powderroom.seen', 'ayna_reviews', 'ayna_web_quiz_intro_seen', 'ayna_motion_paused', 'ayna_web_theme_v1', 'ayna_mobile_theme_v1', 'ayna_mobile_theme_pick_v2',
  ...OWNED_KEYS, ...KEEP_PER_ACCOUNT,
]);
const KEEP_PREFIX = ['ayna_read_progress_v1:', 'ayna.drawers.v1:', 'ayna_community_draft_v1:'];
const isGuestKey = (k) => k.endsWith(':guest') || k.includes(':guest:');
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
    if (KEEP.has(k) || KEEP_QUEUES.has(k) || KEEP_PREFIX.some((p) => k.startsWith(p) && !isGuestKey(k))) continue;
    if (inTab && KEEP_IN_TAB_PREFIX.some((p) => k.startsWith(p))) continue;
    try { store.removeItem(k); } catch { /* storage blocked */ }
  }
}

// Point each kept per-account store at the (empty) signed-out bucket, so
// nothing of hers is read back until she signs in again.
function toDeviceOwner(store) {
  if (!store) return;
  for (const k of OWNED_KEYS) {
    try {
      const raw = store.getItem(k);
      if (!raw) continue;
      const v = JSON.parse(raw);
      if (!v || typeof v !== 'object' || Array.isArray(v)) { store.removeItem(k); continue; }
      if (v.owner !== 'device') store.setItem(k, JSON.stringify({ ...v, owner: 'device' }));
    } catch { /* storage blocked or unreadable */ }
  }
}

export function clearPersonalStorage() {
  try { sweep(window.localStorage); } catch { /* storage unavailable */ }
  try { toDeviceOwner(window.localStorage); } catch { /* storage unavailable */ }
  try { sweep(window.sessionStorage, true); } catch { /* storage unavailable */ }
}

export default clearPersonalStorage;
