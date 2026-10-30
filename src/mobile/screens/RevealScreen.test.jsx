import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RevealScreen from './RevealScreen.jsx';
import { ALL_PRODUCTS } from '../../data/products.js';

const noop = () => {};

describe('intake results preview', () => {
  it('starts a wrapped story with the real recommendation count', () => {
    const html = renderToStaticMarkup(<RevealScreen
      myProducts={[{ id: 'one', name: 'First match', category: 'pad' }, { id: 'two', name: 'Second match', category: 'app' }]}
      topAreas={['Period', 'Sleep']}
      onContinue={noop}
      onBack={noop}
      onGoBrowse={noop}
    />);
    // Same story as the website: intro, matches by category, #1 match, finish.
    expect(html).toContain('Story 1 of 4');
    expect(html).toMatch(/<b>2<\/b><small>products<\/small>/);
    expect(html).toContain('Your ecosystem is ready');
    expect(html).not.toContain('0 products');
  });

  it('does not promise an Ecosystem when no confident products were found', () => {
    const html = renderToStaticMarkup(<RevealScreen myProducts={[]} onContinue={noop} onBack={noop} onGoBrowse={noop} />);
    expect(html).toContain('Story 1 of 1');
    expect(html).toContain('No strong match yet.');
    expect(html).not.toContain('Save my ecosystem');
    expect(html).toContain('Edit answers');
  });

  // QA3 M2: age 54, post-menopause, Heavy periods with a Heavy flow. Same
  // engine gate as Today and the product page: care message first, and a
  // period product is never her "#1 match".
  it('bleeding after menopause: care message leads, period products are not picks', () => {
    const q = { personalizationCompleted: true, fullHealthIntake: { personalizationCompleted: true, takesCurrent: 'No', allergyStatus: 'No', safetyConcern: 'No', age: '54', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Heavy periods'], periodFlow: 'Heavy' } };
    const cup = ALL_PRODUCTS.find((p) => p.id === 'p-saalt-cup');
    const visana = ALL_PRODUCTS.find((p) => p.id === 'd-visana');
    const html = renderToStaticMarkup(<RevealScreen myProducts={[cup, visana]} quizAnswers={q} onContinue={noop} onBack={noop} onGoBrowse={noop} />);
    expect(html).toContain('Get bleeding after menopause checked');
    expect(html).toContain('should be checked promptly');
    const only = renderToStaticMarkup(<RevealScreen myProducts={[cup]} quizAnswers={q} onContinue={noop} onBack={noop} onGoBrowse={noop} />);
    expect(only).toContain('Get bleeding after menopause checked');
    expect(only).toContain('Story 1 of 1');
  });
});
