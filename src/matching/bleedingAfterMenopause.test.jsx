// QA B1 (Oct 25): bleeding after menopause. The persona: 54, post-menopause,
// Heavy periods with flow "Heavy", hot flashes, trouble sleeping. The Home
// warning showed, but a flow answer made the cycle look active, so period
// products still got a match on For you, Products sort, the product page,
// You may also like and the Rundown. One predicate now drives both.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ALL_PRODUCTS, getPersonalizedProductIds, getTopMatch, getProductMatchDetailsForProduct, getEcosystemSeedFromQuiz,
  getProductRelevanceScore, getRecommendations, getEcosystemAlternatives,
} from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildProductProfile } from './productProfile.js';
import { buildUserProfile } from './userProfile.js';
import { bleedingAfterMenopause, MENSTRUAL_PRODUCT_NEEDS } from './ontology.js';
import { postmenopausalBleedingBlock } from './eligibility.js';
import { matchPercentFor } from '../mobile/utils/matchScore.js';
import { ProductMatch } from '../components/passport/ProductSections.jsx';
import WhyMatchScreen from '../mobile/screens/WhyMatchScreen.jsx';
import { compareSetRows } from '../components/compare/compareSet.js';

const q = (over) => ({ fullHealthIntake: { ...EMPTY, personalizationCompleted: true, ...over }, personalizationCompleted: true });
const PERSONA = q({ age: '54', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Heavy periods', 'Hot flashes', 'Trouble sleeping'], periodFlow: 'Heavy' });
const PERI = q({ age: '48', lifeStageSelections: ['I am in perimenopause'], supportSelections: ['Heavy periods', 'Hot flashes', 'Trouble sleeping'], periodFlow: 'Heavy' });
const PERIOD_CATS = new Set(['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cup-steamer']);
const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
const isPeriod = (id) => PERIOD_CATS.has(buildProductProfile(byId.get(id)).category);
const tampon = byId.get('p-tampontribe-organic-tampons');
const noPct = (s) => expect(String(s)).not.toMatch(/\d+\s*%/);

describe('B1 engine: one predicate for the warning and the product gate', () => {
  it('the warning shows for the persona even with flow "Heavy"', () => {
    const up = buildUserProfile(PERSONA.fullHealthIntake);
    expect(up.contradictions.map((c) => c.code)).toContain('period_need_vs_stage');
  });
  it('wherever the warning shows, every period need is blocked (and only then)', () => {
    const stages = ['I am post-menopause', 'I am in menopause', 'I am in perimenopause', 'I get periods regularly'];
    const flows = ['', 'Heavy', 'Very heavy', 'Light'];
    for (const stage of stages) for (const periodFlow of flows) {
      const up = buildUserProfile(q({ age: '54', lifeStageSelections: [stage], supportSelections: ['Heavy periods', 'Hot flashes'], periodFlow }).fullHealthIntake);
      const warned = up.contradictions.some((c) => c.code === 'period_need_vs_stage');
      expect(warned, `${stage} ${periodFlow}`).toBe(bleedingAfterMenopause(up.physiology.lifeStages, up.healthIntent.needs.map((n) => n.id)));
      for (const needId of MENSTRUAL_PRODUCT_NEEDS) expect(postmenopausalBleedingBlock(buildProductProfile(tampon), up, needId), `${stage} ${periodFlow} ${needId}`).toBe(warned);
    }
  });
  it('no period product on For you, the top match, My Ecosystem or best-match sort', () => {
    for (const id of getPersonalizedProductIds(PERSONA)) expect(isPeriod(id), id).toBe(false);
    const top = getTopMatch(PERSONA);
    if (top) expect(isPeriod(top.id)).toBe(false);
    for (const id of getEcosystemSeedFromQuiz(PERSONA).shelves.flatMap((s) => s.productIds)) expect(isPeriod(id), id).toBe(false);
    for (const p of ALL_PRODUCTS.filter((x) => isPeriod(x.id))) expect(getProductRelevanceScore(p, PERSONA), p.id).toBe(0);
    const firstPeriod = getRecommendations(PERSONA).findIndex((p) => isPeriod(p.id));
    expect(firstPeriod).toBeGreaterThanOrEqual(getPersonalizedProductIds(PERSONA).length);
  });
  it('a period product: no percent, the prompt-evaluation message with its .gov source', () => {
    const d = getProductMatchDetailsForProduct(tampon, PERSONA);
    expect(d.matchStatus).toBe('bleeding-evaluation');
    expect(d.percent).toBeNull();
    expect(matchPercentFor(tampon, PERSONA)).toBeNull();
    expect(d.bleedingEvaluation.text).toMatch(/12 months or more after your last period should be checked promptly/);
    expect(d.bleedingEvaluation.source.url).toMatch(/^https:\/\/medlineplus\.gov\//);
  });
  it('alternatives for a period product suggest no period product', () => {
    for (const alt of getEcosystemAlternatives(tampon.id, 'period', PERSONA) || []) expect(isPeriod(alt.id ?? alt), String(alt.id ?? alt)).toBe(false);
  });
  it('perimenopause is unchanged: heavy-flow period products still match, no warning', () => {
    const up = buildUserProfile(PERI.fullHealthIntake);
    expect(up.contradictions.map((c) => c.code)).not.toContain('period_need_vs_stage');
    expect(getPersonalizedProductIds(PERI).some(isPeriod)).toBe(true);
    expect(getProductMatchDetailsForProduct(tampon, PERI).matchStatus).not.toBe('bleeding-evaluation');
  });
});

describe('B1 display: the product page shows the message, never a %', () => {
  const d = getProductMatchDetailsForProduct(tampon, PERSONA);
  it('web/app product match block', () => {
    const html = renderToStaticMarkup(<ProductMatch glance={{ sections: [] }} matchPercent={null} hasProfile evaluation={d.bleedingEvaluation} />);
    expect(html).toContain('Get this bleeding checked first');
    expect(html).toContain('checked promptly by an ob-gyn');
    expect(html).toContain('medlineplus.gov');
    noPct(html.replace(/<[^>]+>/g, ' '));
  });
  it('Why this match', () => {
    const html = renderToStaticMarkup(<WhyMatchScreen product={tampon} quizAnswers={PERSONA} />);
    expect(html).toContain('Get this bleeding checked first');
    noPct(html.replace(/<[^>]+>/g, ' '));
  });
  it('Compare row', () => {
    const row = compareSetRows([tampon], { detailsFor: (p) => getProductMatchDetailsForProduct(p, PERSONA) }).find((r) => r.id === 'match');
    expect(row.values[0]).toBe('Get this bleeding checked first');
  });
});

describe('B1 Ask: the same message, no %', async () => {
  const { answerMatchQuestion } = await import('../utils/askMatch.js');
  it('what is my match for a period product', () => {
    const a = answerMatchQuestion('what is my match for this', { catalog: ALL_PRODUCTS, quizAnswers: PERSONA, getDetails: getProductMatchDetailsForProduct, focusProduct: tampon });
    expect(a.answer).toMatch(/checked promptly/);
    noPct(a.answer);
  });
});
