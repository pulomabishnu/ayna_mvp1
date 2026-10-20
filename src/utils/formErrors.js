/**
 * Shared helpers for required-field errors on the sign-up forms (app and
 * website). Founder feedback, 2026-10: tapping "Create my account" with a
 * box unticked gave one vague line, so she couldn't tell what was wrong.
 * Now every missing field gets its own inline message, the first one is
 * scrolled to and focused, and a short summary sits by the button when more
 * than one thing is missing (NN/g + Baymard form-error guidance).
 */

/** The first error key, in the order the fields appear on screen. */
export function firstErrorKey(errors, order) {
  return order.find((key) => errors[key]) || null;
}

/** How many errors are still showing. */
export function countErrors(errors) {
  return Object.values(errors || {}).filter(Boolean).length;
}

/**
 * The line by the submit button. Only shown when more than one thing is
 * missing (a single miss already has its own message right where it is).
 * `boxKeys` are the checkbox keys, so an all-checkbox miss can say "boxes".
 */
export function errorSummary(errors, boxKeys = [], action = 'create your account') {
  const keys = Object.keys(errors || {}).filter((k) => errors[k]);
  if (keys.length < 2) return '';
  const allBoxes = keys.every((k) => boxKeys.includes(k));
  return allBoxes
    ? `Tick the ${keys.length} boxes above to ${action}.`
    : `Fix the ${keys.length} things marked above to ${action}.`;
}

/** Returns a copy of `errors` with `key` cleared (same object if nothing to clear). */
export function clearError(errors, key) {
  return errors[key] ? { ...errors, [key]: '' } : errors;
}

function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/**
 * Bring a field into the middle of the screen and put focus on it. Focus is
 * moved without a second scroll jump; reduced-motion users get an instant
 * scroll instead of a smooth one.
 */
export function revealField(el) {
  if (!el) return;
  try {
    el.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  } catch {
    el.scrollIntoView?.();
  }
  try { el.focus({ preventScroll: true }); } catch { el.focus?.(); }
}

/**
 * Warning haptic on native. @capacitor/haptics isn't a dependency of this
 * project yet, so this only fires if the plugin is registered on the native
 * side (Capacitor exposes it on window.Capacitor.Plugins); on the web and
 * without the plugin it does nothing.
 */
export function warnHaptic() {
  try {
    const cap = typeof window !== 'undefined' ? window.Capacitor : null;
    if (!cap?.isNativePlatform?.()) return;
    const haptics = cap.Plugins?.Haptics;
    haptics?.notification?.({ type: 'WARNING' })?.catch?.(() => {});
  } catch { /* no haptics, no problem */ }
}
