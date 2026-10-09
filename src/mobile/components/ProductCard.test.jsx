import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ProductCard from './ProductCard.jsx';

const pad = { id: 'test-pad', name: 'Flow pad', category: 'pad', tags: ['heavy-flow'], healthFunctions: ['menstrual-collection'] };
const quiz = { fullHealthIntake: { supportSelections: ['Fibroid-related concerns'], diagnosisSelections: ['Fibroids'] } };

describe('product card match display', () => {
  it('does not show a false zero match or a positive claim for a fibroid-only profile', () => {
    const html = renderToStaticMarkup(<ProductCard product={pad} quizAnswers={quiz} onClick={() => {}} />);
    expect(html).toContain('Flow pad');
    expect(html).not.toContain('0% match');
    expect(html).not.toContain('No clear match');
  });

  it('does not reveal a personal percentage to a signed-out browser', () => {
    const html = renderToStaticMarkup(<ProductCard product={pad} quizAnswers={null} onClick={() => {}} />);
    expect(html).not.toContain('% match');
  });

  it('uses the matching need when a broad profile gives a low numeric score', () => {
    const html = renderToStaticMarkup(<ProductCard product={pad} quizAnswers={{ fullHealthIntake: { supportSelections: ['Heavy periods', 'Sleep support', 'Fertility support', 'Skin or acne concerns'] } }} onClick={() => {}} />);
    expect(html).toContain('Heavy periods');
    expect(html).not.toContain('% match');
  });

  it('offers a direct seller action only for an exact product link', () => {
    const shop = renderToStaticMarkup(<ProductCard product={{ ...pad, productUrl: 'https://example.com/products/flow-pad' }} onClick={() => {}} />);
    const search = renderToStaticMarkup(<ProductCard product={{ ...pad, productUrl: 'https://example.com/search?q=flow-pad' }} onClick={() => {}} />);
    expect(shop).toContain('href="https://example.com/products/flow-pad"');
    expect(shop).toContain('Shop');
    expect(shop).toContain('Details');
    expect(search).not.toContain('>Shop');
  });
});
