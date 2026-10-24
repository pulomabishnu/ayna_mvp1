// Where products.js announces itself when it has run (see data/catalog.js).
// No imports: products.js and the site shell both depend on this file, and
// it must stay tiny because the shell ships it in the entry chunk.
let catalog = null;
const listeners = new Set();

/** Called once by products.js, with the parts of its API the site shell uses. */
export function provideCatalog(api) {
  if (catalog) return;
  catalog = api;
  listeners.forEach((fn) => { try { fn(); } catch { /* one listener never stops the rest */ } });
}

/** The catalog API, or null until products.js has run. */
export function catalogNow() { return catalog; }

export function subscribeCatalog(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
