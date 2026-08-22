import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  subscribeToGeneration,
  discardGeneration,
  activeGenerations,
  GENERATION_ABANDON_GRACE_MS,
  peekGeneration,
  subscribeIfActive,
  notifyGeneration,
} from './ecosystemGenerationStore.js';

// Regression coverage for "ecosystem keeps resetting the timer when you leave the
// page": an in-flight generation must survive its last subscriber unmounting for
// as long as GENERATION_ABANDON_GRACE_MS, not just an instant remount. If this
// grace period regresses back toward a few seconds, these tests should fail.

describe('subscribeToGeneration abandonment grace period', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    activeGenerations.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the record (and its startedAt) alive across a real navigate-away well past an instant remount', () => {
    const fingerprint = 'test-fp-1';
    const onUpdate = vi.fn();
    let startedAtSeen = null;

    const unsubscribe = subscribeToGeneration(fingerprint, onUpdate, (rec) => {
      rec.startedAt = Date.now();
      rec.loading = true;
      startedAtSeen = rec.startedAt;
    });

    expect(activeGenerations.has(fingerprint)).toBe(true);
    const rec = activeGenerations.get(fingerprint);
    expect(rec.cancelled).toBe(false);

    // Leave the page.
    unsubscribe();

    // Old behavior aborted at 3000ms — 60s of "browsing Discovery" must NOT
    // trigger the abandon-and-abort path.
    vi.advanceTimersByTime(60_000);
    expect(rec.cancelled).toBe(false);
    expect(activeGenerations.get(fingerprint)).toBe(rec);

    // Come back — re-subscribing should attach to the SAME record, so the
    // displayed elapsed time continues instead of resetting to 0.
    const onUpdate2 = vi.fn();
    subscribeToGeneration(fingerprint, onUpdate2, () => {
      throw new Error('onStart should not fire — an existing record should be reused, not restarted');
    });
    expect(activeGenerations.get(fingerprint)).toBe(rec);
    expect(rec.startedAt).toBe(startedAtSeen);
  });

  it('still eventually cleans up a truly abandoned generation after the full grace period', () => {
    const fingerprint = 'test-fp-2';
    const unsubscribe = subscribeToGeneration(fingerprint, vi.fn(), (rec) => {
      rec.controller = { abort: vi.fn() };
      rec.loading = true;
    });
    const rec = activeGenerations.get(fingerprint);

    unsubscribe();
    vi.advanceTimersByTime(GENERATION_ABANDON_GRACE_MS + 1);

    expect(rec.cancelled).toBe(true);
    expect(rec.controller.abort).toHaveBeenCalled();
    expect(activeGenerations.has(fingerprint)).toBe(false);
  });

  it('a resubscribe before the grace period expires cancels the pending abandon', () => {
    const fingerprint = 'test-fp-3';
    const unsubscribe = subscribeToGeneration(fingerprint, vi.fn(), (rec) => {
      rec.controller = { abort: vi.fn() };
    });
    const rec = activeGenerations.get(fingerprint);

    unsubscribe();
    vi.advanceTimersByTime(GENERATION_ABANDON_GRACE_MS - 1000);
    subscribeToGeneration(fingerprint, vi.fn(), () => {
      throw new Error('should not restart — record is still alive');
    });

    // Even once the *original* grace window would have elapsed, nothing
    // should abort — the resubscribe cancelled the pending gcTimer.
    vi.advanceTimersByTime(5000);
    expect(rec.cancelled).toBe(false);
    expect(rec.controller.abort).not.toHaveBeenCalled();
  });

  it('discardGeneration aborts and removes the record immediately, ignoring the grace period', () => {
    const fingerprint = 'test-fp-4';
    subscribeToGeneration(fingerprint, vi.fn(), (rec) => {
      rec.controller = { abort: vi.fn() };
    });
    const rec = activeGenerations.get(fingerprint);

    discardGeneration(fingerprint);

    expect(rec.cancelled).toBe(true);
    expect(rec.controller.abort).toHaveBeenCalled();
    expect(activeGenerations.has(fingerprint)).toBe(false);
  });
});

// Coverage for the passive-observer path a global "generation in progress"
// UI needs: it must be able to tell whether a generation is running and get
// live updates, WITHOUT ever being capable of starting one itself (unlike
// subscribeToGeneration, which creates a record and fires onStart the first
// time anyone asks about a fingerprint with no existing record).
describe('peekGeneration / subscribeIfActive (passive observation)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    activeGenerations.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('peekGeneration returns null for a fingerprint with no active generation, and never creates one', () => {
    expect(peekGeneration('nothing-here')).toBe(null);
    expect(activeGenerations.has('nothing-here')).toBe(false);
  });

  it('peekGeneration returns the live record once one exists', () => {
    subscribeToGeneration('fp', vi.fn(), (rec) => { rec.loading = true; });
    const rec = peekGeneration('fp');
    expect(rec).toBe(activeGenerations.get('fp'));
    expect(rec.loading).toBe(true);
  });

  it('subscribeIfActive returns null and subscribes nothing when no generation is active', () => {
    const onUpdate = vi.fn();
    const unsub = subscribeIfActive('nothing-here', onUpdate);
    expect(unsub).toBe(null);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(activeGenerations.has('nothing-here')).toBe(false);
  });

  it('subscribeIfActive attaches to an already-active generation and receives live updates', () => {
    subscribeToGeneration('fp', vi.fn(), (rec) => { rec.loading = true; });
    const onUpdate = vi.fn();
    const unsub = subscribeIfActive('fp', onUpdate);
    expect(typeof unsub).toBe('function');
    // Called synchronously with current state, same as subscribeToGeneration.
    expect(onUpdate).toHaveBeenCalledTimes(1);

    const rec = activeGenerations.get('fp');
    rec.loading = false;
    notifyGeneration(rec);
    expect(onUpdate).toHaveBeenCalledTimes(2);
  });

  it('subscribeIfActive never fires an onStart-style side effect — there is no such parameter to call', () => {
    // subscribeToGeneration's 3rd arg (onStart) only fires for a NEW record.
    // subscribeIfActive has no such parameter at all, so there is nothing
    // that could ever kick off a generation via this path — asserting the
    // function arity is a cheap guard against someone re-adding one later.
    expect(subscribeIfActive.length).toBe(2);
  });

  it('subscribeIfActive respects the same abandonment grace period as subscribeToGeneration', () => {
    // Both subscribers must actually leave for the record to be eligible for
    // GC — leaving the original subscribeToGeneration caller attached would
    // keep rec.subscribers non-empty and mask what subscribeIfActive's own
    // unsubscribe does.
    const unsubOriginal = subscribeToGeneration('fp', vi.fn(), (rec) => { rec.controller = { abort: vi.fn() }; rec.loading = true; });
    const rec = activeGenerations.get('fp');
    const unsub = subscribeIfActive('fp', vi.fn());

    unsubOriginal();
    unsub();
    vi.advanceTimersByTime(GENERATION_ABANDON_GRACE_MS - 1000);
    expect(activeGenerations.has('fp')).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(rec.cancelled).toBe(true);
    expect(activeGenerations.has('fp')).toBe(false);
  });
});
