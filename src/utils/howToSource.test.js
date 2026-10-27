import { describe, it, expect } from 'vitest';
import { brandHowTo, isBrandOrGovSource } from './howToSource.js';
import { howLine } from '../health/plan.js';

describe('how-to sources cite the brand, not a seller', () => {
  it('keeps the brand site and .gov, drops sellers', () => {
    expect(isBrandOrGovSource('https://hellowinx.com/products/x', 'Winx')).toBe(true);
    expect(isBrandOrGovSource('https://www.fda.gov/x', 'Any')).toBe(true);
    expect(isBrandOrGovSource('https://kateminimalist.com/products/viboos-pad', 'VIBOOS')).toBe(false);
    expect(isBrandOrGovSource('https://www.amazon.com/dp/1', 'VIBOOS')).toBe(false);
  });
  it('a seller page becomes "the product listing", unlinked', () => {
    const how = { steps: ['Lay it flat.'], sourceUrl: 'https://kateminimalist.com/p', sourceLabel: 'VIBOOS listing (retailer page)' };
    expect(brandHowTo(how, 'VIBOOS')).toMatchObject({ sourceUrl: undefined, sourceLabel: undefined, fromListing: true });
    const line = howLine({ brand: 'VIBOOS', howToUse: how });
    expect(line.source).toBe('the product listing');
    expect(line.sourceUrl).toBe(null);
  });
});
