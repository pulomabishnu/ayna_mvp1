import { describe, expect, it, vi } from 'vitest';
vi.mock('./WhyTrace.jsx', () => ({ usePro: () => true, default: () => null }));
import { renderToStaticMarkup } from 'react-dom/server';
import WhyFit from './WhyFit.jsx';
import { ALL_PRODUCTS } from '../../data/products.js';
import { shownMatchPercent } from '../../utils/matchDisplay.js';
import { getProductMatchDetailsForProduct } from '../../data/products.js';

// Nov 9 (founder: "not saying every factor"): each factor shows its points, and they add up to the %.
describe('Why this match: every factor with points', () => {
  it('the points shown add up to the match percent', () => {
    const q = { age: '28', allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'], lifeStageSelections: ['I get periods regularly'], supportSelections: ['Vaginal dryness'], personalizationCompleted: true };
    const p = ALL_PRODUCTS.find((x) => x.id === 'p-kindra-lotion');
    const d = getProductMatchDetailsForProduct(p, q);
    const html = renderToStaticMarkup(<WhyFit product={p} quizResults={q} />);
    const pts = [...html.matchAll(/class="ay-w2-pts">([^<]+)</g)].map((m) => Number(m[1].replace('−', '-').replace('+', '')));
    expect(pts.length).toBeGreaterThan(0);
    expect(pts.every((n) => n !== 0)).toBe(true);
    expect(pts.reduce((a, b) => a + b, 0)).toBe(shownMatchPercent(d.percent));
  });
});
