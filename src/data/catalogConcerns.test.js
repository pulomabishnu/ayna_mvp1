import { describe, it, expect } from 'vitest';
import { buildCatalogConcerns, CATALOG_CONCERNS } from './catalogConcerns';
import { CATALOG_BRANDS } from './catalogBrands';
import { CATALOG_PRODUCTS } from './products';

describe('catalog concerns', () => {
  it('orders primary before secondary, then by grade, and skips "none"', () => {
    const out = buildCatalogConcerns([
      { product: 'p-x', need: 'pain.pelvic', strength: 'secondary', grade: 'A' },
      { product: 'p-x', need: 'pain.menstrual_cramp', strength: 'primary', grade: 'B' },
      { product: 'p-x', need: 'sleep.trouble', strength: 'none', grade: 'A' },
    ]);
    expect(out['p-x']).toEqual({ concerns: ['pain.menstrual_cramp', 'pain.pelvic'], primaryConcern: 'pain.menstrual_cramp' });
  });

  it('gives the audit examples specific needs, not just a category', () => {
    expect(CATALOG_CONCERNS['p-thermacare'].primaryConcern).toBe('pain.menstrual_cramp');
    expect(CATALOG_CONCERNS['p-depend-silhouette-underwear'].concerns).toContain('urinary.incontinence');
  });
});

describe('catalog brands', () => {
  it('never contradicts a brand the team wrote', () => {
    const byId = new Map(CATALOG_PRODUCTS.map((p) => [p.id, p]));
    for (const [id, brand] of Object.entries(CATALOG_BRANDS)) {
      const team = byId.get(id)?.brand;
      if (team) expect(brand.toLowerCase()).toBe(String(team).toLowerCase());
    }
  });
});
