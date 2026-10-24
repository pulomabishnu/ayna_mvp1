import { describe, expect, it } from 'vitest';
import { currencyForLocale, localEstimate } from './localPrice.js';
import { cardPrice } from './productCardFacts.js';

describe('local price estimate (Trevina, international shoppers)', () => {
  it('shows nothing for US visitors', () => {
    expect(currencyForLocale('en-US')).toBe('');
    expect(localEstimate('$23', 'en-US')).toBe('');
  });
  it('picks the visitor currency from the locale', () => {
    expect(currencyForLocale('de-DE')).toBe('EUR');
    expect(currencyForLocale('en-GB')).toBe('GBP');
    expect(currencyForLocale('en-CA')).toBe('CAD');
    expect(currencyForLocale('pt-BR')).toBe('');
  });
  it('converts single prices, ranges and per-month prices', () => {
    expect(localEstimate('$23', 'en-GB')).toMatch(/^≈ £\d+$/);
    expect(localEstimate('About $20–35', 'en-GB')).toMatch(/^≈ £\d+.+£?\d+$/);
    expect(localEstimate('$15/mo', 'en-GB')).toMatch(/\/mo$/);
    expect(localEstimate('Price at retailer', 'en-GB')).toBe('');
  });
  it('adds the estimate to the product card only outside the US', () => {
    expect(cardPrice({ price: '$23' }, { locale: 'en-US' }).sub || '').not.toMatch(/≈/);
    expect(cardPrice({ price: '$23' }, { locale: 'en-GB' }).sub).toMatch(/≈ £/);
  });
});
