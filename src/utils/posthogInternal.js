/**
 * posthogInternal.js
 *
 * Handles automatic tagging of internal/developer
 * sessions in PostHog so they can be filtered out
 * of analytics without requiring login.
 *
 * CURRENT INTERNAL USERS:
 * Puloma — phone:              019f23fa-2ddc-7baf-b219-bf4b5c6dceb4
 * Puloma — laptop:             019f23fd-c46e-77a1-b38a-6198fa08a799
 * Eliz   — phone:              019f23f6-e815-77bc-ae5f-ce0421ef345c
 * Eliz   — laptop:             pending
 * Aditi (thakur.aditi0504@gmail.com), identified — Supabase auth.users.id:
 *                               78b66458-eb0e-4445-8e1a-8150c7db35aa
 * lalaloops99@gmail.com, identified — Supabase auth.users.id:
 *                               46adced4-68e8-4a60-97ee-1fad4aa32135
 *
 * Anonymous pre-login distinct IDs added 2026-08-25 — real internal testing
 * traffic (Aditi's/team's own pre-login browsing) that showed up heavily in
 * the PostHog event list under a raw anonymous UUID instead of an email,
 * skewing usage metrics. These are NOT stable: PostHog mints a fresh
 * anonymous ID whenever local storage is cleared or a new browser/device is
 * used, so this list will need new entries again whenever that happens —
 * it isn't a one-time fix the way an identified user's ID is.
 * 01a02d2f-4488-7fbf-acb3-67ccc38e8065
 * 01a02cb9-5061-7cb3-b910-67425fe5e71e
 * 01a0302d-a7ef-7e73-8a85-d8f4dc85f736
 *
 * HOW IT WORKS:
 * On every page load, this checks if the current
 * PostHog distinct ID matches any known internal
 * user ID stored in VITE_POSTHOG_INTERNAL_IDS.
 * If it matches, it sets { is_internal: true } on
 * the PostHog person profile. The PostHog filter in
 * Settings → Product Analytics → "Filter out internal
 * and test users" is configured to exclude any person
 * where is_internal equals true.
 *
 * HOW TO ADD ELIZ'S LAPTOP (or any future device):
 * 1. Visit the live Ayna site on that device
 * 2. Open browser console and run:
 *      posthog.get_distinct_id()
 * 3. Copy the returned string
 * 4. Go to Vercel → ayna_mvp1 → Settings →
 *    Environment Variables → find VITE_POSTHOG_INTERNAL_IDS
 *    → edit → append the new ID comma-separated
 * 5. Also update .env.local and .env.example here
 *    in this file's comment and in the env files
 * 6. Redeploy from Vercel Deployments tab
 * 7. No code changes needed — the env var is the
 *    single source of truth for all internal IDs
 *
 * HOW TO VERIFY A DEVICE IS FILTERED:
 * 1. Visit the live site on that device
 * 2. Open browser console
 * 3. Run: posthog.get_distinct_id()
 *    — confirm it matches one of the IDs above
 * 4. Run: posthog.get_property('is_internal')
 *    — should return true
 * 5. In PostHog → People → search that distinct ID
 *    — is_internal: true should appear in properties
 *
 * PRIVACY NOTE:
 * This file only touches PostHog person properties.
 * No health data is involved. No Supabase data is
 * accessed. This has no dependency on auth state.
 */

/**
 * Parses VITE_POSTHOG_INTERNAL_IDS into a Set of strings.
 * Returns an empty Set if the variable is not set.
 * @returns {Set<string>}
 */
export function getInternalIds() {
  const raw = import.meta.env.VITE_POSTHOG_INTERNAL_IDS || '';
  if (!raw.trim()) return new Set();
  return new Set(
    raw.split(',').map(id => id.trim()).filter(Boolean)
  );
}

/**
 * Tags the current PostHog visitor as internal if
 * their distinct ID is in the internal IDs list.
 * Safe to call multiple times — PostHog people.set
 * is idempotent. Safe to call before or after identify.
 *
 * @param {Object} ph - The PostHog instance
 * @returns {boolean} true if this visitor was tagged
 *                    as internal, false otherwise
 */
export function tagInternalUserIfNeeded(ph) {
  if (!ph) {
    console.warn('[Ayna/PostHog] tagInternalUserIfNeeded: no PostHog instance');
    return false;
  }

  const internalIds = getInternalIds();
  if (internalIds.size === 0) return false;

  let distinctId;
  try {
    distinctId = ph.get_distinct_id();
  } catch (e) {
    console.warn('[Ayna/PostHog] Could not get distinct ID:', e);
    return false;
  }

  if (!distinctId || !internalIds.has(distinctId)) return false;

  try {
    ph.people.set({ is_internal: true });
    if (import.meta.env.DEV) {
      console.info(
        '[Ayna/PostHog] Internal user detected — session tagged ' +
        'as is_internal: true and will be excluded from analytics.'
      );
    }
    return true;
  } catch (e) {
    console.warn('[Ayna/PostHog] Failed to set is_internal:', e);
    return false;
  }
}

/**
 * debugPosthogStatus()
 *
 * Run this in the browser console to instantly verify
 * whether PostHog is initialized and whether the current
 * session is tagged as internal.
 *
 * Usage:
 *   posthog.get_distinct_id()         — should return your known ID
 *   posthog.get_property('is_internal') — should return true
 *
 * @param {Object} ph - The PostHog instance
 */
export function debugPosthogStatus(ph) {
  if (!ph) {
    console.error('[Ayna/PostHog] PostHog instance is null or undefined. Not initialized.');
    return;
  }

  const distinctId = (() => {
    try { return ph.get_distinct_id(); }
    catch (e) { return `ERROR: ${e.message}`; }
  })();

  const isInternal = (() => {
    try { return ph.get_property('is_internal'); }
    catch (e) { return `ERROR: ${e.message}`; }
  })();

  const internalIds = getInternalIds();

  console.group('[Ayna/PostHog] Status Report');
  console.log('PostHog initialized:    ✅ yes');
  console.log('Distinct ID:           ', distinctId);
  console.log('is_internal property:  ', isInternal === true ? '✅ true (will be filtered from analytics)' : `❌ ${isInternal} (NOT filtered)`);
  console.log('ID in internal list:   ', internalIds.has(distinctId) ? '✅ yes' : '❌ no — add this ID to VITE_POSTHOG_INTERNAL_IDS');
  console.log('Internal IDs list:     ', [...internalIds]);
  console.groupEnd();

  if (!internalIds.has(distinctId)) {
    console.warn(
      '[Ayna/PostHog] This distinct ID is NOT in the internal list. ' +
      'Copy it and add to VITE_POSTHOG_INTERNAL_IDS in Vercel:\n' +
      distinctId
    );
  }
}
