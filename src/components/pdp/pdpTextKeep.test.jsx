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
  'Sold by', 'Sold at', 'In stock at', 'Available on',
  // Oct 25 shopper pass (founder: "be a user"):
  'Where to buy', 'Price check', 'Ingredients', 'Materials', // stores live in one Where to buy list by Buy; a device's parts are "What it's made of"
  /^Verified [A-Z][a-z]{2} \d{1,2}, \d{4}$/, // every "Verified <date>" became one "Facts checked <date>" line
  /^Checked [A-Z][a-z]{2} \d{1,2}, \d{4}$/, // the price check is one muted line under Buy
  'No .gov-checked evidence yet', 'No .gov-checked evidence yet.', // now "No checked research yet"
  'From the product listing.', // dropped when the How to use intro already names the source
  'Your routine keeps what you use, when to use it, and a quick check-in to see if it helps.', // in the Add to my routine confirmation
  /^About .+$/, // the Ask label repeated the product name
  'Cramp & pain relief, Cramps', // Helps with, deduped
  'Carbon fiber heating element, soft fabric', // a device's materials repeat its parts list; one is kept
  'Supplements · tablets', 'Virtual care · digital service', 'Cramp relief', // the category sub-note under Format (category stays in the breadcrumb)
  'comfytemp.com', // the app's old Buy link; app and web now share one link (Amazon)
  'rechargeable', '(rechargeable)',
  'Comfytemp · Cramp relief', 'Nature Made · Supplements', // the brand · category pill: brand is text above the name, category is the breadcrumb
  'Also at', 'Where to get it', // other stores are rows in Where to buy
  /^You’re leaving ayna to (buy|book|get started) at .+\.$/, // the leaving line names the one shared Buy link now
  'Book at ppd.plannedparenthood.org', 'Visit site', '(opens ppd.plannedparenthood.org)', // services: "Visit Planned Parenthood Direct"
  'Digital service', // Format says what it is: "Virtual care service"
 // a feature next to the price: Key facts "Listed as"
 // a Key facts row with the same value as an earlier row is shown once
  // PDP audit Oct 25 (evidence as four labelled levels, 7.6): the old "what is on file" list and its notes
  // became the evidence header (counts per level) and the key to the four marks; one sentence replaces three.
  'Independent .gov sources', 'Health pages from MedlinePlus, NIH, FDA, CDC and similar.', 'The brand’s claims', 'What the brand says about its own product. Not checked by ayna.',
  'Ingredient research', 'Community experience', 'People’s experiences. Not evidence that it works.', 'Read the reviews',
  'ayna checks health claims only against .gov sources such as MedlinePlus, NIH and FDA. None is linked to this product yet, so it has no grade. What is on file is listed below for what it is.',
  'Not .gov health sources, so ayna has not checked them. Each is labelled by what it is.', // now "...has not graded them..."
  /, Study record, not yet checked by ayna$/, // now "Peer-reviewed · not graded by ayna"
  'Why ayna rated it this way', // "The research in short" when nothing is graded
  'Other pages the team used', /^\d+ links?$/, // peer-reviewed papers get their own list, so the other-pages list and count can shrink
  'ppd.plannedparenthood.org, App Store', // the Where to buy list: the link is the button, stores without a link are Key facts "Also sold at" (audit 7.9)
  'Add to my routine', // the app's 3-up outline row says "Routine" under 400px (audit 15 OutlineButton); "In my routine" after
  '180 tablets · 180-day supply', // the iron's price notes: now the meta line (180-day supply) and Highlights (180 tablets)
  // PDP audit 9.1 copy (UI strings only): one "no clinician" sentence, "not evidence" said once, the reads line became a .gov mark per card.
  'Who wrote this:', 'ayna’s clinical summary, not reviewed by a named clinician.',
  'Reviews are people’s experiences. They are not evidence that a product works.', 'Online reviews and posts are people’s experiences, not clinical evidence.',
  'Library reads on the same topic, checked against .gov sources.',
  'Some links earn ayna a commission. It never changes your matches.', // app disclosure is the website's one line now; "Partnerships never change this score." sits in Why N%?
  'App or online', // a fact chip above the name (removed, audit 7.2); Format says "Virtual care service"
  'What’s included and details', 'Works with:', 'Check with a clinician first', 'Possible side effects', 'Also worth knowing', 'Downsides to know', 'Label and regulatory facts', 'Labels on file', 'Privacy',
];
const renamed = (c) => RENAMED_LABELS.some((r) => (typeof r === 'string' ? r === c : r.test(c)));
// A paragraph the redesign splits (its first sentence leads The short answer) still counts when every sentence is there.
const squash = (t) => t.toLowerCase().replace(/[\s,]+/g, '');
// Bold first clauses and list rows split a line into pieces: compare without spaces, and a comma list item by item.
const present = (after, c) => after.includes(c) || after.toLowerCase().includes(c.toLowerCase()) || squash(after).includes(squash(c)) || (c.includes(', ') && c.split(', ').every((x) => after.toLowerCase().includes(x.trim().toLowerCase()))) || after.includes(c.replace(/\.$/, '')) || (splitSentences(c).length > 1 && splitSentences(c).every((x) => after.toLowerCase().includes(x.toLowerCase())));

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
        const after = squash(flat(html[surface]));
        for (const line of [...m.who, ...m.safety.warnings]) {
          const n = count(after, squash(line));
          const allowed = top && (line.startsWith(top.replace(/\.$/, '')) || top.startsWith(line)) ? 2 : 1;
          if (n !== 1 && n > allowed) twice.push(`${p.id} ${surface} x${n}: ${line}`);
          if (n === 0) twice.push(`${p.id} ${surface} missing: ${line}`);
        }
      }
    }
    expect(twice).toEqual([]);
  });
});
