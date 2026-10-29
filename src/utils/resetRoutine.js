import { replaceRoutinePrefs } from '../health/routines.js';
import { ROUTINE_FOLLOWUPS_KEY } from '../health/routineFollowUps.js';

/**
 * "Reset my ecosystem" also resets her routine (founder, Oct 29): the
 * routine plan, which time of day each product sits in, and routine
 * follow-ups. Saved products, posts and check-ins are untouched.
 */
export const ECOSYSTEM_RESET_COPY = 'This resets your whole ecosystem: your recommended products, your routine and your quiz answers. Your saved products, posts and check-ins stay.';

export function resetRoutineData(storage = globalThis.localStorage) {
  try { replaceRoutinePrefs({}, storage); } catch { /* storage blocked */ }
  for (const key of ['ayna_routine_v1', ROUTINE_FOLLOWUPS_KEY]) {
    try { storage?.removeItem(key); } catch { /* storage blocked */ }
  }
}
