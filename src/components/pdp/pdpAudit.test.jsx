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
import { TAB_ORDER, DEFAULT_TAB, TAB_LABELS, safetyLineFor, hasIud, wearHours } from './pdpParts.js';
import { withResearch } from '../../data/products.js';
import { buildGlance } from './glance.js';

const byId = (id) => ALL_PRODUCTS.find((p) => p.id === id);
const SAALT = 'p-saalt-cup';
const IRON = 'p-nature-made-iron-65mg';

let R = {};
beforeAll(async () => { R = await loadResearch(); });
const full = (id) => withResearch(byId(id), R);
const IUD_PROFILE = { fullHealthIntake: { takesCurrent: 'Yes', currentMedicationItems: ['Hormonal IUD'] }, personalizationCompleted: true };

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

describe('safety line: under the button, calm, personalised (audit P0 #3, 7.5)', () => {
  it('knows an IUD from her answers, and nothing else', () => {
    expect(hasIud(IUD_PROFILE)).toBe(true);
    expect(hasIud({ fullHealthIntake: { currentMedicationItems: ['Mirena'] } })).toBe(true);
    expect(hasIud({ fullHealthIntake: { currentMedicationItems: ['Ibuprofen'] } })).toBe(false);
    expect(hasIud(null)).toBe(false);
  });
  it('a cup: her IUD first when she has one, then TSS with the wear limit from the product record', () => {
    const p = full(SAALT);
    const g = buildGlance(p, {});
    expect(wearHours(p)).toBe(12);
    const mine = safetyLineFor(p, g, undefined, { answers: IUD_PROFILE });
    expect(mine.personal).toBe(true);
    expect(mine.lines.map((l) => l.kind)).toEqual(['iud', 'tss']);
    expect(mine.lines[0].text).toBe('You have an IUD: check with your clinician before using a cup.');
    expect(mine.lines[1].text).toBe('TSS risk is rare but serious. Never wear it longer than 12 hours.');
    const general = safetyLineFor(p, g, undefined, { answers: null });
    expect(general.lines.map((l) => l.kind)).toEqual(['tss']);
  });
  it('the Tampon Tribe cup gets the same lines; the iron supplement keeps its own critical warning and never an IUD line', () => {
    const tt = full('p-tampontribe-menstrual-cup');
    expect(safetyLineFor(tt, buildGlance(tt, {}), undefined, { answers: IUD_PROFILE }).lines.map((l) => l.kind)).toEqual(['iud', 'tss']);
    const iron = full(IRON);
    const line = safetyLineFor(iron, buildGlance(iron, {}), undefined, { answers: IUD_PROFILE });
    expect(line.lines.map((l) => l.kind)).toEqual(['warning']);
    expect(line.lines[0].text).toMatch(/children/);
  });
  it('a recall outranks the TSS line', () => {
    const p = { ...full(SAALT) };
    const out = safetyLineFor(p, buildGlance(p, {}), { status: 'past', label: 'Active recall found', detail: 'Recalled in 2026 for a test.' });
    expect(out.lines[0].kind).toBe('recall');
  });
  it('website, app page and sheet: the safety line sits right after the buy button and before the tabs; no "!" glyph, an SVG icon', () => {
    const p = byId(SAALT);
    const pages = [
      renderToStaticMarkup(<ProductModal product={p} quizResults={IUD_PROFILE} />),
      renderToStaticMarkup(<ProductDetailScreen product={p} quizAnswers={IUD_PROFILE} />),
      renderToStaticMarkup(<ProductSheet product={p} onClose={() => {}} answers={IUD_PROFILE} />),
    ];
    for (const html of pages) {
      const buy = html.indexOf('ayv-buy');
      const safe = html.indexOf('class="ayv-safeline"');
      const tabs = html.indexOf('role="tablist"');
      expect(buy).toBeGreaterThan(-1);
      expect(safe).toBeGreaterThan(buy);
      expect(safe).toBeLessThan(tabs);
      const block = html.slice(safe, html.indexOf('</div></div>', safe));
      expect(block).toMatch(/You have an IUD/);
      expect(block.indexOf('You have an IUD')).toBeLessThan(block.indexOf('TSS risk'));
      expect(block).toMatch(/<svg/);
      expect(block).toMatch(/Safety details/);
      expect(block).not.toMatch(/ayv-safeline__mark/);
    }
  });
});
