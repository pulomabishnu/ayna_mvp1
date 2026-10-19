import { describe, expect, it } from 'vitest';
import { addedHealthSources, addWithoutRemoving, appendWithoutRemoving, freshStartWarning, productsNotInEcosystem } from './quizRedo.js';

const p = (id, extra = {}) => ({ id, name: id, ...extra });

describe('keep my products and add new ones', () => {
  it('offers only products she does not have or hid, once each, in order', () => {
    const mine = { a: p('a'), b: p('b') };
    const hidden = { c: p('c') };
    expect(productsNotInEcosystem([p('a'), p('d'), p('c'), p('d'), p('e'), p('f', { hidden: true })], mine, hidden).map((x) => x.id)).toEqual(['d', 'e']);
  });

  it('works with the app list shape too', () => {
    expect(productsNotInEcosystem([p('a'), p('z')], [p('a')], {}).map((x) => x.id)).toEqual(['z']);
  });

  it('never removes or replaces what she has', () => {
    const own = p('a', { userAdded: true, note: 'mine' });
    const prev = { a: own, b: p('b', { intakeGenerated: true }) };
    const next = addWithoutRemoving(prev, [p('a', { note: 'new copy' }), p('c')]);
    expect(Object.keys(next)).toEqual(['a', 'b', 'c']);
    expect(next.a).toBe(own);
    expect(next.b).toBe(prev.b);
    expect(prev).not.toHaveProperty('c');
  });

  it('app: appends new ones after hers, no duplicates', () => {
    const prev = [p('a'), p('b')];
    expect(appendWithoutRemoving(prev, [p('b'), p('c'), p('c')]).map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('start fresh warning', () => {
  it('names the count in the button and lists exactly what is deleted and kept', () => {
    const w = freshStartWarning({ productCount: 7, trackedCount: 3 });
    expect(w.confirmLabel).toBe('Delete 7 products and start over');
    expect(w.clears).toEqual([
      'All 7 products in your Ecosystem',
      'Recall tracking and routine spots for 3 products',
      'Products you hid from your picks',
      'Your quiz answers',
    ]);
    expect(w.keeps).toContain('Saved products');
    expect(w.permanence).toMatch(/can't be undone/);
    expect(freshStartWarning({ productCount: 1 }).confirmLabel).toBe('Delete 1 product and start over');
  });
});

describe('new health data', () => {
  it('reports only sources that were just connected', () => {
    expect(addedHealthSources(null, { sources: { appleHealth: true }, wearableSummary: { text: 'Oura: sleep 7h' } })).toEqual(['Apple Health', 'wearable data']);
    expect(addedHealthSources({ sources: { appleHealth: true } }, { sources: { appleHealth: true } })).toEqual([]);
    expect(addedHealthSources({ sources: {} }, { sources: { fhir: true } })).toEqual(['health records']);
  });
});
