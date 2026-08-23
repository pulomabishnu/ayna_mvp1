/**
 * Module-level (not component state) so an in-flight ecosystem generation
 * survives MyEcosystem unmounting and remounting — e.g. the component
 * re-rendering somewhere upstream, navigating to another page, or any other
 * transient reason the tree gets torn down mid-generation. Previously the
 * generation lived entirely in component state/refs, so a remount aborted
 * the in-flight fetch (killing serverless invocations already billed) and
 * any *new* mount started over from Date.now(), which is what made the
 * loading timer look like it "reset" and made a generation that was seconds
 * from finishing instead surface as a failure. Keyed by intake fingerprint;
 * a record's async work keeps running and notifying subscribers regardless
 * of which (if any) component instance is currently mounted and watching it.
 *
 * Originally lived in MyEcosystem.jsx; extracted so a second consumer (the
 * global EcosystemGenerationBar, which must observe an in-flight generation
 * from ANY page, not just My Ecosystem) reads the exact same Map instead of
 * a second, independent one that would never see MyEcosystem's generations.
 */
export const activeGenerations = new Map();

// How long an in-flight generation is kept alive after its last subscriber
// unmounts, before being aborted as abandoned. Generation itself is 4 batches
// of up to 3 concerns each, run concurrently, each within a 60s serverless
// ceiling — so total wall time is roughly one batch's worst case, well under
// 60s in practice. This used to be 3000ms, which only covered an instant
// remount (e.g. a re-render tearing the tree down and back up in the same
// tick). Any real "leave the page" — switching to Discovery, checking
// another tab, glancing away for half a minute — blew past 3s, so the
// in-flight (already-billed) generation got aborted and deleted, and
// returning to MyEcosystem started a brand new one from Date.now(), which is
// what read as "the timer keeps resetting when you leave the page." 5 minutes
// comfortably covers realistic in-app navigation while it's running, without
// leaking forever — a generation that finishes (success or failure) removes
// its own record immediately via the `finally` block below regardless of
// this timer, and a genuinely abandoned tab (closed, session ended) takes
// its whole JS heap — this Map included — with it anyway.
export const GENERATION_ABANDON_GRACE_MS = 5 * 60 * 1000;

export function notifyGeneration(rec) {
  rec.subscribers.forEach((fn) => fn(rec));
}

/**
 * Subscribe to (or start) the generation for `fingerprint`. Returns an
 * unsubscribe function. `onStart` is called synchronously if this caller is
 * the one that should actually run the generation (no one else already is).
 *
 * Only call this from the place that's actually allowed to KICK OFF a
 * generation (MyEcosystem's own effect). A passive observer that must never
 * start a generation itself (e.g. the global status bar) should use
 * `peekGeneration` + `subscribeIfActive` instead — see below.
 */
export function subscribeToGeneration(fingerprint, onUpdate, onStart) {
  let rec = activeGenerations.get(fingerprint);
  const isNew = !rec;
  if (isNew) {
    rec = { startedAt: 0, controller: null, cancelled: false, tiered: [], loading: false, error: '', partialConcerns: [], subscribers: new Set(), gcTimer: null };
    activeGenerations.set(fingerprint, rec);
  } else if (rec.gcTimer) {
    // A previous mount's cleanup was about to give up on this generation
    // (no subscribers left) — a new mount just showed up wanting it, so
    // cancel the pending abandon-and-abort.
    clearTimeout(rec.gcTimer);
    rec.gcTimer = null;
  }
  rec.subscribers.add(onUpdate);
  onUpdate(rec);
  if (isNew) onStart(rec);
  return () => {
    rec.subscribers.delete(onUpdate);
    if (rec.subscribers.size > 0) return;
    // Grace period, not an immediate abort: covers a remount AND genuine
    // in-app navigation away and back, without waiting forever on a
    // generation nobody will ever come back to watch (quiz retaken, tab
    // closed for good).
    rec.gcTimer = setTimeout(() => {
      if (rec.subscribers.size > 0) return;
      rec.controller?.abort();
      rec.cancelled = true;
      // Only remove the map entry if it's still *this* record — an
      // explicit refresh (discardGeneration) or a fresh start could have
      // already replaced it with a newer generation under the same key.
      if (activeGenerations.get(fingerprint) === rec) activeGenerations.delete(fingerprint);
    }, GENERATION_ABANDON_GRACE_MS);
  };
}

/** Abort and discard any existing record so a fresh one can start in its place. */
export function discardGeneration(fingerprint) {
  const rec = activeGenerations.get(fingerprint);
  if (!rec) return;
  if (rec.gcTimer) clearTimeout(rec.gcTimer);
  rec.controller?.abort();
  rec.cancelled = true;
  activeGenerations.delete(fingerprint);
}

/**
 * Read-only peek: is a generation currently active for this fingerprint?
 * Returns the record (or null) WITHOUT creating one and WITHOUT subscribing.
 * Used by passive observers (the global status bar) to poll for "has one
 * started yet" without racing subscribeToGeneration's create-if-missing
 * behavior — a component that must never itself trigger a generation should
 * never call subscribeToGeneration directly, since finding no record there
 * always creates one and calls onStart.
 */
export function peekGeneration(fingerprint) {
  if (!fingerprint) return null;
  return activeGenerations.get(fingerprint) || null;
}

/**
 * Subscribe to an ALREADY-ACTIVE generation, or do nothing if none exists.
 * Never creates a record and never calls an onStart-style callback — safe
 * for a passive, read-only observer. Returns an unsubscribe function, or
 * null if there was nothing to subscribe to (caller should poll again via
 * peekGeneration on some interval to notice a generation starting later).
 */
export function subscribeIfActive(fingerprint, onUpdate) {
  const rec = activeGenerations.get(fingerprint);
  if (!rec) return null;
  if (rec.gcTimer) {
    clearTimeout(rec.gcTimer);
    rec.gcTimer = null;
  }
  rec.subscribers.add(onUpdate);
  onUpdate(rec);
  return () => {
    rec.subscribers.delete(onUpdate);
    if (rec.subscribers.size > 0) return;
    rec.gcTimer = setTimeout(() => {
      if (rec.subscribers.size > 0) return;
      rec.controller?.abort();
      rec.cancelled = true;
      if (activeGenerations.get(fingerprint) === rec) activeGenerations.delete(fingerprint);
    }, GENERATION_ABANDON_GRACE_MS);
  };
}
