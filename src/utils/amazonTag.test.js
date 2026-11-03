import { describe, expect, it } from 'vitest';
import { withAmazonTag, resolveBuyUrl, isAmazonUrl } from './buyLink.js';
import { ALL_PRODUCTS } from '../data/products.js';

describe('every Amazon link carries ayna’s tag (Nov 2)', () => {
  it('adds or replaces the tag on amazon.com links, leaves others alone', () => {
    expect(withAmazonTag('https://www.amazon.com/dp/B000VI3LNE')).toBe('https://www.amazon.com/dp/B000VI3LNE?tag=aynahealth-20');
    expect(withAmazonTag('https://www.amazon.com/dp/B000VI3LNE?tag=someone-20&th=1')).toContain('tag=aynahealth-20');
    expect(withAmazonTag('https://www.amazon.com/dp/B000VI3LNE?tag=someone-20')).not.toContain('someone-20');
    expect(withAmazonTag('https://eatferra.com/products/period-brownies')).toBe('https://eatferra.com/products/period-brownies');
  });
  it('no product in the catalog sends someone to an untagged Amazon page', () => {
    const untagged = ALL_PRODUCTS.map((p) => [p.id, resolveBuyUrl(p)]).filter(([, u]) => u && isAmazonUrl(u) && /amazon\.com/.test(u) && !/[?&]tag=aynahealth-20\b/.test(u));
    expect(untagged).toEqual([]);
  });
});

describe('Amazon links added from the Nov 2 sheet (same product only)', () => {
  it.each([['p-tampax-pure', 'B0B986WL73'], ['p-intimina-lily', 'B00BL1137Q'], ['p-estroven-mood', 'B0091CG65G'], ['p-joylux-vfit', 'B0B42KYZ98'], ['p-sweet-spot-wipes', 'B0DVGZLL7W']])('%s goes to its Amazon listing with the tag', (id, asin) => {
    const p = ALL_PRODUCTS.find((x) => x.id === id);
    expect(p).toBeTruthy();
    expect(resolveBuyUrl(p)).toBe(`https://www.amazon.com/dp/${asin}?tag=aynahealth-20`);
  });
});
