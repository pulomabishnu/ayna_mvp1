import { ALL_PRODUCTS, withResearch } from '../data/products.js';
import { loadResearch } from '../data/researchLoader.js';
import { evidenceFor } from '../components/pdp/evidenceLevels.js';

/**
 * How many catalog products have at least one source at each evidence level
 * (the same evidenceFor the product page uses), counted live. The research
 * file loads on demand and the count runs in small slices so the page never
 * freezes. Used by How it works ("Evidence, by level").
 */
let cached = null;
let pending = null;
const tick = () => new Promise((r) => setTimeout(r, 0));

export function evidenceCatalogCounts() {
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;
  pending = loadResearch().then(async (research) => {
    const c = { total: ALL_PRODUCTS.length, gov: 0, peer: 0, brand: 0, people: 0 };
    for (let i = 0; i < ALL_PRODUCTS.length; i += 1) {
      const e = evidenceFor(withResearch(ALL_PRODUCTS[i], research || {}));
      for (const k of ['gov', 'peer', 'brand', 'people']) if (e.counts[k] > 0) c[k] += 1;
      if (i % 20 === 19) await tick();
    }
    cached = c;
    return c;
  }).catch(() => { pending = null; return null; });
  return pending;
}
