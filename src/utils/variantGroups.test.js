import { describe, expect, it } from 'vitest';
import { variantGroups } from './variantGroups.js';

describe('variantGroups', () => {
  it('splits colour / size combinations into two short rows', () => {
    const g = variantGroups(['Seafoam Green / Regular', 'Seafoam Green / Small', 'Himalayan Pink / Regular', 'Himalayan Pink / Small', 'Ocean Blue / Regular', 'Ocean Blue / Small', 'Welcome to the Cup/Disc Life Kit']);
    expect(g[0]).toEqual({ label: 'Colour', values: ['Seafoam Green', 'Himalayan Pink', 'Ocean Blue'] });
    expect(g[1]).toEqual({ label: 'Size', values: ['Regular', 'Small'] });
    expect(g[2].label).toBe('Also');
  });
  it('keeps a plain size list as one row', () => {
    expect(variantGroups(['Small', 'Large'])).toEqual([{ label: 'Size', values: ['Small', 'Large'] }]);
  });
});
