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
import { splitSentences } from './sentences.js';
import { buildEvidence } from './evidenceModel.js';
import { buildGlance } from './glance.js';
import { topWarningFor } from './pdpParts.js';

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
const RENAMED_LABELS = [
  'Your match', // the jump row in ayna summary; her match is the line under the price and Is it for you
  'What it is and who it’s for', // now "What it is" (in Read more) and "Is it for you" (above the tabs)
  'Label and regulator facts', // now "Label and regulatory facts" (founder's brief wording)
  'ayna’s take', // now "The short answer"
  'Evidence:', // the line next to Buy; the same words are in the evidence meter
  /^\d+ parts\. Swipe to read on\.$/, // sideways reading shelves became "Show all N parts"
  // Oct 25 rework: ayna summary is one column of plain sections (In one line, Who it's for,
  // Key facts, How to use, Safety, Evidence, Ingredients); these old headings and links went with the old boxes.
  'All safety info', // the hero's safety line now says "Safety"
  'See the literature', // now "See the research"
  'What it is', 'Helps with:', 'At a glance', 'Before you use it', 'Ingredients and dose', 'What’s in it', 'What’s included', 'Size and price',
  'What’s included and details', 'Works with:', 'Check with a clinician first', 'Possible side effects', 'Also worth knowing', 'Downsides to know', 'Label and regulatory facts', 'Labels on file', 'Privacy',
];
const renamed = (c) => RENAMED_LABELS.some((r) => (typeof r === 'string' ? r === c : r.test(c)));
// A paragraph the redesign splits (its first sentence leads The short answer) still counts when every sentence is there.
const present = (after, c) => after.includes(c) || after.toLowerCase().includes(c.toLowerCase()) || after.includes(c.replace(/\.$/, '')) || (splitSentences(c).length > 1 && splitSentences(c).every((x) => after.includes(x)));

describe('product page keeps every piece of information', () => {
  let products;
  beforeAll(async () => {
    await loadResearch();
    products = IDS.map((id) => ALL_PRODUCTS.find((p) => p.id === id));
  });

  it('has the three products', () => { expect(products.every(Boolean)).toBe(true); });

  it('captures or compares the page text', () => {
    const now = Object.fromEntries(products.map((p) => [p.id, Object.fromEntries(Object.entries(renders(p)).map(([k, html]) => [k, chunks(html)]))]));
    if (globalThis.process?.env?.CAPTURE) { fs.mkdirSync(path.dirname(FIXTURE), { recursive: true }); fs.writeFileSync(FIXTURE, JSON.stringify(now, null, 1)); return; }
    const before = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
    const missing = [];
    for (const p of products) {
      const html = renders(p);
      for (const surface of ['web', 'app', 'sheet']) {
        const after = flat(html[surface]);
        for (const c of before[p.id][surface]) {
          if (renamed(c)) continue;
          if (!present(after, c)) missing.push(`${p.id} ${surface}: ${c}`);
        }
      }
    }
    if (missing.length) globalThis.process?.stdout?.write(`\nMISSING\n${missing.join('\n')}\n`);
    expect(missing).toEqual([]);
  });

  it('every who-it\'s-for and safety line is rendered once (the hero safety line is the one echo)', () => {
    const count = (hay, needle) => hay.split(needle).length - 1;
    const twice = [];
    for (const p of products) {
      const html = renders(p);
      const m = buildEvidence(p, {});
      const top = topWarningFor(p, buildGlance(p, {}));
      for (const surface of ['web', 'app', 'sheet']) {
        const after = flat(html[surface]);
        for (const line of [...m.who, ...m.safety.warnings]) {
          const n = count(after, line);
          const allowed = top && (line.startsWith(top.replace(/\.$/, '')) || top.startsWith(line)) ? 2 : 1;
          if (n !== 1 && n > allowed) twice.push(`${p.id} ${surface} x${n}: ${line}`);
          if (n === 0) twice.push(`${p.id} ${surface} missing: ${line}`);
        }
      }
    }
    expect(twice).toEqual([]);
  });
});
