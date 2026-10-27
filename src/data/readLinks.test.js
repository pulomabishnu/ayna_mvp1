import { describe, it, expect } from 'vitest';
import { readsForProduct, productsForRead, ROW_NOTES } from './readLinks.js';
import { READ_SUMMARIES } from './readPicks.js';

describe('readLinks', () => {
  it('a UTI product points to the UTI read first, only existing reads', () => {
    const reads = readsForProduct({ id: 'x', category: 'supplement', tags: ['uti'], healthFunctions: ['uti-prevention'] });
    expect(reads[0].id).toBe('uti-prevention');
    reads.forEach((r) => expect(READ_SUMMARIES[r.id]).toBeTruthy());
  });
  it('a product the read names comes first, an excluded one never', () => {
    expect(readsForProduct({ id: 'p-intimate-rose', tags: [] })[0].id).toBe('pelvic-floor-dysfunction');
    expect(readsForProduct({ id: 'p-boric-acid', tags: ['uti'] }).some((r) => r.id === 'uti-prevention')).toBe(false);
  });
  it('a product with no topic has no reads', () => {
    expect(readsForProduct({ id: 'y', tags: ['comfort'] })).toEqual([]);
  });
  it('products for a read: one per brand, keeps the read notes', () => {
    const pool = [
      { id: 'a', brand: 'A', tags: ['uti'] }, { id: 'b', brand: 'A', tags: ['uti'] }, { id: 'c', brand: 'C', tags: ['uti-prevention'] }, { id: 'p-boric-acid', brand: 'D', tags: ['uti'] },
    ];
    expect(productsForRead('uti-prevention', pool).map((x) => x.product.id)).toEqual(['a', 'c']);
    expect(ROW_NOTES['bacterial-vaginosis']).toMatch(/prescription/);
  });
});
