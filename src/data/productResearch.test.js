import { describe, it, expect } from 'vitest';
import { withResearch } from './products.js';
import { PRODUCT_RESEARCH } from './productResearch.js';
import * as Products from './products.js';
import * as Ext from './productsExtended.js';
import * as Ext2 from './productsExtended2.js';
import * as Fill from './categoryFillers.js';
import * as Mvp from './mvpProducts.js';
import * as Men from './menstrualProducts.js';
import * as Brands from './brands.js';
import * as Inc from './incontinenceProducts.js';

// The team's hand-written product text must never change because of research.
const RAW = [Products, Ext, Ext2, Fill, Mvp, Men, Brands, Inc]
  .flatMap((m) => Object.values(m).filter(Array.isArray).flat())
  .filter((p) => p && typeof p === 'object' && typeof p.id === 'string' && p.name && !p.researchFilled);

describe('product research only fills gaps', () => {
  it('has research for products in the catalog', () => {
    expect(Object.keys(PRODUCT_RESEARCH).length).toBeGreaterThan(100);
  });
  it('never changes a field the team already wrote', () => {
    let checked = 0;
    for (const raw of RAW) {
      if (!PRODUCT_RESEARCH[raw.id]) continue;
      const out = withResearch(raw);
      for (const [k, v] of Object.entries(raw)) expect(out[k], `${raw.id}.${k}`).toEqual(v);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(100);
  });
  it('writes no em or en dashes', () => {
    expect(JSON.stringify(PRODUCT_RESEARCH)).not.toMatch(/[–—]/);
  });
});
