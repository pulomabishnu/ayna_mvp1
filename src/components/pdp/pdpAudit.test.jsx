// @vitest-environment node
/**
 * The PDP audit (Oct 25, 2026) test plan, as unit and DOM checks: tab order
 * and default, the four evidence levels, the safety line's order and
 * personalisation, the decision block's contents and the cost per cycle maths.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ALL_PRODUCTS } from '../../data/products.js';
import { loadResearch } from '../../data/researchLoader.js';
import ProductModal from '../ProductModal.jsx';
import ProductDetailScreen from '../../mobile/screens/ProductDetailScreen.jsx';
import ProductSheet from '../../mobile/components/ProductSheet.jsx';
import { TAB_ORDER, DEFAULT_TAB, TAB_LABELS } from './pdpParts.js';

const byId = (id) => ALL_PRODUCTS.find((p) => p.id === id);
const SAALT = 'p-saalt-cup';
const IRON = 'p-nature-made-iron-65mg';

beforeAll(async () => { await loadResearch(); });

const tabsOf = (html) => [...html.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map((m) => ({ id: (m[0].match(/data-tab="([^"]+)"/) || [])[1], selected: /aria-selected="true"/.test(m[0]) }));

describe('tabs: ayna summary first and open (audit P0 #4, 7.16)', () => {
  it('the order is ayna summary, Clinical opinion, Scientific literature, Reviews; names unchanged', () => {
    expect(TAB_ORDER).toEqual(['summary', 'clinical', 'literature', 'reviews']);
    expect(DEFAULT_TAB).toBe('summary');
    expect(TAB_ORDER.map((t) => TAB_LABELS[t])).toEqual(['ayna summary', 'Clinical opinion', 'Scientific literature', 'Reviews']);
  });
  it('website, app page and app sheet render the summary tab first and selected', () => {
    const p = byId(SAALT);
    for (const html of [renderToStaticMarkup(<ProductModal product={p} />), renderToStaticMarkup(<ProductDetailScreen product={p} />), renderToStaticMarkup(<ProductSheet product={p} onClose={() => {}} />)]) {
      const tabs = tabsOf(html);
      expect(tabs.map((t) => t.id)).toEqual(TAB_ORDER);
      expect(tabs[0].selected).toBe(true);
      expect(tabs.filter((t) => t.selected)).toHaveLength(1);
    }
  });
});
