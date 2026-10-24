// "Onboarding just finished": set when she taps "See my Today" on the first
// reveal (app ReadyScreen, website WebIntake). Local to this device, no health
// details, never sent anywhere. Today's Rundown can read it to skip its
// auto-launch on that first visit instead of guessing from empty history.
export const ONBOARDING_DONE_KEY = 'ayna_onboarding_done_at';

export function markOnboardingDone(now = new Date(), storage = globalThis.localStorage) {
  try { storage?.setItem(ONBOARDING_DONE_KEY, now.toISOString()); } catch { /* storage unavailable */ }
}

/** ISO time setup finished on this device, or null. */
export function onboardingDoneAt(storage = globalThis.localStorage) {
  try { return storage?.getItem(ONBOARDING_DONE_KEY) || null; } catch { return null; }
}

/** True within `hours` of finishing setup (default 12). */
export function onboardingJustFinished({ now = Date.now(), hours = 12, storage = globalThis.localStorage } = {}) {
  const at = Date.parse(onboardingDoneAt(storage) || '');
  return Number.isFinite(at) && now - at >= 0 && now - at < hours * 3600e3;
}
