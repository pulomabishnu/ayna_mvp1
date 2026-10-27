// The product page's hero, written into its prerendered HTML at build time
// (scripts/prerender.mjs, components/pdp/heroSeed.js). Read once; only used
// for the address it was written for.
let seed;

const norm = (p) => { try { return decodeURIComponent(String(p || '')).replace(/\/+$/, '').toLowerCase(); } catch { return String(p || '').toLowerCase(); } };

export function productSeedFor(pathname) {
  if (seed === undefined) {
    seed = null;
    try {
      const el = typeof document !== 'undefined' ? document.getElementById('ay-product-seed') : null;
      if (el) seed = JSON.parse(el.textContent || 'null');
    } catch { seed = null; }
  }
  return seed && seed.path && norm(seed.path) === norm(pathname) ? seed : null;
}
