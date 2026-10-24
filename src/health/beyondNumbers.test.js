import { describe, expect, it } from 'vitest';
import { phaseCompare, normalRanges, goalsCovered, effectChecks, aynaAdds, goalLabel, FIGO } from './beyondNumbers.js';
import { devDemoRows, devDemoAddedAt, DEV_DEMO_PRODUCT_IDS, DEV_DEMO_NEEDS } from './devDemo.js';
import { buildDashboard } from './dashboard.js';
import { getProductById } from '../data/products.js';

const TODAY = '2026-10-21';
const DAY = 86400000;
const iso = (i) => new Date(Date.parse(`${TODAY}T00:00:00Z`) - i * DAY).toISOString().slice(0, 10);
const row = (metric, i, value) => ({ metric, day: iso(i), value, source: 'apple_health', origin: 'apple_health', method: 'observed' });
const flowAt = (starts, len = 5) => starts.flatMap((s) => Array.from({ length: len }, (_, d) => (s - d >= 0 ? row('menstrual_flow', s - d, 3) : null)).filter(Boolean));
const demo = devDemoRows(TODAY);
const demoCycle = buildDashboard(demo, { today: TODAY, days: 30 }).cycle;

describe('this phase vs your last cycles', () => {
  it('compares the same cycle days in the demo (luteal, last 3)', () => {
    const c = phaseCompare(demo, { today: TODAY, cycle: demoCycle });
    expect(c.title).toBe('This stretch after ovulation vs your last 3');
    expect(c.days).toEqual([22, 24]); // after the possible ovulation days (28 - 7 + 1 = day 22), womenshealth.gov range
    const rhr = c.rows.find((r) => r.metric === 'resting_hr_bpm');
    expect(rhr.word).toBe('Higher');
    expect(c.rows.find((r) => r.label === 'Temperature').word).toBe('About the same');
  });
  it('needs at least 2 earlier cycles with data', () => {
    const rows = [...flowAt([23, 51]), ...Array.from({ length: 60 }, (_, i) => row('resting_hr_bpm', i, 60))];
    const cycle = buildDashboard(rows, { today: TODAY, days: 30 }).cycle;
    expect(phaseCompare(rows, { today: TODAY, cycle })).toBeNull();
  });
  it('is hidden without a cycle or on hormonal birth control', () => {
    expect(phaseCompare(demo, { today: TODAY, cycle: null })).toBeNull();
    expect(phaseCompare(demo, { today: TODAY, cycle: demoCycle, hormonalBC: true })).toBeNull();
  });
});

describe('is this normal?', () => {
  it('puts her lengths next to the FIGO ranges, with the source', () => {
    const n = normalRanges(demo, { today: TODAY });
    expect(n.rows.map((r) => [r.id, r.value, r.ok])).toEqual([['length', '28 days', true], ['variation', '0 days', true], ['period', '5 days', true]]);
    expect(n.source).toBe(FIGO);
  });
  it('flags a cycle outside the range without diagnosing', () => {
    const n = normalRanges(flowAt([0, 45, 70, 98]), { today: TODAY });
    const len = n.rows.find((r) => r.id === 'length');
    expect(len.ok).toBe(false);
    expect(n.note).toMatch(/worth mentioning to a clinician/);
    expect(n.note).not.toMatch(/disorder|abnormal|condition/i);
  });
  it('needs 2 cycles, and is hidden on hormonal birth control', () => {
    expect(normalRanges(flowAt([10]), { today: TODAY })).toBeNull();
    expect(normalRanges(demo, { today: TODAY, hormonalBC: true })).toBeNull();
    expect(normalRanges([], { today: TODAY })).toBeNull();
  });
});

describe('your goals, covered (works with no health data)', () => {
  const products = DEV_DEMO_PRODUCT_IDS.map(getProductById).filter(Boolean);
  it('lists her products graded for each goal she chose', () => {
    const g = goalsCovered({ needIds: DEV_DEMO_NEEDS, products });
    // Heavy periods and dryness grades for these products cited non-.gov pages, so they are draft and not counted (Oct 24).
    expect(g.map((x) => x.label)).toEqual(['Cramps or period pain']);
    expect(g[0].owned[0].product.id).toBe('p-thermacare');
    expect(g[0].owned[0].level).toBe(2) // type-level grade: never the top level (TD 12);
  });
  it('offers a match only when nothing she owns fits, and skips goals with nothing', () => {
    const g = goalsCovered({ needIds: ['pain.menstrual_cramp', 'hair.loss'], products: [], matches: [{ id: 'p-advil-ibuprofen-200' }] });
    expect(g).toHaveLength(1);
    expect(g[0].match.product.id).toBe('p-advil-ibuprofen-200');
    expect(goalsCovered({})).toEqual([]);
  });
  it('labels goals the way the quiz does', () => {
    expect(goalLabel('sleep.trouble')).toBe('Trouble sleeping');
  });
});

describe('before and since a product', () => {
  const mag = { ...getProductById('p-magnumsolace-nighttime-magnesium-cream'), addedAt: devDemoAddedAt(TODAY)['p-magnumsolace-nighttime-magnesium-cream'] };
  it('compares sleep before and since, with the caveat', () => {
    const e = effectChecks(demo, { today: TODAY, products: [mag] });
    expect(e).toHaveLength(1);
    expect(e[0].text).toMatch(/^Added Oct 15\. Since then you've slept .+ a night, .+ the 2 weeks before \(.+\)\.$/);
    expect(e[0].caveat).toMatch(/can’t show the product caused it/);
  });
  it('needs a date she added it, a sleep-graded product, and enough nights', () => {
    expect(effectChecks(demo, { today: TODAY, products: [{ ...mag, addedAt: undefined }] })).toEqual([]);
    expect(effectChecks(demo, { today: TODAY, products: [{ ...getProductById('p-thermacare'), addedAt: iso(6) }] })).toEqual([]);
    expect(effectChecks(demo, { today: TODAY, products: [{ ...mag, addedAt: iso(2) }] })).toEqual([]);
    // A draft (non-.gov) sleep grade does not count.
    expect(effectChecks(demo, { today: TODAY, products: [{ ...getProductById('p-magnesium-glycinate'), addedAt: mag.addedAt }] })).toEqual([]);
  });
});

describe('what ayna adds', () => {
  it('uses her counts when they exist, and plain lines when not', () => {
    const products = DEV_DEMO_PRODUCT_IDS.map(getProductById).filter(Boolean);
    const withData = aynaAdds({ insights: [{}, {}, {}], picks: [{ owned: true }], products, needIds: DEV_DEMO_NEEDS, phaseName: 'luteal phase' });
    expect(withData[0].text).toBe('3 changes explained against your luteal phase.');
    expect(withData[1].text).toMatch(/^\d of your products graded for your goals/);
    const none = aynaAdds({});
    expect(none.map((x) => x.id)).toEqual(['data', 'evidence', 'products', 'community']);
    expect(none.every((x) => !/\d/.test(x.text))).toBe(true);
  });
});
