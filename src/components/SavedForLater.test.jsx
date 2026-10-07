// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SavedForLater from './SavedForLater';
import WhyMatchPanel from './WhyMatchPanel';
import { ALL_PRODUCTS, getProfileMatchPercentForProduct } from '../data/products';

let root;
let host;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

async function render(node) {
  await act(async () => root.render(node));
}

const buttonByText = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.startsWith(text));

describe('SavedForLater', () => {
  it('shows an empty state with real catalog suggestions', async () => {
    await render(<SavedForLater savedProducts={{}} myProducts={{}} onBrowse={() => {}} />);
    expect(host.textContent).toContain('Nothing saved yet.');
    const names = [...host.querySelectorAll('.saved-suggest__name')].map((n) => n.textContent);
    expect(names.length).toBeGreaterThan(0);
    names.forEach((name) => expect(ALL_PRODUCTS.some((p) => p.name === name)).toBe(true));
  });

  it('shows a single-item hero without filter chips', async () => {
    const [p] = ALL_PRODUCTS;
    await render(<SavedForLater savedProducts={{ [p.id]: { id: p.id, name: p.name } }} myProducts={{}} />);
    expect(host.querySelector('.saved-hero')).toBeTruthy();
    expect(host.querySelector('.saved-chips')).toBeNull();
  });

  it('filters by chip and keeps the stored item in callbacks', async () => {
    const [a, b] = ALL_PRODUCTS;
    const savedA = { id: a.id, name: a.name };
    const savedB = { id: b.id, name: b.name };
    const onToggleSaved = vi.fn();
    await render(
      <SavedForLater
        savedProducts={{ [a.id]: savedA, [b.id]: savedB }}
        myProducts={{ [a.id]: a }}
        onToggleSaved={onToggleSaved}
      />
    );
    expect(host.querySelectorAll('.saved-item')).toHaveLength(2);
    expect(buttonByText('In ecosystem').textContent).toContain('1');
    await act(async () => buttonByText('In ecosystem').click());
    expect(host.querySelectorAll('.saved-item')).toHaveLength(1);
    await act(async () => buttonByText('Not tried').click());
    expect(host.querySelectorAll('.saved-item')).toHaveLength(1);
    await act(async () => host.querySelector('.saved-heart').click());
    expect(onToggleSaved).toHaveBeenCalledWith(savedB);
  });

  it('shows the same match % the product page uses', async () => {
    const quiz = { fullHealthIntake: { primaryConcerns: ['Cramp and pain relief (devices, supplements, heat)'] } };
    const scored = ALL_PRODUCTS.filter((p) => getProfileMatchPercentForProduct(p, quiz, null) > 0).slice(0, 2);
    expect(scored).toHaveLength(2);
    const saved = Object.fromEntries(scored.map((p) => [p.id, { id: p.id, name: p.name }]));
    await render(<SavedForLater savedProducts={saved} myProducts={{}} quizResults={quiz} />);
    const labels = [...host.querySelectorAll('.ayna-match-gauge')].map((g) => g.getAttribute('aria-label'));
    expect(labels).toEqual(scored.map((p) => `${getProfileMatchPercentForProduct(p, quiz, null)}% match`));
  });
});

describe('WhyMatchPanel', () => {
  it('renders the breakdown for a scored product', async () => {
    const quiz = { fullHealthIntake: { primaryConcerns: ['Cramp and pain relief (devices, supplements, heat)'] } };
    const product = ALL_PRODUCTS.find((p) => getProfileMatchPercentForProduct(p, quiz, null) > 0);
    await render(<WhyMatchPanel product={product} quizResults={quiz} />);
    expect(host.textContent).toContain(`Why ${getProfileMatchPercentForProduct(product, quiz, null)}%`);
    expect(host.textContent).toContain('What matched');
  });

  it('renders the not-enough-data state without a profile', async () => {
    await render(<WhyMatchPanel product={ALL_PRODUCTS[0]} quizResults={null} />);
    expect(host.textContent).toContain("We don't have enough");
  });
});
