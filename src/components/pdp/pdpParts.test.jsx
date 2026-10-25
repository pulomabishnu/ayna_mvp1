// @vitest-environment node
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { topWarningFor, brandVoice, pregnancyFirstFrom } from './pdpParts.js';
import { fitChecklist, matchLineState, evidenceMeter, splitShow, shortAnswer, mainCaution, sortSources, clinicianOf, glanceTiles, whoLists, keyFormat, criticalIndex, splitLead, heroNotes, dedupeList, leadClause } from './pdpParts.js';
import { buyModel } from './buyModel.js';
import ProductEvidence from './ProductEvidence.jsx';
import { MatchLine, ShowAll, EvidenceMeter, SafetyLine } from './PdpParts.jsx';
import { ALL_PRODUCTS, withResearch } from '../../data/products.js';
import { PRODUCT_RESEARCH } from '../../data/productResearch.js';
import { buildEvidence } from './evidenceModel.js';
import { buildGlance } from './glance.js';
import { evidenceLevel } from './evidenceLevel.js';

const product = (id) => withResearch(ALL_PRODUCTS.find((p) => p.id === id), PRODUCT_RESEARCH);
const text = (el) => renderToStaticMarkup(el).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('Is it for you: built only from data on file', () => {
  it('without a profile: who it is for, clinician checks and not-for lines, all from the team text', () => {
    const items = fitChecklist({
      who: ['People with period cramps who want heat', 'Not for wearing while you sleep: MedlinePlus advises never falling asleep with a heating pad on'],
      warnings: ['Ask your doctor before use if you have diabetes.', 'Don\'t crush the pad.'],
    });
    expect(items).toEqual([
      { tone: 'check', text: 'Ask your doctor before use if you have diabetes.', from: 'warning' },
      { tone: 'yes', text: 'People with period cramps who want heat', from: 'who' },
      { tone: 'no', text: 'Not for wearing while you sleep: MedlinePlus advises never falling asleep with a heating pad on', from: 'who' },
    ]);
  });
  it('with a profile: her reasons first (a miss is never a tick), then exclusions as not-for', () => {
    const items = fitChecklist({ details: { matchStatus: 'scored', percent: 82, reasonDetails: [{ text: 'Fits your heavy flow' }, { text: 'Price is above your budget' }] }, who: ['Anyone who wants a portable version'] });
    expect(items.map((x) => [x.tone, x.text])).toEqual([['yes', 'Fits your heavy flow'], ['no', 'Price is above your budget'], ['yes', 'Anyone who wants a portable version']]);
    const ex = fitChecklist({ details: { matchStatus: 'excluded', excludedBecause: ['you are pregnant'] } });
    expect(ex).toEqual([{ tone: 'no', text: 'Not shown because you are pregnant', from: 'match' }]);
  });
  it('a safety hold or the bleeding evaluation leads as a check item, with no reasons or %', () => {
    const hold = fitChecklist({ details: { matchStatus: 'safety-hold', safetyHold: { reason: 'We need to know your medications.' }, reasonDetails: [{ text: 'Fits your cramps' }] } });
    expect(hold).toEqual([{ tone: 'check', text: 'We need to know your medications.', from: 'hold' }]);
    const ev = fitChecklist({ details: { matchStatus: 'bleeding-evaluation', bleedingEvaluation: { text: 'Bleeding after menopause should be checked by a clinician.' } } });
    expect(ev[0]).toEqual({ tone: 'check', text: 'Bleeding after menopause should be checked by a clinician.', from: 'hold' });
  });
  it('a real product: every item is a line from its record', () => {
    const p = product('p-portable-heating');
    const m = buildEvidence(p, {});
    const items = fitChecklist({ who: m.who, warnings: m.safety.warnings });
    const source = [...m.who, ...m.safety.warnings];
    expect(items.length).toBeGreaterThan(2);
    for (const x of items) expect(source.some((s) => s.includes(x.text) || x.text.includes(s))).toBe(true);
  });
  it('Who it\'s for and Not for come from her reasons and the team lines; clinician checks go to Safety', () => {
    const l = whoLists({ details: { matchStatus: 'scored', reasonDetails: [{ text: 'Fits your heavy flow' }, { text: 'Price is above your budget' }] }, who: ['People with cramps', 'Not for sleeping in'] });
    expect(l).toEqual({ yes: ['Fits your heavy flow', 'People with cramps'], no: ['Price is above your budget', 'Not for sleeping in'] });
    expect(whoLists({ details: { matchStatus: 'safety-hold', safetyHold: { reason: 'x' } }, who: ['A'] })).toEqual({ yes: ['A'], no: [] });
  });
});

describe('the match line: never 0%, hold and evaluation replace the number', () => {
  it('maps every state', () => {
    expect(matchLineState({ hasProfile: false })).toBeNull();
    expect(matchLineState({ hasProfile: false, canQuiz: true })).toEqual({ kind: 'quiz' });
    expect(matchLineState({ hasProfile: true, details: { matchStatus: 'scored' }, percent: 86.4, why: 'For your heavy flow' })).toEqual({ kind: 'pct', percent: 86, why: 'For your heavy flow' });
    expect(matchLineState({ hasProfile: true, details: { matchStatus: 'scored' }, percent: 0 }).kind).toBe('none');
    expect(matchLineState({ hasProfile: true, details: { matchStatus: 'safety-hold', safetyHold: { reason: 'x' } }, percent: 80 }).kind).toBe('hold');
    expect(matchLineState({ hasProfile: true, details: { matchStatus: 'bleeding-evaluation', bleedingEvaluation: { text: 'Get checked' } }, percent: 80 }).kind).toBe('evaluation');
  });
  it('a hold or evaluation never prints a percent', () => {
    const hold = text(<MatchLine state={matchLineState({ hasProfile: true, details: { matchStatus: 'safety-hold', safetyHold: { reason: 'We need your medications.', kind: 'user' } }, percent: 80 })} />);
    expect(hold).toContain('Safety hold');
    expect(hold).toContain('Match unavailable');
    expect(hold).not.toMatch(/\d+%/);
    const ev = text(<MatchLine state={matchLineState({ hasProfile: true, details: { matchStatus: 'bleeding-evaluation', bleedingEvaluation: { text: 'Bleeding after menopause needs a check.' } }, percent: 80 })} />);
    expect(ev).toContain('Bleeding after menopause needs a check.');
    expect(ev).not.toMatch(/\d+%/);
    expect(text(<MatchLine state={{ kind: 'pct', percent: 86, why: 'For your heavy flow' }} />)).toContain('86%');
  });
});

describe('the evidence meter maps the existing grade', () => {
  it('levels 1-3 fill that many of 3 bars with the grade word; no grade is its own state', () => {
    expect(evidenceMeter({ level: 0 })).toMatchObject({ level: 0, empty: true, label: 'No checked research yet' });
    expect(evidenceMeter({ level: 2, word: 'Supported for this type', scope: 'type', line: 'L', need: 'period cramps' })).toMatchObject({ level: 2, of: 3, empty: false, label: 'Good evidence for this type of product for period cramps · not studied as this exact product', note: 'L' });
    expect(evidenceMeter({ level: 3, word: 'Strong evidence', scope: 'product' }).note).toBe('Graded by ayna from .gov health sources.');
    expect(evidenceMeter({ level: 1, word: 'Limited evidence', scope: 'team' }).note).toMatch(/team recorded/);
    expect(evidenceMeter({ level: 9 }).level).toBe(3);
  });
  it('draws filled bars for the level and an accessible name', () => {
    const html = renderToStaticMarkup(<EvidenceMeter meter={{ level: 2, of: 3, empty: false, label: 'Some evidence', note: '' }} />);
    expect((html.match(/class="is-on"/g) || []).length).toBe(2);
    expect(html).toContain('aria-label="Some evidence, 2 of 3"');
    expect(text(<EvidenceMeter meter={evidenceMeter({ level: 0 })} />)).toContain('No checked research yet');
  });
  it('a real graded product reads the same grade as everywhere else', () => {
    const p = product('p-portable-heating');
    const ev = evidenceLevel(p);
    expect(evidenceMeter(ev).level).toBe(ev.level);
    expect(evidenceMeter(ev).label).toMatch(/evidence for this type of product for period cramps · not studied as this exact product/);
  });
});

describe('Show all N', () => {
  it('splits 3 shown, the rest waiting, nothing dropped', () => {
    expect(splitShow([1, 2, 3, 4, 5])).toEqual({ shown: [1, 2, 3], rest: [4, 5], total: 5 });
    expect(splitShow([1, 2])).toEqual({ shown: [1, 2], rest: [], total: 2 });
  });
  it('keeps the rest in the page (hidden) and names the count', () => {
    const html = renderToStaticMarkup(<ShowAll items={['a', 'b', 'c', 'd', 'e']} label="sources" render={(x) => x} />);
    expect((html.match(/<li/g) || []).length).toBe(5);
    expect((html.match(/hidden=""/g) || []).length).toBe(2);
    expect(html).toContain('Show all 5 sources');
    expect(renderToStaticMarkup(<ShowAll items={['a', 'b']} render={(x) => x} />)).not.toContain('Show all');
  });
});

describe('summary pieces', () => {
  it('the short answer is at most 3 bullets, the team\'s own when they wrote one', () => {
    const m = { expert: { short: ['a.', 'b.', 'c.', 'd.'] }, who: [] };
    expect(shortAnswer({ m })).toEqual({ bullets: ['a.', 'b.', 'c.'], rest: ['d.'], fromTeam: true });
    const m2 = { expert: { short: [] }, who: ['Not for kids', 'People with cramps'] };
    expect(shortAnswer({ m: m2, lead: 'A heating pad.', ev: { scope: 'type', line: 'Supported.' } }).bullets).toEqual(['A heating pad.', 'Supported.', 'People with cramps']);
  });
  it('the main caution is not the one already in the safety box, and skips care tips', () => {
    const m = { safety: { warnings: ['Wash before use.', 'Never use while asleep.', 'Ask your doctor if pregnant.'] } };
    expect(mainCaution(m, 'Never use while asleep.')).toBe('Ask your doctor if pregnant.');
    expect(mainCaution(m, '')).toBe('Never use while asleep.');
  });
  it('sources sort strongest first: reviews and meta-analyses, trials, then the rest', () => {
    const s = sortSources([{ title: 'Fact sheet' }, { title: 'A randomized controlled trial' }, { type: 'Systematic review', title: 'x' }]);
    expect(s.map((x) => x.title)).toEqual(['x', 'A randomized controlled trial', 'Fact sheet']);
  });
  it('a clinician card only for a named clinician, never for an ayna synthesis', () => {
    expect(clinicianOf({ synthesis: true, attribution: 'ayna synthesis' })).toBeNull();
    expect(clinicianOf({ synthesis: false, attribution: 'Reviewed per the brand by Dr. Aimee Eyvazzadeh, MD, MPH' })).toMatchObject({ who: 'Dr. Aimee Eyvazzadeh', credential: 'MD, MPH' });
  });
  it('At a glance has 4-6 tiles, each a label and a value', () => {
    const p = product('p-nature-made-iron-65mg');
    const tiles = glanceTiles({ glance: buildGlance(p, {}), m: buildEvidence(p, {}) });
    expect(tiles.length).toBeGreaterThanOrEqual(3);
    expect(tiles.length).toBeLessThanOrEqual(6);
    for (const t of tiles) { expect(t.label).toBeTruthy(); expect(t.main).toBeTruthy(); }
  });
  it('the hero safety line shows the line and a jump to Safety, no box', () => {
    const html = text(<SafetyLine text="Never use while asleep." />);
    expect(html).toContain('Never use while asleep.');
    expect(html).toContain('Safety');
    expect(renderToStaticMarkup(<SafetyLine text="" />)).toBe('');
  });
  it('Key facts format is the product\'s form, never its shop category', () => {
    expect(keyFormat(product('p-portable-heating'), 'Comfytemp')).toBe('Portable heating pad');
    expect(keyFormat(product('p-nature-made-iron-65mg'))).toBe('Tablets');
    expect(keyFormat(product('d-ppd'))).toBe('Virtual care service');
  });
  it('the critical safety item is the one the hero line echoes', () => {
    expect(criticalIndex(['Wash it.', 'Never use a heating pad while you are asleep.'], 'Never use a heating pad while you are asleep.')).toBe(1);
    expect(criticalIndex(['Pregnancy: Label: consult a physician'], 'Pregnancy: Label: consult a physician before use if pregnant.')).toBe(0);
    expect(criticalIndex(['a'], '')).toBe(-1);
  });

});

describe('shopper pass', () => {
  it('one buy model: the same link and label on every surface', () => {
    const b = buyModel(product('p-portable-heating'));
    expect(b.retailer).toBe('Amazon');
    expect(b.label).toBe('Buy at Amazon · $30');
    expect(b.rows[0]).toMatchObject({ name: 'Amazon', primary: true });
    expect(buyModel(product('d-ppd'), { name: 'Planned Parenthood Direct' }).label).toBe('Visit Planned Parenthood Direct');
  });
  it('a spec first sentence becomes Strength and the next sentence is the one-liner', () => {
    const s = splitLead(product('p-nature-made-iron-65mg'));
    expect(s.strength).toMatch(/^65 mg elemental iron/);
    expect(s.lead).toMatch(/^Supports red blood cell/);
    expect(splitLead(product('p-portable-heating')).strength).toBe('');
  });
  it('price notes keep units by the price, features move out', () => {
    expect(heroNotes(['$0.06 per tablet', '180 tablets', 'Rechargeable', 'Sliding scale'])).toEqual({ keep: ['$0.06 per tablet', '180 tablets', 'Sliding scale'], moved: ['Rechargeable'] });
  });
  it('dedupes a list and finds the first clause', () => {
    expect(dedupeList('Cramp & pain relief, Cramps')).toBe('Cramp & pain relief');
    expect(dedupeList('Contraception, UTI support, UTI')).toBe('Contraception, UTI support');
    expect(leadClause('People with period cramps who want heat')).toEqual(['People with period cramps', ' who want heat']);
    expect(leadClause('Those who like to adjust the heat, since it has 3 settings')).toEqual(['Those who like to adjust the heat', ', since it has 3 settings']);
    expect(leadClause('Short line')).toEqual(['', 'Short line']);
  });
});

describe('last round', () => {
  it('a severe warning leads the safety line, unless she is pregnant, trying or postpartum', () => {
    const iron = product('p-nature-made-iron-65mg');
    const g = buildGlance(iron, {});
    expect(topWarningFor(iron, g)).toMatch(/fatal poisoning in children/);
    expect(topWarningFor(iron, g, undefined, { pregnancyFirst: true })).toMatch(/^Pregnancy:/);
    expect(pregnancyFirstFrom({ fullHealthIntake: { lifeStageSelections: ['I am pregnant'] } })).toBe(true);
    expect(pregnancyFirstFrom({ fullHealthIntake: { lifeStageSelections: ['I get periods regularly'] } })).toBe(false);
  });
  it('the Safety list leads with the same item as the hero line', () => {
    const iron = product('p-nature-made-iron-65mg');
    const html = renderToStaticMarkup(<ProductEvidence product={iron} glance={buildGlance(iron, {})} safetyLead={topWarningFor(iron, buildGlance(iron, {}))} syncHash={false} />);
    const safety = html.slice(html.indexOf('id="ay-sum-safety"'));
    const first = safety.slice(safety.indexOf('is-critical'), safety.indexOf('</li>', safety.indexOf('is-critical')));
    expect(first).toMatch(/fatal poisoning in children/);
  });
  it('a benefit claim from the summary is the brand\'s, never ayna\'s', () => {
    expect(brandVoice('Supports red blood cell formation and energy.', 'Nature Made')).toBe('Nature Made says it supports red blood cell formation and energy.');
    expect(brandVoice('Rechargeable, wearable heating pad.', 'Comfytemp')).toBe('Rechargeable, wearable heating pad.');
  });
});
