import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import WhyMatchScreen from './WhyMatchScreen.jsx';
import { getProductMatchDetailsForProduct } from '../../data/products.js';

vi.mock('../../data/products.js', () => ({ getProductMatchDetailsForProduct: vi.fn() }));
const render = (details) => {
  getProductMatchDetailsForProduct.mockReturnValue(details);
  return renderToStaticMarkup(<WhyMatchScreen product={{ name: 'A product' }} onBack={() => {}} />);
};

describe('match explanation truthfulness', () => {
  it('shows a low scored match instead of contradicting the catalog', () => {
    const html = render({ percent: 37, eligible: true, matchStatus: 'scored', reasonDetails: [{ component: 'primaryGoal', text: 'Relates to heavy periods' }], unknowns: ['Ingredient information is incomplete'] });
    expect(html).toContain('37 percent match');
    expect(html).toContain('Partial match');
    expect(html).toContain('Relates to heavy periods');
    expect(html).toContain('Ingredient information is incomplete');
    expect(html).not.toContain('not have a clear enough fit to display');
  });
  it('prioritizes an exclusion even when the score is unavailable', () => {
    const html = render({ percent: null, eligible: false, matchStatus: 'excluded', considerations: [{ text: 'Contains an ingredient you avoid' }] });
    expect(html).toContain('Not a fit right now');
    expect(html).toContain('Contains an ingredient you avoid');
    expect(html).not.toContain('percent match');
  });
  it('does not invent a percentage for an unrelated product', () => {
    const html = render({ percent: 0, eligible: true, matchStatus: 'no-relevance' });
    expect(html).toContain('No clear match');
    expect(html).not.toContain('0 percent match');
  });
});
