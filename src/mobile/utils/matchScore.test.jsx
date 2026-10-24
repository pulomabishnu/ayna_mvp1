import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct } from '../../data/products.js';
import { behaviorFrom } from '../../utils/matchDisplay.js';
import { matchPercentFor } from './matchScore.js';
import ProductCard from '../components/ProductCard.jsx';
import DiscoverDeck from '../components/DiscoverDeck.jsx';

// Walkthrough P0-4: one product, one match percent on every app surface.
const quiz = { personalizationCompleted: true, age: 24, lifeStageSelections: ['I have regular periods'], supportSelections: ['Cramps or period pain', 'Heavy periods', 'Vaginal dryness'] };
const product = ALL_PRODUCTS.find((p) => p.id === 'p-good-clean-love');
// Her behaviour (saved + in her ecosystem) was part of the v1 score, so it is the case that drifted.
const opts = behaviorFrom({ saved: { [product.id]: product }, inEcosystem: [product] });
const pct = (html) => Number((/(\d+)% (match|for)/.exec(html) || [])[1]);

describe('one match score per product', () => {
  it('v1: the inputs that drifted really change the number (so the test means something)', () => {
    const withOpts = matchPercentFor(product, quiz, { ...opts, engine: 'v1' });
    expect(withOpts).toBeGreaterThan(0);
    expect(getProductMatchDetailsForProduct(product, quiz, null, { engine: 'v1' }).percent).not.toBe(withOpts);
  });

  it('v2: saving it or adding it to her ecosystem never changes the number', () => {
    const withOpts = matchPercentFor(product, quiz, opts);
    expect(withOpts).toBeGreaterThan(0);
    expect(getProductMatchDetailsForProduct(product, quiz).percent).toBe(withOpts);
  });

  it('Shop card, shelf card, Swipe and the product page number all agree', () => {
    const expected = matchPercentFor(product, quiz, opts);
    const card = renderToStaticMarkup(<ProductCard product={product} quizAnswers={quiz} matchOpts={opts} onClick={() => {}} />);
    const shelfCard = renderToStaticMarkup(<ProductCard product={product} quizAnswers={quiz} matchOpts={opts} needId="pain.menstrual_cramp" onClick={() => {}} />);
    const deck = renderToStaticMarkup(<DiscoverDeck products={[product]} quizAnswers={quiz} matchOpts={opts} onClose={() => {}} />);
    expect(pct(card)).toBe(expected);
    expect(pct(shelfCard)).toBe(expected);
    expect(pct(deck)).toBe(expected);
    // The product page reads matchPercentFor directly (ProductDetailScreen.jsx).
    expect(getProductMatchDetailsForProduct(product, quiz, null, opts).percent).toBe(expected);
  });

  it('a shelf never shows a shelf-only score', () => {
    const shelf = getProductMatchDetailsForProduct(product, quiz, null, { ...opts, needId: 'pain.menstrual_cramp' }).percent;
    const shelfCard = renderToStaticMarkup(<ProductCard product={product} quizAnswers={quiz} matchOpts={opts} needId="pain.menstrual_cramp" onClick={() => {}} />);
    if (shelf !== matchPercentFor(product, quiz, opts)) expect(shelfCard).not.toContain(`${shelf}%`);
  });
});
