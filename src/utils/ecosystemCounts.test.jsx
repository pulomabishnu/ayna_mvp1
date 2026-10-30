import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getProductById } from '../data/products.js';
import { ecosystemCounts, needsCoveredLine } from './ecosystemCounts.js';
import EcosystemScreen from '../mobile/screens/EcosystemScreen.jsx';
import RevealScreen from '../mobile/screens/RevealScreen.jsx';

// Walkthrough P0-5: the Ecosystem hero, Wrapped and the website count her
// ecosystem from one selector, with one phrase.
const quiz = { personalizationCompleted: true, age: 24, lifeStageSelections: ['I have regular periods'], supportSelections: ['Cramps or period pain', 'Heavy periods', 'Vaginal dryness', 'UTIs'] };
const IDS = ['p-lola-tampon', 'p-saalt-cup', 'p-thermacare', 'p-good-clean-love', 'p-lola-pad', 'p-natracare-pad', 'p-organyc-pad', 'p-good-kitty-uti-biome-shield', 'p-love-wellness-intimate-skin-support', 'p-carefree-liners', 'p-femmycycle', 'p-hanes-period', 'p-winx-uti-daily-defense', 'p-oboo-groove', 'p-proov-balance-bundle', 'p-magnumsolace-nighttime-magnesium-cream', 'p-natures-bounty-d3-125mcg', 'p-spearmint-pcos', 'p-aleve-naproxen-220', 'p-intimina-lily', 'p-dame-arc', 'p-veeda-pad'];
const products = IDS.map((id) => getProductById(id)).filter(Boolean);

describe('ecosystem counts', () => {
  it('counts every product (earlier picks too), her selected needs and the needs a 50%+ product covers', () => {
    const c = ecosystemCounts(products, quiz);
    expect(c.products).toBe(products.length);
    expect(c.needs).toBe(4);
    expect(c.needsCovered).toBeGreaterThan(0);
    expect(c.needsCovered).toBeLessThanOrEqual(c.needs);
    expect(c.coveredNeedIds).toHaveLength(c.needsCovered);
  });

  it('accepts the website map shape, ignores duplicates, and works without a quiz', () => {
    const asMap = Object.fromEntries(products.map((p) => [p.id, p]));
    expect(ecosystemCounts(asMap, quiz)).toEqual(ecosystemCounts([...products, products[0]], quiz));
    expect(ecosystemCounts(products, null)).toMatchObject({ products: products.length, needs: 0, needsCovered: 0 });
    expect(needsCoveredLine({ needs: 4, needsCovered: 3 })).toBe('3 of 4 needs covered');
    expect(needsCoveredLine({ needs: 1, needsCovered: 1 })).toBe('1 of 1 need covered');
  });

  it('the app hero and Wrapped show the same numbers in the same words', () => {
    const c = ecosystemCounts(products, quiz);
    const hero = renderToStaticMarkup(<EcosystemScreen myProducts={products} quizAnswers={quiz} authUser={{ id: 'u1' }} />);
    const wrapped = renderToStaticMarkup(<RevealScreen myProducts={products} quizAnswers={quiz} />);
    expect(hero).toContain(`<b>${c.products}</b>products`);
    expect(hero).toContain(`<b>${c.needsCovered} of ${c.needs}</b> needs covered`);
    expect(hero).not.toContain('needs have picks');
    expect(wrapped).toContain(`<b>${c.products}</b><small>products</small>`);
    expect(wrapped).toContain(`<strong>${c.needsCovered} of ${c.needs}</strong><span>needs covered</span>`);
  });

  it('a need the hero calls covered never shows an empty shelf', () => {
    const c = ecosystemCounts(products, quiz);
    const hero = renderToStaticMarkup(<EcosystemScreen myProducts={products} quizAnswers={quiz} authUser={{ id: 'u1' }} />);
    const empty = (hero.match(/is-empty-shelf/g) || []).length;
    expect(empty).toBeLessThanOrEqual(c.needs - c.needsCovered);
  });
});
