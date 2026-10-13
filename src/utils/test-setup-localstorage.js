// This repo's vitest runs with `environment: 'node'` (vite.config.js), and
// Node has no global `localStorage` — verified on Node 24, which is what this
// project builds on. Imported by analyticsConsent.test.js so the consent
// module's real storage path can be exercised without pulling in jsdom or a
// whole new test style for one module.
if (typeof localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}
