// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/supabaseClient', () => ({ getSupabaseClient: () => null }));
vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
vi.mock('../utils/resolveProductImage', async (orig) => ({
  ...(await orig()),
  resolveProductImage: async () => '',
}));

import ProductModal from './ProductModal';
import { ALL_PRODUCTS, getProfileMatchPercentForProduct } from '../data/products';

let root;
let host;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  try { localStorage.clear(); } catch { /* ignore */ }
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const quiz = { fullHealthIntake: { primaryConcerns: ['Cramp and pain relief (devices, supplements, heat)'] } };

describe('ProductModal match breakdown', () => {
  it('opens the "why this match" panel from the match pill', async () => {
    const product = ALL_PRODUCTS.find((p) => getProfileMatchPercentForProduct(p, quiz, null) > 0);
    await act(async () => root.render(<ProductModal product={product} quizResults={quiz} />));
    const toggle = host.querySelector('.pdp-whymatch-toggle');
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    await act(async () => toggle.click());
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('.whymatch')).toBeTruthy();
    expect(host.textContent).toContain('What matched');
  });

  it('offers the build-your-ecosystem CTA only to viewers without a profile', async () => {
    const onStartQuiz = vi.fn();
    await act(async () => root.render(<ProductModal product={ALL_PRODUCTS[0]} onStartQuiz={onStartQuiz} />));
    const cta = host.querySelector('.pdp-buildmatch');
    expect(cta).toBeTruthy();
    await act(async () => cta.click());
    expect(onStartQuiz).toHaveBeenCalled();

    await act(async () => root.render(<ProductModal product={ALL_PRODUCTS[0]} />));
    expect(host.querySelector('.pdp-buildmatch')).toBeNull();
  });
});
