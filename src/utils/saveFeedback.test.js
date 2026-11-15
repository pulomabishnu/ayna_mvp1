import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reportSaveFailed, trackSave, intakeFailed, batchFailed, failedLine, _resetSaveFeedback } from './saveFeedback.js';

const toasts = [];
beforeEach(() => {
  toasts.length = 0;
  _resetSaveFeedback();
  globalThis.window = globalThis;
  globalThis.dispatchEvent = (e) => { toasts.push(e.detail); return true; };
  globalThis.CustomEvent = class { constructor(t, o) { this.type = t; this.detail = o?.detail; } };
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('save feedback', () => {
  it('says it failed, that the phone kept it, and offers Try again', async () => {
    await trackSave(Promise.reject(new Error('x')), 'your routine', () => Promise.resolve());
    expect(toasts[0].text).toBe(failedLine('your routine'));
    expect(toasts[0].text).toMatch(/kept on this phone/);
    expect(toasts[0].action.label).toBe('Try again');
  });
  it('one toast for a burst of failures', () => {
    expect(reportSaveFailed('a', null, { now: 1000 })).toBe(true);
    expect(reportSaveFailed('b', null, { now: 2000 })).toBe(false);
    expect(reportSaveFailed('c', null, { now: 6000 })).toBe(true);
  });
  it('resolved { error } and custom failure checks count as failures; success is silent', async () => {
    await trackSave(Promise.resolve({ error: { message: 'rls' } }), 'x');
    _resetSaveFeedback();
    await trackSave(Promise.resolve({ synced: false }), 'y', null, batchFailed);
    expect(toasts).toHaveLength(2);
    _resetSaveFeedback(); toasts.length = 0;
    await trackSave(Promise.resolve({ synced: true }), 'z', null, batchFailed);
    expect(toasts).toHaveLength(0);
  });
  it('signed out is not a failure for answers', () => {
    expect(intakeFailed({ saved: false, reason: 'no_authenticated_user' })).toBe(false);
    expect(intakeFailed({ saved: false, reason: 'server_save_timeout' })).toBe(true);
    expect(intakeFailed({ saved: true })).toBe(false);
  });
  it('Try again that works says Saved', async () => {
    await trackSave(Promise.reject(new Error('x')), 'your routine', () => Promise.resolve({ synced: true }));
    toasts[0].action.onClick();
    await new Promise((r) => setTimeout(r, 0));
    expect(toasts.at(-1).text).toBe('Saved');
  });
});
