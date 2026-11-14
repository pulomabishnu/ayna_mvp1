import { describe, it, expect, vi } from 'vitest';
import { CHUNK_RELOAD_KEY, STABLE_AFTER_MS, claimChunkReload, isChunkLoadError, scheduleChunkReloadReset } from './chunkReload.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

describe('chunkReload', () => {
  it('recognizes stale-deploy errors from each browser', () => {
    expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module: https://x/a.js'))).toBe(true);
    expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true);
    expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError(new Error('Unable to preload CSS for /assets/a.css'))).toBe(true);
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
  });

  it('allows one reload, then refuses until the page has stayed up', () => {
    const s = memoryStorage();
    expect(claimChunkReload(s)).toBe(true);
    // After the reload the boundary mounts again; a second failure must not reload.
    expect(claimChunkReload(s)).toBe(false);
    expect(claimChunkReload(s)).toBe(false);
  });

  it('clears the flag only after the page stays up, so a later deploy gets its own reload', () => {
    vi.useFakeTimers();
    const s = memoryStorage();
    claimChunkReload(s);
    scheduleChunkReloadReset(s);
    vi.advanceTimersByTime(STABLE_AFTER_MS - 1);
    expect(s.getItem(CHUNK_RELOAD_KEY)).toBe('1');
    vi.advanceTimersByTime(1);
    expect(s.getItem(CHUNK_RELOAD_KEY)).toBe(null);
    expect(claimChunkReload(s)).toBe(true);
    vi.useRealTimers();
  });

  it('never reloads when storage is missing or broken (would loop)', () => {
    expect(claimChunkReload(null)).toBe(false);
    const throwing = { getItem: () => { throw new Error('denied'); }, setItem: () => {}, removeItem: () => {} };
    expect(claimChunkReload(throwing)).toBe(false);
    const silent = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    expect(claimChunkReload(silent)).toBe(false);
  });
});
