/**
 * posthogInternal.js
 *
 * Handles automatic tagging of internal/developer
 * sessions in PostHog so they can be filtered out
 * of analytics without requiring login.
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
 * HOW TO ADD A NEW INTERNAL USER:
 * 1. Have them visit the live Ayna site once
 * 2. Open browser console and run: posthog.get_distinct_id()
 * 3. Copy the returned string
 * 4. Add it to VITE_POSTHOG_INTERNAL_IDS in Vercel
 *    environment variables (comma-separated)
 * 5. Redeploy — they will be tagged automatically
 *    on their next visit, logged in or not
 *
 * HOW TO VERIFY IT IS WORKING:
 * 1. Open browser console on the live site
 * 2. Run: posthog.get_distinct_id()
 * 3. Confirm that ID is in VITE_POSTHOG_INTERNAL_IDS
 * 4. Run: posthog.get_property('is_internal')
 * 5. Confirm it returns true
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
