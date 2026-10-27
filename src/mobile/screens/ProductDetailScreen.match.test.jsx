import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct } from '../../data/products.js';
import ProductDetailScreen from './ProductDetailScreen.jsx';

describe('ProductDetailScreen match display', () => {
  it('shows a relevant mid-range score as the one match pill', () => {
    const product = ALL_PRODUCTS.find((item) => item.id === 'p-vitex');
    const quizAnswers = { fullHealthIntake: { supportSelections: ['PMS symptoms'], takesCurrent: 'No', lifeStageSelections: ['I get periods regularly'] } };
    const details = getProductMatchDetailsForProduct(product, quizAnswers);
    const percent = details.percent;
    expect(percent).toBeGreaterThan(0);
    expect(percent).toBeLessThan(75);
    const html = renderToStaticMarkup(<ProductDetailScreen product={product} quizAnswers={quizAnswers} />);
    expect(html).toContain('ay-match-pill');
    // One rule everywhere (matchDisplay): 50+ shows the number, under 50 shows "Partial fit".
    if (percent >= 50) expect(html).toContain(`<strong>${percent}%</strong><span>match</span>`);
    else {
      expect(html).toContain('Partial fit');
      expect(html).not.toContain(`${percent}%`);
    }
    // No ring overlay, no raw per-need score chips in the header.
    expect(html).not.toMatch(/PROFILE MATCH/);
    expect(html).not.toContain('ay-pdp-need__rows');
  });

  it('never shows a zero or sub-50 need as a chip', () => {
    const product = ALL_PRODUCTS.find((item) => item.category === 'pad');
    const quizAnswers = { fullHealthIntake: { supportSelections: ['Heavy periods', 'Cramps or period pain', 'Spotting between periods'] } };
    const html = renderToStaticMarkup(<ProductDetailScreen product={product} quizAnswers={quizAnswers} />);
    expect(html).not.toMatch(/Cramps\s*<b>0<\/b>/);
    expect(html).not.toMatch(/>\s*0\s*</);
  });
});
