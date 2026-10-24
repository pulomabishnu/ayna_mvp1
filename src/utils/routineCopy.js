/**
 * Plain words for the ecosystem action on a product (team direction 23).
 * The data model is still "ecosystem" (myProducts, user_ecosystems); what
 * she reads is "Add to my routine". The first time she sees the button, one
 * line says what that means.
 */
export const ADD_TO_ROUTINE = 'Add to my routine';
export const IN_ROUTINE = 'In my routine';
export const ADDED_TO_ROUTINE = 'Added to your routine';
export const REMOVED_FROM_ROUTINE = 'Removed from your routine';
export const ROUTINE_EXPLAINER = 'Your routine keeps what you use, when to use it, and a quick check-in to see if it helps.';

const KEY = 'ayna_routine_explained_v1';

/** True until she has added something once (then the line stops showing). */
export function routineExplainerDue() {
  try { return !globalThis.localStorage?.getItem(KEY); } catch { return false; }
}

export function markRoutineExplained() {
  try { globalThis.localStorage?.setItem(KEY, '1'); } catch { /* storage blocked */ }
}

/** Toast text after an add: the explainer the first time, then just "Added to your routine". */
export function addedToRoutineText() {
  const first = routineExplainerDue();
  markRoutineExplained();
  return first ? `${ADDED_TO_ROUTINE}. ${ROUTINE_EXPLAINER}` : ADDED_TO_ROUTINE;
}
