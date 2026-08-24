import { describe, it, expect } from 'vitest';
import { getSortPrice } from './Discovery';

// Regression coverage for the "Price: Low to High / High to Low scatters everything" bug.
// Root cause: the old getSortPrice searched for a "$N/month" pattern ANYWHERE in the price
// string and preferred it over everything else whenever one existed — so a $299 device with
// an optional monthly add-on ("Oura Ring Gen 3 $299 + $6/month") sorted as $6, landing next to
// actually-cheap items regardless of sort direction. Confirmed live: "Natural Cycles $100/year
// or $13/month" and "Clue Period Tracker Free (Clue Plus $10/month)" showed the same failure
// mode. These tests pin down real price strings pulled from the live catalog.
describe('getSortPrice', () => {
  it('uses the base price, not a secondary "$N/month" add-on mentioned later in the string', () => {
    expect(getSortPrice({ price: 'Oura Ring Gen 3 $299 + $6/month' })).toBe(299);
  });

  it('uses the primary "$N/year" figure over a secondary "$N/month" restatement of the same plan', () => {
    expect(getSortPrice({ price: '$100/year or $13/month' })).toBe(100);
  });

  it('a "Free" base price sorts as 0 even when a paid tier is mentioned afterward', () => {
    expect(getSortPrice({ price: 'Free (Clue Plus $10/month)' })).toBe(0);
    expect(getSortPrice({ price: 'Free (Premium $60/year)' })).toBe(0);
  });

  it('a plain single price parses to that number', () => {
    expect(getSortPrice({ price: '$40' })).toBe(40);
    expect(getSortPrice({ price: '$249' })).toBe(249);
  });

  it('a range uses the low end, consistently, regardless of $ placement in the string', () => {
    expect(getSortPrice({ price: '$20-35' })).toBe(20);
    expect(getSortPrice({ price: '$5-7' })).toBe(5);
    expect(getSortPrice({ price: '$8–12 for 3–4 wraps' })).toBe(8);
  });

  it('a multi-SKU price string uses the first (cheaper) option', () => {
    expect(getSortPrice({ price: '$16 for 12 (disposable) / $35 reusable' })).toBe(16);
  });

  it('a price with no dollar figure and no "Free" falls back to item.stage, then null', () => {
    expect(getSortPrice({ price: 'Available, DTC' })).toBeNull();
    expect(getSortPrice({ stage: 'Available, growing' })).toBeNull();
  });

  it('items missing a price entirely sort as null (pushed to the end, not treated as $0)', () => {
    expect(getSortPrice({})).toBeNull();
    expect(getSortPrice({ price: '' })).toBeNull();
  });
});
