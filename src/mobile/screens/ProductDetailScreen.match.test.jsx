import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct } from '../../data/products.js';
import ProductDetailScreen from './ProductDetailScreen.jsx';

describe('ProductDetailScreen match display', () => {
  it('shows a relevant score below 60 instead of hiding it on the detail page', () => {
    const product = ALL_PRODUCTS.find((item) => item.id === 'p-vitex');
    const quizAnswers = { fullHealthIntake: { supportSelections: ['PMS symptoms'] } };
    const percent = getProductMatchDetailsForProduct(product, quizAnswers).percent;
    expect(percent).toBeGreaterThan(0);
    expect(percent).toBeLessThan(60);
    const html = renderToStaticMarkup(<ProductDetailScreen product={product} quizAnswers={quizAnswers} />);
    expect(html).toContain(`${percent} percent match. See why`);
    expect(html).toMatch(/PROFILE MATCH/);
  });
});
