// Oct 19 focus group regressions:
// 1. a user in full menopause who no longer menstruates was shown the Clue
//    period tracker; period/cycle products must not reach her unless she
//    explicitly asks for a need they serve.
// 2. a multi-need profile with a "Drinks or teas" preference got a
//    one-product Ecosystem: the format preference was demoting every
//    non-tea product (pads, creams, apps) below the 50 bar.
// 3. a 39-year-old in perimenopause with regular periods stays matchable for
//    perimenopause needs and period products.
import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getEcosystemSeedFromQuiz } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { buildProductProfile, CYCLE_DEPENDENT_RULES, CYCLE_TRACKING_RULES } from './productProfile.js';
import { scoreProductForNeed } from './score.js';

const intake = (over) => ({ ...EMPTY, ...over });
const user = (over) => buildUserProfile(intake(over), { catalog: ALL_PRODUCTS });
const seedFor = (over, engine) => getEcosystemSeedFromQuiz({ fullHealthIntake: intake(over), personalizationCompleted: true }, null, { engine });
const allIds = (seed) => new Set(seed.shelves.flatMap((s) => s.productIds));
const ENGINES = ['v1', 'v2'];

// Every catalog product whose relevance to some need comes from a rule that
// needs a menstrual cycle to hold (period products, trackers, ovulation tests).
const cycleRuleNeeds = (id) => {
  const pp = buildProductProfile(ALL_PRODUCTS.find((p) => p.id === id));
  return Object.entries(pp.health_need_relevance).filter(([, e]) => CYCLE_DEPENDENT_RULES.has(e.rule)).map(([needId, e]) => ({ needId, rule: e.rule }));
};

describe('menstruation status from explicit answers', () => {
  it('menopause, post-menopause and pregnancy mean no cycle; no-periods answers mean paused', () => {
    expect(user({ lifeStageSelections: ['I am in menopause'] }).physiology.menstruation).toBe('none');
    expect(user({ lifeStageSelections: ['I am post-menopause'] }).physiology.menstruation).toBe('none');
    expect(user({ lifeStageSelections: ['I am pregnant'] }).physiology.menstruation).toBe('none');
    expect(user({ lifeStageSelections: ['I do not currently get periods'] }).physiology.menstruation).toBe('paused');
    expect(user({ supportSelections: ['Period product support'], periodFlow: 'I do not currently get periods' }).physiology.menstruation).toBe('paused');
    expect(user({ menstrualCycle: 'no_menopause' }).physiology.menstruation).toBe('none');
  });

  it('perimenopause never implies irregular or absent periods, and age never decides it', () => {
    expect(user({ age: '39', lifeStageSelections: ['I get periods regularly', 'I am in perimenopause'] }).physiology.menstruation).toBeNull();
    expect(user({ age: '47', lifeStageSelections: ['I am in perimenopause'] }).physiology.menstruation).toBeNull();
    expect(user({ age: '58' }).physiology.menstruation).toBeNull();
    // A period stage alongside menopause is a contradiction to clarify, not "no cycle".
    expect(user({ lifeStageSelections: ['I am in menopause', 'I get periods regularly'] }).physiology.menstruation).toBeNull();
  });
});

describe('bug 1: no period/cycle products for someone who does not menstruate', () => {
  const NON_CYCLE_SUPPORT = ['Hot flashes', 'Night sweats', 'Trouble sleeping', 'Hormone-related symptoms', 'Vaginal dryness',
    'Bladder leakage or incontinence', 'Mood swings', 'Low mood', 'Joint aches', 'Menopause-related body changes', 'Strength or fitness', 'Anxiety'];

  for (const stage of ['I am in menopause', 'I am post-menopause', 'I do not currently get periods', 'I am pregnant']) {
    for (const engine of ENGINES) {
      it(`${stage} (${engine}): no shelf carries a product on cycle-only relevance`, () => {
        const seed = seedFor({ age: '56', lifeStageSelections: [stage], supportSelections: NON_CYCLE_SUPPORT }, engine);
        const up = user({ age: '56', lifeStageSelections: [stage], supportSelections: NON_CYCLE_SUPPORT });
        for (const shelf of seed.shelves) {
          for (const id of shelf.productIds) {
            const r = scoreProductForNeed(buildProductProfile(ALL_PRODUCTS.find((p) => p.id === id)), up, shelf.needId);
            const rule = buildProductProfile(ALL_PRODUCTS.find((p) => p.id === id)).health_need_relevance[shelf.needId]?.rule;
            expect(CYCLE_DEPENDENT_RULES.has(rule), `${id} on ${shelf.needId}`).toBe(false);
            expect(r.filtered).not.toBe('not_menstruating');
          }
        }
        for (const id of ['d-clue', 'd-stardust', 'd-glow', 'd-ovia', 'd-initio', 'p-surearly-smart-ovulation-test', 'p-easyhome-lh-strips-50']) {
          expect(allIds(seed).has(id), id).toBe(false);
        }
      });
    }
  }

  for (const engine of ENGINES) {
    it(`menopause + "Irregular periods" or "Missed periods" (${engine}): cycle trackers are not offered (there is no cycle to track)`, () => {
      const seed = seedFor({ age: '55', lifeStageSelections: ['I am in menopause'], supportSelections: ['Irregular periods', 'Missed periods', 'Hot flashes'] }, engine);
      const up = user({ age: '55', lifeStageSelections: ['I am in menopause'], supportSelections: ['Irregular periods', 'Missed periods', 'Hot flashes'] });
      const ids = allIds(seed);
      for (const id of ids) {
        const pp = buildProductProfile(ALL_PRODUCTS.find((p) => p.id === id));
        for (const shelf of seed.shelves.filter((s) => s.productIds.includes(id))) {
          expect(CYCLE_TRACKING_RULES.has(pp.health_need_relevance[shelf.needId]?.rule), `${id} on ${shelf.needId}`).toBe(false);
        }
      }
      expect(ids.has('d-clue')).toBe(false);
      const clue = scoreProductForNeed(buildProductProfile(ALL_PRODUCTS.find((p) => p.id === 'd-clue')), up, 'cycle.irregular');
      expect(clue.score).toBe(0);
      expect(clue.filtered).toBe('not_menstruating');
    });
  }

  it('the rule is general: every cycle-tracking product scores 0 for a post-menopausal user on any need she did not ask fertility help for', () => {
    const up = user({ age: '60', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Irregular periods', 'Missed periods', 'PMS symptoms', 'Hormone-related symptoms', 'Trouble sleeping'] });
    const trackers = ALL_PRODUCTS.filter((p) => cycleRuleNeeds(p.id).some((x) => CYCLE_TRACKING_RULES.has(x.rule)));
    expect(trackers.length).toBeGreaterThan(5);
    for (const p of trackers) {
      const pp = buildProductProfile(p);
      for (const need of up.healthIntent.needs) {
        const rule = pp.health_need_relevance[need.id]?.rule;
        if (!CYCLE_DEPENDENT_RULES.has(rule)) continue;
        expect(scoreProductForNeed(pp, up, need.id).score, `${p.id} on ${need.id}`).toBe(0);
      }
    }
  });

  it('explicit asks still work: fertility/ovulation support, and period products for period needs she selected', () => {
    const fert = seedFor({ age: '44', lifeStageSelections: ['I do not currently get periods'], supportSelections: ['Ovulation tracking or support'] }, 'v1');
    expect(fert.shelves[0].productIds.length).toBeGreaterThan(0);
    // Spotting after menopause: evaluation first, no products for it (founder, Oct 24).
    const pads = seedFor({ age: '56', lifeStageSelections: ['I am in menopause'], supportSelections: ['Spotting between periods'] }, 'v1');
    expect(pads.shelves.flatMap((sh) => sh.productIds).filter((id) => !/^d-|telehealth/.test(id))).toEqual([]);
    // "No periods now" (cause not stated) can still track an irregular cycle she asked about.
    const paused = seedFor({ age: '28', lifeStageSelections: ['I do not currently get periods'], supportSelections: ['Irregular periods'] }, 'v1');
    expect(paused.shelves[0].productIds.length).toBeGreaterThan(0);
  });

  it('a person with regular periods still gets Clue for irregular cycles (unchanged)', () => {
    const seed = seedFor({ age: '27', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Irregular periods'] }, 'v1');
    expect(seed.shelves[0].productIds.length).toBeGreaterThan(0);
    const up = user({ age: '27', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Irregular periods'] });
    expect(scoreProductForNeed(buildProductProfile(ALL_PRODUCTS.find((p) => p.id === 'd-clue')), up, 'cycle.irregular').score).toBeGreaterThanOrEqual(50);
  });
});

describe('bug 2: a format preference does not empty the Ecosystem', () => {
  const profile = {
    age: '30', lifeStageSelections: ['I get periods regularly'], periodFlow: 'Moderate',
    supportSelections: ['Acne', 'Mood swings', 'PMS symptoms', 'Period product support'],
  };
  for (const engine of ENGINES) {
    it(`multi-need + "Drinks or teas" (${engine}) fills the same shelves as no preference`, () => {
      const tea = seedFor({ ...profile, preferredFormats: ['Drinks or teas'] }, engine);
      const none = seedFor(profile, engine);
      // Before the fix this profile seeded one product on v2 (a single pad).
      expect(allIds(tea).size).toBeGreaterThanOrEqual(4);
      for (const shelf of none.shelves) {
        const teaShelf = tea.shelves.find((s) => s.needId === shelf.needId);
        expect(teaShelf.productIds.length, shelf.needId).toBeGreaterThanOrEqual(shelf.productIds.length);
      }
      // Never padded: every pick still clears the bar for its own need.
      // v2: a partial fit (35+) only where nothing clears 50, or a labelled fallback.
      tea.shelves.forEach((s) => s.picks.forEach((p) => {
        if (engine === 'v1') expect(p.score).toBeGreaterThanOrEqual(50);
        else if (!p.v2?.fallback) expect(p.score).toBeGreaterThanOrEqual(35);
      }));
    });
  }

  it('the preference still ranks within its own kind: tea over pills, and only there', () => {
    const up = user({ supportSelections: ['Trouble sleeping'], preferredFormats: ['Drinks or teas'] });
    const byFormat = (fmt) => ALL_PRODUCTS.map((p) => buildProductProfile(p)).find((pp) => pp.formats.length === 1 && pp.formats[0] === fmt && pp.health_need_relevance['sleep.trouble']);
    const pill = byFormat('pill_capsule');
    const app = byFormat('app_service');
    if (pill) expect(scoreProductForNeed(pill, up, 'sleep.trouble').dimensions.values.format).toBe(0.4);
    if (app) expect(scoreProductForNeed(app, up, 'sleep.trouble').dimensions.values.format).toBeNull();
  });

  it('an empty shelf still reports no strong matches instead of filler', () => {
    const seed = seedFor({ ...profile, preferredFormats: ['Drinks or teas'] }, 'v1');
    const pms = seed.shelves.find((s) => s.needId === 'cycle.pms');
    expect(pms.productIds).toHaveLength(0);
    expect(pms.emptyReason).toBeTruthy();
  });
});

describe('bug 3: perimenopause with regular periods', () => {
  const p39 = { age: '39', lifeStageSelections: ['I get periods regularly', 'I am in perimenopause'], periodFlow: 'Moderate' };
  for (const engine of ENGINES) {
    it(`a 39-year-old with regular periods in perimenopause gets perimenopause needs and period products (${engine})`, () => {
      const up = user({ ...p39, supportSelections: ['Hot flashes', 'Period product support'] });
      expect(up.physiology.lifeStages).toEqual(['regular_periods', 'perimenopause']);
      expect(up.physiology.compatibility.conflictingStages).toEqual([]);
      expect(up.physiology.confidenceFlags).not.toContain('unusual_combination');
      expect(up.contradictions.map((c) => c.code)).toEqual([]);
      const seed = seedFor({ ...p39, supportSelections: ['Hot flashes', 'Period product support'] }, engine);
      const shelf = (id) => seed.shelves.find((s) => s.needId === id);
      expect(shelf('vasomotor.hot_flashes').productIds.length).toBeGreaterThan(0);
      expect(shelf('period.product_support').productIds.length).toBeGreaterThan(0);
      // Same period picks as someone with regular periods alone (no penalty for perimenopause).
      const regular = seedFor({ age: '39', lifeStageSelections: ['I get periods regularly'], periodFlow: 'Moderate', supportSelections: ['Period product support'] }, engine);
      expect(shelf('period.product_support').picks[0].score).toBeGreaterThanOrEqual(regular.shelves[0].picks[0].score);
    });
  }
});
