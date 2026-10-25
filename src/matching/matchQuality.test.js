// Match quality (team direction 14, 15, 18, 59, 60, 64, 65; UX spec 13).
// Golden personas for life stage, weak signals, variety, catalog
// eligibility, curated discovery and remembered history, on every engine
// surface: My Ecosystem shelves, Shop For you (getPersonalizedProductIds),
// Ask's top match (getTopMatch), the product page / Rundown details, Today.
import { describe, it, expect } from 'vitest';
import {
  ALL_PRODUCTS, getEcosystemSeedFromQuiz, getPersonalizedProductIds, getTopMatch, getProductMatchDetailsForProduct, getEcosystemAlternatives,
} from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { buildProductProfile } from './productProfile.js';
import { recommendationGateReport, isCycleTrackingProduct } from './eligibility.js';
import { needSignals, orderForYou, discoveryValue, historyState } from './forYou.js';
import { V2 } from './v2.js';
import { decide, addDays } from '../health/decisionEngine.js';
import { buildRundown } from '../components/rundown/buildRundown.js';
import { behaviorFrom } from '../utils/matchDisplay.js';

const q = (over) => ({ fullHealthIntake: { ...EMPTY, personalizationCompleted: true, ...over }, personalizationCompleted: true });
const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
const pp = (id) => buildProductProfile(byId.get(id));
const ecoIds = (answers, opts) => new Set(getEcosystemSeedFromQuiz(answers, null, opts).shelves.flatMap((s) => s.productIds));
const shopIds = (answers, opts) => getPersonalizedProductIds(answers, null, opts);
/** Every personalized surface's product ids for her. */
function surfaces(answers, opts) {
  const top = getTopMatch(answers, null, opts);
  return { eco: [...ecoIds(answers, opts)], shop: shopIds(answers, opts), top: top ? [top.id] : [] };
}
const CYCLE_TOOLS = ALL_PRODUCTS.filter((p) => isCycleTrackingProduct(buildProductProfile(p))).map((p) => p.id);
const PERIOD_CATS = new Set(['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cup-steamer']);

// Everything a midlife user without a cycle might pick, including cycle and fertility options.
const MIDLIFE_PICKS = ['Hot flashes', 'Night sweats', 'Trouble sleeping', 'Hormone-related symptoms', 'Vaginal dryness', 'Joint aches',
  'Irregular periods', 'PMS symptoms', 'Ovulation tracking or support', 'Contraception', 'Missed periods', 'Cycle-related mood changes', 'Breast tenderness'];

describe('1. life stage before preference', () => {
  it('the catalog has cycle trackers and ovulation tests to guard against', () => {
    expect(CYCLE_TOOLS).toEqual(expect.arrayContaining(['d-clue', 'd-flo-app', 'd-natural-cycles', 'p-easyhome-lh-strips-50'].filter((id) => byId.has(id))));
    expect(CYCLE_TOOLS.length).toBeGreaterThanOrEqual(8);
  });

  for (const stage of ['I am in menopause', 'I am post-menopause']) {
    it(`${stage}: no period tracker, ovulation test or PMS product on any surface, even for cycle picks`, () => {
      for (const pick of MIDLIFE_PICKS) {
        const answers = q({ age: '56', lifeStageSelections: [stage], supportSelections: [pick] });
        const s = surfaces(answers);
        for (const id of [...s.eco, ...s.shop, ...s.top]) {
          expect(CYCLE_TOOLS, `${pick}: ${id}`).not.toContain(id);
          expect(id, pick).not.toBe('p-flo-gummies');
          expect(id, pick).not.toBe('p-evening-primrose');
          expect(id, pick).not.toBe('p-vitex');
        }
      }
    });
    it(`${stage}: the product page says why a period tracker is not a match`, () => {
      const d = getProductMatchDetailsForProduct(byId.get('d-clue'), q({ age: '56', lifeStageSelections: [stage], supportSelections: ['Irregular periods', 'Hot flashes'] }));
      expect(d.eligible).toBe(false);
      expect(d.excludedBecause.join(' ')).toMatch(/do not get periods now/);
      expect(d.excludedBecause.join(' ')).not.toMatch(/\u2014/);
    });
  }

  it('menopause with no cycle picks: never a period product', () => {
    const s = surfaces(q({ age: '55', lifeStageSelections: ['I am in menopause'], supportSelections: ['Hot flashes', 'Trouble sleeping', 'Vaginal dryness', 'Anxiety'] }));
    for (const id of [...s.eco, ...s.shop]) expect(PERIOD_CATS.has(pp(id).category), id).toBe(false);
  });

  it('menopause + an explicit bleeding pick: no products for that bleeding, a prompt-evaluation note with a .gov source (founder, Oct 24)', () => {
    const answers = q({ age: '55', lifeStageSelections: ['I am in menopause'], supportSelections: ['Hot flashes', 'Heavy periods'] });
    const seed = getEcosystemSeedFromQuiz(answers);
    const heavy = seed.shelves.find((s) => s.needId === 'period.heavy');
    // Care services may stay (the evaluation path); no product is put forward for the bleeding.
    for (const id of heavy?.productIds || []) { const p = pp(id); expect(Boolean(p.is_digital || p.access?.is_care_service), id).toBe(true); }
    const note = seed.careFlags.notes.find((n) => n.code === 'period_need_vs_stage');
    expect(note.text).toMatch(/12 months or more after your last period should be checked promptly by an ob-gyn/);
    expect(note.source.url).toMatch(/^https:\/\/medlineplus\.gov\//);
    expect(seed.careFlags.careProminent).toBe(true);
    // Unrelated needs still get recommendations.
    expect(seed.shelves.find((s) => s.needId !== 'period.heavy' && s.productIds.length)).toBeTruthy();
  });

  it('pregnant: no cycle tracker or ovulation test, and nothing swallowed with unknown pregnancy safety', () => {
    const s = surfaces(q({ age: '31', lifeStageSelections: ['I am pregnant'], supportSelections: ['Ovulation tracking or support', 'Trouble sleeping', 'Nausea', 'Pregnancy-related discomfort'] }));
    for (const id of [...s.eco, ...s.shop, ...s.top]) {
      expect(CYCLE_TOOLS).not.toContain(id);
      const p = pp(id);
      if (p.ingested) expect(['unknown', 'avoid', 'contraindicated']).not.toContain(p.pregnancy?.overall);
    }
  });

  it('postpartum and breastfeeding: nothing that is not for breastfeeding', () => {
    const s = surfaces(q({ age: '33', lifeStageSelections: ['I am postpartum'], breastfeeding: 'Yes', breastfeedingStatus: 'Yes', supportSelections: ['Postpartum recovery', 'Trouble sleeping', 'Hair thinning or hair loss'] }));
    for (const id of [...s.eco, ...s.shop]) expect(pp(id).breastfeeding?.overall, id).not.toBe('contraindicated');
  });

  it('age: a product with a minimum age is never matched below it, and teen products never', () => {
    const limited = ALL_PRODUCTS.find((p) => buildProductProfile(p).age.minimum >= 21);
    if (limited) {
      const age = String(buildProductProfile(limited).age.minimum - 2);
      const d = getProductMatchDetailsForProduct(limited, q({ age, lifeStageSelections: ['I get periods regularly'], supportSelections: ['Trouble sleeping', 'Hot flashes'] }));
      expect(d.eligible).toBe(false);
    }
    const s = surfaces(q({ age: '19', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Acne', 'Cramps or period pain'] }));
    for (const id of s.shop) expect(/\b(teen|teens|tween)\b/i.test(byId.get(id).name)).toBe(false);
  });

  describe('Today options', () => {
    const TODAY = '2026-10-24';
    const painLogs = Array.from({ length: 4 }, (_, i) => ({ day: addDays(TODAY, -i), pain: 2, flow: 'none', pms: 2, sleep: 1, mood: 1, skin: 2 }));
    const midlife = buildUserProfile({ ...EMPTY, age: '57', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Trouble sleeping', 'Joint aches'], takesCurrent: 'No', allergyStatus: 'No', safetyConcern: 'No' });
    it('post-menopause: logged pain is not period pain, no PMS, and never "Track it for three cycles"', () => {
      const d = decide({ today: TODAY, logs: painLogs, profile: midlife, intent: { showOptions: true } });
      const all = [...d.items, ...(d.debug?.ranked || [])];
      expect(all.some((i) => /period_pain|:pms/.test(i.id))).toBe(false);
      expect(all.some((i) => /^option:tracking/.test(i.id) || /three cycles/i.test(i.title || ''))).toBe(false);
      for (const i of all) expect(i.reason || '').not.toMatch(/around your cycle/);
    });
    it('regular periods: tracking is still offered for period pain', () => {
      const regular = buildUserProfile({ ...EMPTY, age: '27', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain'], takesCurrent: 'No', allergyStatus: 'No', safetyConcern: 'No' });
      const d = decide({ today: TODAY, logs: painLogs, profile: regular, intent: { showOptions: true, need: 'period_pain' } });
      expect([...d.items, ...(d.debug?.ranked || [])].some((i) => /^option:tracking/.test(i.id))).toBe(true);
    });
  });
});

describe('2. weak signals do not flood', () => {
  const answers = q({ age: '29', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain'], anythingElse: 'I also want clearer skin, my acne is annoying' });
  const up = buildUserProfile(answers.fullHealthIntake, { catalog: ALL_PRODUCTS });
  const signals = needSignals(up);

  it('defines weak: read from her words while she picked other needs', () => {
    expect(signals.get('pain.menstrual_cramp')).toMatchObject({ tier: 'primary', weak: false });
    const typed = [...signals.entries()].filter(([id]) => id !== 'pain.menstrual_cramp');
    expect(typed.length).toBeGreaterThan(0);
    for (const [, s] of typed) expect(s.weak).toBe(true);
  });
  it('a weak need never reads as a Strong match and counts for less', () => {
    const weakId = [...signals.entries()].find(([, s]) => s.weak)[0];
    for (const p of ALL_PRODUCTS) {
      const d = getProductMatchDetailsForProduct(p, answers, null, { needId: weakId });
      if (d.needId === weakId && d.v2) expect(d.v2.fit).toBeLessThanOrEqual(V2.weakFitFactor + 1e-9);
    }
  });
  it('the weak need takes at most a quarter of the first 12 For you spots, and her picked need leads', () => {
    const shop = shopIds(answers);
    const first = shop.slice(0, 12).map((id) => getProductMatchDetailsForProduct(byId.get(id), answers).needId);
    expect(first.filter((n) => signals.get(n)?.weak).length).toBeLessThanOrEqual(3);
    expect(signals.get(getProductMatchDetailsForProduct(getTopMatch(answers), answers).needId)?.weak).toBe(false);
  });
  it('the Rundown match card prefers her picked need over a weak one', () => {
    const mk = (id, needId, percent, needSignal) => ({ product: { id }, needId, percent, needSignal, why: 'x', evidence: 'moderate' });
    const out = buildRundown({ today: '2026-10-24', matches: [mk('a', 'skin.acne', 95, 'weak'), mk('b', 'pain.menstrual_cramp', 80, 'primary')], decision: { items: [], debug: { needs: { period_pain: {} } } }, log: {}, patterns: [], healthRows: [], saved: [] });
    const card = out.cards.find((c) => c.kind === 'match');
    if (card) expect(card.match.product.id).toBe('b');
  });
  it('picking needs herself is never weak; the first pick is primary', () => {
    const s = needSignals(buildUserProfile({ ...EMPTY, supportSelections: ['Acne', 'Trouble sleeping', 'Anxiety'] }, { catalog: ALL_PRODUCTS }));
    expect([...s.values()].map((x) => x.tier)).toEqual(['primary', 'picked', 'picked']);
  });
});

describe('3. variety when several strong options exist', () => {
  it('multiple formats + several needs: useful breadth, every pick clears its own bar', () => {
    const seed = getEcosystemSeedFromQuiz(q({ age: '30', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain', 'Heavy periods', 'Vaginal dryness'], preferredFormats: ['Pills or capsules', 'Creams, lotions, or gels', 'Devices or wearables'], takesCurrent: 'No' }));
    const all = seed.shelves.flatMap((s) => s.picks);
    expect(new Set(all.map((p) => p.productId)).size).toBeGreaterThanOrEqual(6);
    for (const s of seed.shelves) {
      const full = s.picks.filter((p) => p.v2 && p.v2.band !== 'partial');
      // No padding: a partial fit only where nothing on the shelf is a full fit.
      if (full.length) for (const p of s.picks) if (!p.v2?.fallback) expect(p.v2.fit).toBeGreaterThanOrEqual(V2.ecosystemFloor);
    }
    // Different types on one shelf, not the same thing twice.
    const heavy = seed.shelves.find((s) => s.needId === 'period.heavy');
    expect(new Set(heavy.picks.map((p) => pp(p.productId).category)).size).toBe(heavy.picks.length);
    expect(heavy.picks.length).toBeGreaterThanOrEqual(2);
  });
  it('does not force variety: a need with nothing that fits stays short', () => {
    const seed = getEcosystemSeedFromQuiz(q({ age: '30', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Excess facial or body hair'], takesCurrent: 'No' }));
    for (const p of seed.shelves[0].picks) expect(p.v2?.fit ?? 0).toBeGreaterThanOrEqual(V2.partialFloor);
  });
});

describe('4. catalog ingestion -> validation -> eligibility -> matching', () => {
  const report = recommendationGateReport(ALL_PRODUCTS);
  it('lists what the gate keeps out of recommendations, each with a reason', () => {
    expect(report.map((r) => r.id).sort()).toEqual([
      'p-gina-insertion-applicator-refills', 'p-lim-method-kneeling-pad', 'p-lim-method-shoe-covers',
      'p-mypelvicbra-waistband-extenders', 'p-saalt-cup-steamer', 'p-sootheher-gel-pad-refills',
    ].filter((id) => byId.has(id)).sort());
    for (const r of report) expect(r.reason).toBeTruthy();
  });
  it('a failed validation or missing facts keeps a listing out', async () => {
    const { recommendationEligibility } = await import('./eligibility.js');
    expect(recommendationEligibility({ id: 'x', name: 'X', category: 'pad', whereToBuy: ['Target'], tags: ['pad'], validation: { status: 'failed' } }).code).toBe('failed_validation');
    expect(recommendationEligibility({ id: 'x', name: 'X', category: 'pad', tags: ['pad'] }).code).toBe('failed_validation');
    expect(recommendationEligibility({ id: 'x', name: 'X', category: 'pad', whereToBuy: ['Target'], tags: ['pad'] }).eligible).toBe(true);
  });
  it('gated items never reach a shelf, For you, alternatives or the top match; their page still has a match', () => {
    const gated = new Set(report.map((r) => r.id));
    const people = [
      q({ age: '28', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Period product support', 'Cramps or period pain'] }),
      q({ age: '34', lifeStageSelections: ['I am postpartum'], supportSelections: ['Bladder leakage or incontinence', 'Postpartum recovery', 'Vaginal dryness'] }),
      q({ age: '40', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Pain or discomfort during sex', 'Vaginal dryness'] }),
    ];
    for (const a of people) {
      const s = surfaces(a);
      for (const id of [...s.eco, ...s.shop, ...s.top]) expect(gated.has(id), id).toBe(false);
      for (const id of getEcosystemAlternatives('p-saalt-cup', 'period.product_support', a).map((p) => p.id)) expect(gated.has(id)).toBe(false);
    }
    const d = getProductMatchDetailsForProduct(byId.get('p-saalt-cup-steamer'), people[0]);
    expect(d.recommendable).toBe(false);
    expect(d.notRecommendedBecause).toMatch(/accessory/i);
  });
});

describe('5. curated discovery', () => {
  it('services and women’s-health products rank ahead of generic drugstore items at the same percent; the percent never changes', () => {
    const answers = q({ age: '26', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain'], takesCurrent: 'No' });
    const up = buildUserProfile(answers.fullHealthIntake, { catalog: ALL_PRODUCTS });
    const rows = [
      { productId: 'p-advil-ibuprofen-200', score: 80, needId: 'pain.menstrual_cramp' },
      { productId: 'p-aleve-naproxen-220', score: 80, needId: 'pain.menstrual_cramp' },
      { productId: 'p-thermacare', score: 80, needId: 'pain.menstrual_cramp' },
      { productId: 'd-visana', score: 70, needId: 'pain.menstrual_cramp' },
    ];
    const out = orderForYou(rows, up, { profileOf: pp });
    expect(out.map((r) => r.productId)).toEqual(['p-thermacare', 'p-advil-ibuprofen-200', 'p-aleve-naproxen-220', 'd-visana']);
    expect(out.map((r) => r.score)).toEqual([80, 80, 80, 70]);
    expect(discoveryValue(pp('d-visana'))).toBeGreaterThan(discoveryValue(pp('p-advil-ibuprofen-200')));
  });
  it('For you keeps common products but no more than two generic drugstore items in the first eight', async () => {
    const { BASICS_PRODUCT_IDS } = await import('../data/products.js');
    const answers = q({ age: '26', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain', 'Acne', 'Constipation', 'Yeast infection concerns'], takesCurrent: 'No' });
    const shop = shopIds(answers);
    const basics = shop.filter((id) => BASICS_PRODUCT_IDS.has(id) || pp(id).category === 'medication');
    // A third generic item only enters the first eight once nothing else is left.
    const isBasic = (id) => basics.includes(id);
    const third = shop.findIndex((id, i) => isBasic(id) && shop.slice(0, i + 1).filter(isBasic).length === 3);
    if (third >= 0 && third < 8) expect(shop.slice(third).some((id) => !isBasic(id))).toBe(false);
    expect(basics.length).toBeGreaterThan(0); // still there, just not every top spot
  });
});

describe('6. remembered history, with undo', () => {
  const answers = q({ age: '27', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain', 'Trouble sleeping'], takesCurrent: 'No' });
  const base = shopIds(answers, behaviorFrom({}));
  const target = base[0];
  it('"Not relevant" takes it out of For you, the ecosystem and the top match; undo brings it back', () => {
    const dismissed = behaviorFrom({ dismissed: { [target]: true } });
    expect(shopIds(answers, dismissed)).not.toContain(target);
    expect(ecoIds(answers, dismissed).has(target)).toBe(false);
    expect(getTopMatch(answers, null, dismissed)?.id).not.toBe(target);
    // Its own page still shows her match (not hidden like "Not for me").
    expect(getProductMatchDetailsForProduct(byId.get(target), answers, null, dismissed).eligible).toBe(true);
    // Undo: the entry is gone, so is the effect.
    expect(shopIds(answers, behaviorFrom({ dismissed: {} }))).toContain(target);
  });
  it('"Not relevant" for one need only leaves it on her other needs', () => {
    const multi = ALL_PRODUCTS.find((p) => {
      const n = getProductMatchDetailsForProduct(p, answers).needMatches.filter((m) => m.relevant && m.score >= 50);
      return n.length >= 2;
    });
    if (!multi) return;
    const needs = getProductMatchDetailsForProduct(multi, answers).needMatches.filter((m) => m.relevant && m.score >= 50).map((m) => m.needId);
    const up = buildUserProfile(answers.fullHealthIntake, { catalog: ALL_PRODUCTS, behavior: { dismissed: [{ id: multi.id, needId: needs[0] }] } });
    expect(historyState(up, multi.id, needs[0])).toBe('dismissed');
    expect(historyState(up, multi.id, needs[1])).toBe(null);
  });
  it('tried without help: out of For you; worse or a side effect: excluded; removing the outcome is the undo', () => {
    const name = byId.get(target).name;
    const noHelp = q({ ...answers.fullHealthIntake, productHistory: [{ name, worked: 'No difference', current: 'No' }] });
    expect(shopIds(noHelp)).not.toContain(target);
    const worse = q({ ...answers.fullHealthIntake, productHistory: [{ name, worked: 'Made things worse', current: 'No' }] });
    expect(getProductMatchDetailsForProduct(byId.get(target), worse).eligible).toBe(false);
    expect(shopIds(q({ ...answers.fullHealthIntake, productHistory: [] }))).toContain(target);
    // Recorded outcomes (opts.outcomeHistory) work the same way.
    const viaOutcome = shopIds(answers, { ...behaviorFrom({}), outcomeHistory: [{ name, worked: 'No difference', stopReasons: [], source: 'ayna_outcome' }] });
    expect(viaOutcome).not.toContain(target);
  });
  it('already bought, in her routine or saved: still listed, after fresh matches at the same percent; the top match is fresh', () => {
    for (const opts of [behaviorFrom({ purchased: { [target]: true } }), behaviorFrom({ routine: { [target]: true } }), behaviorFrom({ inEcosystem: { [target]: true } })]) {
      const shop = shopIds(answers, opts);
      expect(shop).toContain(target);
      const pct = getProductMatchDetailsForProduct(byId.get(target), answers, null, opts).percent;
      const samePct = shop.filter((id) => getProductMatchDetailsForProduct(byId.get(id), answers, null, opts).percent === pct);
      if (samePct.length > 1) expect(samePct.at(-1)).toBe(target);
      expect(getTopMatch(answers, null, opts)?.id).not.toBe(target);
    }
  });
});
