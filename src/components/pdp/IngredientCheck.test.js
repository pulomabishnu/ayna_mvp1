import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../../data/products.js';
import { ingredientCheck } from './IngredientCheck.jsx';

describe('Ingredient check (UCLA 10/1)', () => {
  it('only says "free of" what a label says, and nothing for devices', () => {
    const shown = ALL_PRODUCTS.map((p) => [p, ingredientCheck(p)]).filter(([, c]) => c);
    expect(shown.length).toBeGreaterThan(50);
    for (const [, c] of shown) {
      for (const f of c.free) expect(c.contains).not.toContain(f);
      expect(c.free.length + c.contains.length).toBeGreaterThan(0);
    }
    const pad = ALL_PRODUCTS.find((p) => p.id === 'p-viboos-heating-pad');
    expect(ingredientCheck(pad)).toBeNull();
  });
});
