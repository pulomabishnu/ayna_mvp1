// @vitest-environment node
/**
 * No information is lost in the product page redesign (founder, Oct 25: "we
 * wanted a lot of info, not less"). The text of the product page on three
 * products (a heating pad, a supplement, a telehealth service) was captured
 * from the page before the redesign (CAPTURE=1 writes the fixture). Every
 * piece of product text in it must still be in the page after, on the
 * website page, the app page and the app sheet. Only UI labels may change,
 * and those are listed below by name.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ALL_PRODUCTS } from '../../data/products.js';
import { loadResearch } from '../../data/researchLoader.js';
import ProductModal from '../ProductModal.jsx';
import ProductDetailScreen from '../../mobile/screens/ProductDetailScreen.jsx';
import ProductSheet from '../../mobile/components/ProductSheet.jsx';

const FIXTURE = path.join(path.dirname(new URL(import.meta.url).pathname), '__fixtures__', 'pdpText.before.json');
const IDS = ['p-portable-heating', 'p-nature-made-iron-65mg', 'd-ppd'];

function chunks(html) {
  const text = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, '\u0001')
    .replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, '\'').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
  return [...new Set(text.split('\u0001').map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => s.length >= 3))];
}
const flat = (html) => chunks(html).join(' ').replace(/\s+/g, ' ');

function renders(product) {
  return {
    web: renderToStaticMarkup(<ProductModal product={product} />),
    app: renderToStaticMarkup(<ProductDetailScreen product={product} />),
    sheet: renderToStaticMarkup(<ProductSheet product={product} onClose={() => {}} />),
  };
}

// UI labels the redesign renamed or folded into a new control (never product text).
export const RENAMED_LABELS = [];

describe('product page keeps every piece of information', () => {
  let products;
  beforeAll(async () => {
    await loadResearch();
    products = IDS.map((id) => ALL_PRODUCTS.find((p) => p.id === id));
  });

  it('has the three products', () => { expect(products.every(Boolean)).toBe(true); });

  it('captures or compares the page text', () => {
    const now = Object.fromEntries(products.map((p) => [p.id, Object.fromEntries(Object.entries(renders(p)).map(([k, html]) => [k, chunks(html)]))]));
    if (process.env.CAPTURE) { fs.mkdirSync(path.dirname(FIXTURE), { recursive: true }); fs.writeFileSync(FIXTURE, JSON.stringify(now, null, 1)); return; }
    const before = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
    const missing = [];
    for (const p of products) {
      const html = renders(p);
      for (const surface of ['web', 'app', 'sheet']) {
        const after = flat(html[surface]);
        for (const c of before[p.id][surface]) {
          if (RENAMED_LABELS.includes(c)) continue;
          if (!after.includes(c)) missing.push(`${p.id} ${surface}: ${c}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
