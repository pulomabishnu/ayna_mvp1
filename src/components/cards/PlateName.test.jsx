import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlateName } from './CardBits.jsx';

// QA3 M7: a product with no photo shows the plain plate with the brand name on
// Explore cards and on the app product page alike (not an espresso block with
// the full product name cut off).
describe('no-photo plate', () => {
  it('shows the brand, not the long product name', () => {
    const html = renderToStaticMarkup(<PlateName product={{ id: 'd-apple-health', name: 'Apple Health (Cycle Tracking)' }} />);
    expect(html).toContain('>Apple Health<');
    expect(html).toContain('No photo yet for Apple Health (Cycle Tracking)');
  });
  it('falls back to the name, then ayna', () => {
    expect(renderToStaticMarkup(<PlateName product={{ id: 'x', name: 'Thing' }} />)).toContain('>Thing<');
    expect(renderToStaticMarkup(<PlateName product={{}} />)).toContain('>ayna<');
  });
  it('the app product page uses the same plate as its photo fallback', () => {
    const src = readFileSync(new URL('../../mobile/screens/ProductDetailScreen.jsx', import.meta.url), 'utf8');
    expect(src.match(/fallback=\{<PlateName product=\{product\} \/>\}/g)?.length).toBe(2);
  });
});
