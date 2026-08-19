import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { subscribeToGeneration, discardGeneration, activeGenerations, GENERATION_ABANDON_GRACE_MS } from './MyEcosystem.jsx';

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
