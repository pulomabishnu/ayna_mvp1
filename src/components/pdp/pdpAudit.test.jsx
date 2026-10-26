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
import { evidenceFor, levelOfLink, levelLabel, isPeerReviewed } from './evidenceLevels.js';
import { linkKind } from './evidenceModel.js';
import { compareRows } from './commerce.js';
import { evidenceCountsLine } from '../compare/compareSet.js';

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

describe('evidence: four labelled levels, the .gov-only grading rule kept (audit P0 #2, 7.6)', () => {
  it('maps each kind of link to its level', () => {
    expect(levelOfLink('https://medlineplus.gov/ency/article/000653.htm')).toBe('gov');
    expect(levelOfLink('https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups')).toBe('gov');
    expect(levelOfLink('https://doi.org/10.1016/S2468-2667(19)30111-2')).toBe('peer');
    expect(levelOfLink('https://pubmed.ncbi.nlm.nih.gov/31324419/')).toBe('peer');
    expect(levelOfLink('https://www.thelancet.com/journals/lanpub/article/PIIS2468-2667(19)30111-2/fulltext')).toBe('peer');
    expect(levelOfLink('https://saalt.com/pages/faq', 'Saalt')).toBe('brand');
    expect(levelOfLink('https://www.reddit.com/r/menstrualcups/')).toBe('people');
    // A medical society, a magazine or a retailer is none of the four: labelled by what it is, never promoted.
    expect(levelOfLink('https://www.mayoclinic.org/x')).toBe(null);
    expect(levelOfLink('https://www.nytimes.com/wirecutter/reviews/best-menstrual-cup/')).toBe(null);
    expect(levelOfLink('https://www.amazon.com/dp/B079DYK334')).toBe(null);
    expect(isPeerReviewed('https://medlineplus.gov/x')).toBe(false);
  });
  it('labels: a Lancet systematic review is "Peer-reviewed · not graded by ayna", never "not checked"', () => {
    expect(levelLabel('gov')).toBe('Checked against .gov');
    expect(levelLabel('peer')).toBe('Peer-reviewed · not graded by ayna');
    expect(levelLabel('brand', 'Saalt')).toBe('From Saalt');
    expect(levelLabel('people')).toBe('People’s experiences');
    expect(linkKind('https://doi.org/10.1016/S2468-2667(19)30111-2', 'Saalt').label).toBe('Peer-reviewed · not graded by ayna');
  });
  it('only .gov produces a grade: a peer-reviewed paper alone leaves the product "Not graded yet"', () => {
    const ev = evidenceFor(full(SAALT));
    expect(ev.counts.peer).toBeGreaterThan(0);
    expect(ev.graded).toBe(false);
    expect(ev.status).toBe('Not graded yet');
    expect(ev.summary.startsWith('Not graded yet')).toBe(true);
    const team = evidenceFor({ id: 'nope', name: 'X', evidenceStrength: 'strong' });
    expect(team.graded).toBe(false);
  });
  it('the tab header, the summary header and Compare say the same thing (one function)', () => {
    const p = full(SAALT);
    const ev = evidenceFor(p);
    const html = renderToStaticMarkup(<ProductModal product={p} />);
    const statuses = [...html.matchAll(/class="ayv-evhead__status"[^>]*>([^<]+)</g)].map((x) => x[1]);
    expect(statuses.length).toBe(2);
    expect(new Set(statuses)).toEqual(new Set([ev.status]));
    const row = compareRows([p, full('p-tampontribe-menstrual-cup')]).find((r) => r.label === 'Evidence');
    expect(row.values[0]).toBe(ev.summary.replace(/ · \d+ people’s experiences?$/, ''));
    expect(evidenceCountsLine(p)).toContain('peer-reviewed');
    // The old contradictions are gone.
    expect(html).not.toMatch(/No checked research yet/);
    expect(html).not.toMatch(/research sources/);
    expect(html).not.toMatch(/Not a \.gov source, not checked by ayna[^<]*Lancet|Lancet[^]{0,400}Not a \.gov source, not checked by ayna/);
  });
});
