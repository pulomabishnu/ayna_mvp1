import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { UNKNOWN_PRICE, isKnownPrice, shownPriceText, formatPrice } from './formatPrice.js';
import { serviceFacts } from '../data/startups.js';
import WebProductCard from '../components/ProductCard.jsx';
import AppProductCard from '../mobile/components/ProductCard.jsx';

// QA3 M8: unknown prices are hidden everywhere (cards, app and web).
const noPrice = { id: 'x-test', name: 'Test Pad', brand: 'Brand', category: 'pad' };
describe('unknown price is never printed', () => {
  it('helpers', () => {
    expect(formatPrice(noPrice).main).toBe(UNKNOWN_PRICE);
    expect(isKnownPrice(UNKNOWN_PRICE)).toBe(false);
    expect(shownPriceText(UNKNOWN_PRICE)).toBe('');
    expect(shownPriceText('$12')).toBe('$12');
  });
  it('web card and app card', () => {
    expect(renderToStaticMarkup(<WebProductCard product={noPrice} />)).not.toContain(UNKNOWN_PRICE);
    expect(renderToStaticMarkup(<AppProductCard product={noPrice} onClick={() => {}} />)).not.toContain(UNKNOWN_PRICE);
    expect(renderToStaticMarkup(<AppProductCard product={noPrice} variant="list" onClick={() => {}} />)).not.toContain(UNKNOWN_PRICE);
    expect(renderToStaticMarkup(<WebProductCard product={{ ...noPrice, price: '$12.99' }} />)).toContain('$12.99');
  });
  it('a catalog service shows its own stated price, never the placeholder', () => {
    expect(serviceFacts({ id: 'd-x', type: 'digital', price: 'Free through insurance' }).cost).toBe('Free');
    expect(serviceFacts({ id: 'd-y', type: 'digital' }).cost).toBe('');
  });
  it('no display site prints the placeholder', () => {
    for (const f of ['../components/WebDiscoverDeck.jsx', '../components/v3/ShelfDrawers.jsx', '../mobile/components/ProductSheet.jsx', '../mobile/screens/ProductDetailScreen.jsx']) {
      expect(readFileSync(new URL(f, import.meta.url), 'utf8')).toMatch(/shownPriceText\(/);
    }
  });
});
