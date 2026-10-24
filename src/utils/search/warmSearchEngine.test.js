import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('warmSearchEngine', () => {
  it('spreads product profiling over many short idle slices instead of one long task', async () => {
    const queue = [];
    vi.stubGlobal('window', {
      requestIdleCallback: (fn) => { queue.push(fn); return queue.length; },
      cancelIdleCallback: () => {},
    });
    const { warmSearchEngine } = await import('./index.js');
    const { ALL_PRODUCTS } = await import('../../data/products.js');
    warmSearchEngine();
    let slices = 0;
    let worst = 0;
    while (queue.length && slices < 5000) {
      const fn = queue.shift();
      const t0 = performance.now();
      fn({ didTimeout: false, timeRemaining: () => 10 });
      const ms = performance.now() - t0;
      if (slices > 0) worst = Math.max(worst, ms); // slice 0 builds the engine
      slices += 1;
    }
    expect(queue.length).toBe(0);
    expect(slices).toBeGreaterThan(2);
    // Each slice stops at its 10ms budget after the product in hand. Allow
    // slow CI machines generous headroom; the old code was one ~1000ms task.
    expect(worst).toBeLessThan(400);
    expect(ALL_PRODUCTS.length).toBeGreaterThan(50);
  }, 120000);

  it('can be cancelled before it runs', async () => {
    const queue = [];
    const cancel = vi.fn();
    vi.stubGlobal('window', { requestIdleCallback: (fn) => { queue.push(fn); return 7; }, cancelIdleCallback: cancel });
    const { warmSearchEngine } = await import('./index.js');
    const stop = warmSearchEngine();
    stop();
    expect(cancel).toHaveBeenCalledWith(7);
    queue.shift()?.({ didTimeout: false, timeRemaining: () => 10 });
    expect(queue.length).toBe(0);
  });
});
