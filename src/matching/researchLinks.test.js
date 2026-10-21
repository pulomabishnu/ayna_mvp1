import { describe, it, expect } from 'vitest';
import NEED_MAP_RESEARCH from '../data/matching/needMap.research.js';
import NEED_MAP_JSON from '../data/matching/needMap.research.json';
import { CATALOG_PRODUCTS } from '../data/products.js';
import { buildProductProfile } from './productProfile.js';
import { NEED_BY_ID } from './ontology.js';
import { isCredibleScienceSource } from '../data/sourcePolicy.js';

const byId = new Map(CATALOG_PRODUCTS.map((p) => [p.id, p]));
const relevance = (r) => buildProductProfile(byId.get(r.product)).health_need_relevance[r.need];

describe('sourced product x need research is what the engine uses', () => {
  it('the .js and .json copies are identical', () => {
    expect(NEED_MAP_RESEARCH).toEqual(NEED_MAP_JSON);
  });
  it('every row names a real product and need, with a credible source', () => {
    for (const r of NEED_MAP_RESEARCH) {
      expect(byId.has(r.product), r.product).toBe(true);
      expect(NEED_BY_ID[r.need], r.need).toBeTruthy();
      expect(isCredibleScienceSource(r.source_url), `${r.product}|${r.need} ${r.source_url}`).toBe(true);
    }
  });
  it('a sourced "none" always removes the link the rules made', () => {
    for (const r of NEED_MAP_RESEARCH.filter((x) => x.strength === 'none')) {
      const rel = relevance(r);
      expect(rel?.score || 0, `${r.product} -> ${r.need}`).toBe(0);
      expect(rel?.contextual?.length || 0).toBe(0);
    }
  });
  it('audit-added links exist in the engine at their sourced strength', () => {
    for (const r of NEED_MAP_RESEARCH.filter((x) => x.added)) {
      expect(relevance(r)?.score || 0, `${r.product} -> ${r.need}`).toBeGreaterThanOrEqual(r.strength === 'primary' ? 0.8 : 0.55);
    }
  });
  it('the retinoid-containing BUNI Bundle is never surfaced as pregnancy-safe', () => {
    expect(buildProductProfile(byId.get('p-buni-bundle')).health_need_relevance['pregnancy.safe_discovery']?.score || 0).toBe(0);
  });
});
