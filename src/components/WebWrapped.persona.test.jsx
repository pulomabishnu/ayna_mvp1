// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import WebWrapped from './WebWrapped.jsx';
import { ALL_PRODUCTS } from '../data/products.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// Nov 13: the shopping-style card (founder's Wrapped inspo) is added only from her own answers.
const open = (intake) => {
  const el = document.createElement('div'); document.body.append(el);
  const root = createRoot(el);
  act(() => root.render(<WebWrapped products={ALL_PRODUCTS.slice(0, 4)} quizResults={{ fullHealthIntake: intake }} startAtEnd />));
  const n = Number(document.body.textContent.match(/Story (\d+) of (\d+)/)[2]);
  act(() => document.querySelector('[aria-label="Previous slide"]').click());
  const card = document.querySelector('.ay-wr-pcard')?.textContent || '';
  act(() => root.unmount()); document.body.innerHTML = '';
  return { n, card };
};
describe('WebWrapped persona card', () => {
  it('shows her shopping style from her answers, and no slide without them', () => {
    const base = { supportSelections: ['Cramps or period pain'] };
    const withIt = open({ ...base, trustRanking: ['Clinical or scientific evidence'] });
    const without = open(base);
    expect(withIt.n).toBe(without.n + 1);
    expect(withIt.card).toContain('You follow the evidence');
    expect(withIt.card).toContain('Evidence first');
    expect(without.card).toBe('');
  });
});
