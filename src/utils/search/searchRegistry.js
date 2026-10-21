// Where the search engine (index.js) announces itself when it has run, so the
// lazy wrappers (lazy.js) see it whichever chunk loaded it. No imports.
let api = null;
const listeners = new Set();

export function provideSearch(next) {
  if (api) return;
  api = next;
  listeners.forEach((fn) => { try { fn(); } catch { /* keep notifying */ } });
}

export function searchNow() { return api; }

export function subscribeSearch(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
