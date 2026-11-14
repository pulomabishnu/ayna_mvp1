// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
vi.mock('./WhyTrace.jsx', () => ({ usePro: () => true, default: () => null }));
const { default: WhyFit } = await import('./WhyFit.jsx');
const { ALL_PRODUCTS, getProductMatchDetailsForProduct } = await import('../../data/products.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Notion (Nov 13): "Add [concern] to your answers" should add it right away, not reopen the quiz.
describe('Why this fits: add a need in place', () => {
  it('calls onAddNeed with the need and does not open the quiz', async () => {
    const q = { age: '28', allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'], lifeStageSelections: ['I get periods regularly'], supportSelections: ['Vaginal dryness'], personalizationCompleted: true };
    const p = ALL_PRODUCTS.find((x) => { const d = getProductMatchDetailsForProduct(x, q); return d?.matchStatus !== 'scored' && d?.browseFit?.percent > 0 && d.browseFit.needId; });
    expect(p).toBeTruthy();
    const need = getProductMatchDetailsForProduct(p, q).browseFit.needId;
    const onAddNeed = vi.fn(async () => true);
    const onUpdateHealth = vi.fn();
    const host = document.createElement('div'); document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => { root.render(<WhyFit product={p} quizResults={q} onAddNeed={onAddNeed} onUpdateHealth={onUpdateHealth} />); });
    const btn = [...host.querySelectorAll('button')].find((b) => /to your answers/.test(b.textContent));
    expect(btn).toBeTruthy();
    await act(async () => { btn.click(); });
    expect(onAddNeed).toHaveBeenCalledWith(need);
    expect(onUpdateHealth).not.toHaveBeenCalled();
    expect(host.textContent).toContain('Added to your answers');
    await act(async () => { root.unmount(); }); host.remove();
  });
});
