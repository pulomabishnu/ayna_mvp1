import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BigPurchase, { bigPurchasePrice } from './BigPurchase.jsx';

describe('Before you spend (focus group, Nov 9)', () => {
  it('only one-time prices of $150 or more', () => {
    expect(bigPurchasePrice({ price: '$399' })).toBe(399);
    expect(bigPurchasePrice({ price: '$149.99' })).toBeNull();
    expect(bigPurchasePrice({ price: '$199/month' })).toBeNull();
    expect(bigPurchasePrice({ price: 'Check retailer' })).toBeNull();
  });
  it('shows cheaper options that fit her with their match, and compare/ask', () => {
    const html = renderToStaticMarkup(<BigPurchase product={{ id: 'x', name: 'X', price: '$450' }} cheaper={[{ id: 'y', name: 'Y heat pad', price: '$13' }]} pctFor={() => 82} onCompare={() => {}} onAsk={() => {}} />);
    expect(html).toContain('Before you spend $450');
    expect(html).toContain('Y heat pad');
    expect(html).toContain('82% match');
    expect(html).toContain('Ask ayna if it’s worth it');
    expect(renderToStaticMarkup(<BigPurchase product={{ id: 'x', name: 'X', price: '$40' }} />)).toBe('');
  });
});
