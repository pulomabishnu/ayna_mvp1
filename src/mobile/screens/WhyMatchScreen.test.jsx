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
    // Per-need engine output: lead with the need, tier word from the engine tiers.
    const html = render({ percent: 37, tier: 'browse', needId: 'period.heavy', eligible: true, matchStatus: 'scored', needMatches: [{ needId: 'period.heavy', label: 'Heavy periods', phrase: 'heavy periods', score: 37, tier: 'browse', relevant: true, confidenceReasons: [] }], access: { label: 'Available online' }, reasonDetails: [{ component: 'primaryGoal', text: 'Relates to heavy periods' }], unknowns: ['Ingredient information is incomplete'] });
    // Under 50: no number, just "Partial fit" (one rule with the cards).
    expect(html).toContain('Partial fit for heavy periods');
    expect(html).not.toContain('37%');
    // Under 60 no fit label (founder, Oct 24: 80+ Strong fit, 60 to 79 Good fit).
    expect(html).not.toContain('Browse');
    expect(html).toContain('Available online');
    expect(html).toContain('Relates to heavy periods');
    expect(html).toContain('Ingredient information is incomplete');
    expect(html).not.toContain('not have a clear enough fit to display');
  });
  it('prioritizes an exclusion even when the score is unavailable', () => {
    const html = render({ percent: null, eligible: false, matchStatus: 'excluded', considerations: [{ text: 'Contains an ingredient you avoid' }] });
    expect(html).toContain('Not in your matches');
    expect(html).toContain('Contains an ingredient you avoid');
    expect(html).not.toContain('percent match');
  });
  it('says why an excluded product is not shown', () => {
    const html = render({ percent: 0, eligible: false, matchStatus: 'excluded', excludedBecause: ['You said this made things worse'], considerations: [{ text: 'You said this made things worse.' }] });
    expect(html).toContain('Not shown because you said this made things worse');
    expect(html).not.toContain('percent match');
  });
  it('does not invent a percentage for an unrelated product', () => {
    const html = render({ percent: 0, eligible: true, matchStatus: 'no-relevance' });
    expect(html).toContain('No clear match');
    expect(html).not.toContain('0 percent match');
  });
});
