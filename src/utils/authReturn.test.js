// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeReturnPath, rememberReturnTo, takeReturnTo, restoreAfterSignIn } from './authReturn.js';

describe('safeReturnPath', () => {
  it('keeps same-origin pages and drops the landing, callbacks and other sites', () => {
    expect(safeReturnPath('/admin/reviews')).toBe('/admin/reviews');
    expect(safeReturnPath('/partner-studio.html?brand=Neycher&view=share')).toBe('/partner-studio.html?brand=Neycher&view=share');
    expect(safeReturnPath('/')).toBeNull();
    expect(safeReturnPath('/?x=1')).toBeNull();
    expect(safeReturnPath('/auth/callback?code=1')).toBeNull();
    expect(safeReturnPath('/quiz')).toBeNull();
    expect(safeReturnPath('/mobile-preview')).toBeNull();
    expect(safeReturnPath('//evil.com/x')).toBeNull();
    expect(safeReturnPath('/\\evil.com')).toBeNull();
    expect(safeReturnPath('https://evil.com')).toBeNull();
    expect(safeReturnPath(null)).toBeNull();
  });
});

describe('remember and take', () => {
  beforeEach(() => { window.sessionStorage.clear(); window.history.replaceState(null, '', '/admin/research?tab=2'); });
  it('round-trips once', () => {
    expect(rememberReturnTo(window, 1000)).toBe('/admin/research?tab=2');
    expect(takeReturnTo(window, 2000)).toBe('/admin/research?tab=2');
    expect(takeReturnTo(window, 2000)).toBeNull();
  });
  it('expires after 30 minutes', () => {
    rememberReturnTo(window, 0);
    expect(takeReturnTo(window, 31 * 60 * 1000)).toBeNull();
  });
  it('clears the slot when signing in from the landing', () => {
    rememberReturnTo(window, 0);
    window.history.replaceState(null, '', '/');
    expect(rememberReturnTo(window, 0)).toBeNull();
    expect(takeReturnTo(window, 1)).toBeNull();
  });
});

describe('restoreAfterSignIn', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  it('puts her back when the app bounces to the landing', () => {
    window.history.replaceState(null, '', '/admin/reviews');
    const pop = vi.fn();
    window.addEventListener('popstate', pop);
    restoreAfterSignIn('/admin/reviews');
    window.history.replaceState(null, '', '/');
    vi.advanceTimersByTime(150);
    expect(window.location.pathname).toBe('/admin/reviews');
    expect(pop).toHaveBeenCalledTimes(1);
    window.removeEventListener('popstate', pop);
  });
  it('leaves a deliberate destination alone', () => {
    window.history.replaceState(null, '', '/discovery');
    restoreAfterSignIn('/discovery');
    window.history.replaceState(null, '', '/you/saved');
    vi.advanceTimersByTime(3000);
    expect(window.location.pathname).toBe('/you/saved');
  });
  it('stops watching after the wait', () => {
    window.history.replaceState(null, '', '/admin/topics');
    restoreAfterSignIn('/admin/topics', { waitMs: 500 });
    vi.advanceTimersByTime(800);
    window.history.replaceState(null, '', '/');
    vi.advanceTimersByTime(800);
    expect(window.location.pathname).toBe('/');
  });
});
