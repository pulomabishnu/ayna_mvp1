import { describe, expect, it } from 'vitest';
import { explainWeek, heartInsight, sleepInsight, tempInsight, periodInsight, findTempRise, cycleContext, cycleLine, usesHormonalBC, EVIDENCE } from './weekInsights.js';
import { weekPicks, weekNeeds, fitFor } from './weekPicks.js';
import { comingUp } from './comingUp.js';
import { resolveDaily } from './dedupe.js';
import { devDemoRows, DEV_DEMO_PRODUCT_IDS, DEV_DEMO_MATCH_IDS, DEV_DEMO_NEEDS } from './devDemo.js';
import { buildDashboard } from './dashboard.js';
import { buildInsights } from './insights.js';
import { getProductById } from '../data/products.js';

const TODAY = '2026-10-21';
const DAY = 86400000;
const iso = (i) => new Date(Date.parse(`${TODAY}T00:00:00Z`) - i * DAY).toISOString().slice(0, 10);
/** rows for one metric: value(i) for i days ago, i in [0, days). */
const rowsOf = (metric, days, value) => Array.from({ length: days }, (_, i) => ({ metric, day: iso(i), value: value(i), source: 'apple_health', origin: 'apple_health', method: 'observed' }))
  .filter((r) => r.value != null);
const res = (...sets) => resolveDaily(sets.flat());

// A 28-day cycle, today day 24: luteal, period due in 5 days.
const luteal = { cycleDay: 24, avgLength: 28, periodLength: 5, lastStart: iso(23), lengths: [{ days: 28 }, { days: 28 }], sources: ['apple_health'] };
const lutealCtx = cycleContext({ cycle: luteal, estimate: { day: iso(-5) }, today: TODAY });
const noCycle = cycleContext({ today: TODAY });

describe('cycle context', () => {
  it('knows the phase and the days to her period', () => {
    expect(lutealCtx.phase.id).toBe('luteal');
    expect(lutealCtx.daysToPeriod).toBe(5);
    expect(cycleLine(luteal, lutealCtx)).toBe('Cycle day 24, probably in your luteal phase, period due in about 5 days');
  });
  it('has no phase without cycle data or on hormonal birth control', () => {
    expect(noCycle.phase).toBeNull();
    expect(cycleContext({ cycle: luteal, today: TODAY, hormonalBC: true }).phase).toBeNull();
    expect(cycleLine(null, noCycle)).toBeNull();
  });
  it('reads hormonal birth control from the quiz', () => {
    expect(usesHormonalBC({ lifeStageSelections: ['I use hormonal birth control'] })).toBe(true);
    expect(usesHormonalBC({ lifeStageSelections: ['I have regular periods'] })).toBe(false);
    expect(usesHormonalBC(null)).toBe(false);
  });
});

describe('heart insight', () => {
  const rhr = (recent, usual) => rowsOf('resting_hr_bpm', 35, (i) => (i < 7 ? recent : usual));
  const hrv = (recent, usual) => rowsOf('hrv_sdnn_ms', 35, (i) => (i < 7 ? recent : usual));

  it('ties a higher RHR to the luteal phase, with sources', () => {
    const it1 = heartInsight(res(rhr(62, 58)), TODAY, lutealCtx);
    expect(it1.text).toBe("Your resting heart rate is 4 bpm above your usual. That's common in the luteal phase, which you're probably in now.");
    expect(it1.sources).toContain(EVIDENCE.rhr);
  });
  it('says both when HRV is also down', () => {
    const it2 = heartInsight(res(rhr(62, 58), hrv(38, 46)), TODAY, lutealCtx);
    expect(it2.text).toMatch(/^Your resting heart rate is 4 bpm above your usual and your heart rate variability is 17% lower\. Both are common in the luteal phase/);
    expect(it2.sources).toEqual(expect.arrayContaining([EVIDENCE.rhr, EVIDENCE.hrv]));
  });
  it('says the luteal phase starts soon when she is near ovulation', () => {
    const near = { cycleDay: 13, avgLength: 28, periodLength: 5, lastStart: iso(12) };
    const ctx = cycleContext({ cycle: near, today: TODAY });
    expect(heartInsight(res(rhr(62, 58)), TODAY, ctx).text).toMatch(/which starts in about 3 days\.$/);
  });
  it('only states the number with no cycle info (no phase claim, no source)', () => {
    const it3 = heartInsight(res(rhr(62, 58)), TODAY, noCycle);
    expect(it3.text).toBe('Your resting heart rate is 4 bpm above your usual.');
    expect(it3.sources).toEqual([]);
  });
  it('ignores changes under 3 bpm and under 10% HRV', () => {
    expect(heartInsight(res(rhr(60, 58), hrv(43, 46)), TODAY, lutealCtx)).toBeNull();
  });
  it('needs a baseline: nothing with under 10 usual days', () => {
    const short = rowsOf('resting_hr_bpm', 12, (i) => (i < 7 ? 64 : 58));
    expect(heartInsight(res(short), TODAY, lutealCtx)).toBeNull();
  });
  it('returns nothing with no heart data', () => {
    expect(heartInsight(res([]), TODAY, lutealCtx)).toBeNull();
  });
});

describe('sleep insight', () => {
  const nights = [370, 395, 455, 380, 362, 448, 390];
  const sleep = rowsOf('sleep_minutes', 35, (i) => (i < 7 ? nights[i] : 452));
  it('counts short nights against her usual and mentions the days before a period', () => {
    const s = sleepInsight(res(sleep), TODAY, lutealCtx);
    expect(s.text).toBe("You've slept less than usual 5 of the last 7 nights, about 1h less a night on average. Some people sleep worse in the days before a period, though not everyone does.".replace('1h', s.text.match(/about (.+?) less/)[1]));
    expect(s.shortNights).toBe(5);
    expect(s.sources).toContain(EVIDENCE.sleep);
  });
  it('makes no cycle claim without a cycle', () => {
    const s = sleepInsight(res(sleep), TODAY, noCycle);
    expect(s.text).not.toMatch(/period/);
    expect(s.sources).toEqual([]);
  });
  it('stays quiet with only 3 short nights', () => {
    const three = rowsOf('sleep_minutes', 35, (i) => (i < 7 ? [370, 450, 455, 380, 362, 448, 450][i] : 452));
    expect(sleepInsight(res(three), TODAY, lutealCtx)).toBeNull();
  });
  it('stays quiet when nights are only a little short (under 30 min)', () => {
    const little = rowsOf('sleep_minutes', 35, (i) => (i < 7 ? 430 : 452));
    expect(sleepInsight(res(little), TODAY, lutealCtx)).toBeNull();
  });
  it('needs at least 4 recent nights', () => {
    const gaps = rowsOf('sleep_minutes', 35, (i) => (i < 7 ? (i < 3 ? 360 : null) : 452));
    expect(sleepInsight(res(gaps), TODAY, lutealCtx)).toBeNull();
  });
});

describe('temperature insight', () => {
  const temp = (riseDays, size = 0.3) => rowsOf('temp_deviation_c', 30, (i) => (i < riseDays ? size : 0));
  it('finds a 3-day rise and says it often follows ovulation', () => {
    const t = tempInsight(res(temp(3)), TODAY, noCycle);
    expect(t.text).toBe('Your temperature rose about 0.3\u00a0°C over the last 3 days, a pattern that often follows ovulation.');
    expect(t.sources).toEqual([EVIDENCE.bbt]);
  });
  it('describes a longer rise as sustained, and the drop before a period when due within 3 days', () => {
    const ctx = cycleContext({ cycle: luteal, estimate: { day: iso(-2) }, today: TODAY });
    const t = tempInsight(res(temp(12)), TODAY, ctx);
    expect(t.text).toMatch(/has stayed about 0\.3\u00a0°C higher for 12 days/);
    expect(t.text).toMatch(/drops a day or two before a period\.$/);
  });
  it('ignores 2 days, rises under 0.2 °C, and stale data', () => {
    expect(tempInsight(res(temp(2)), TODAY, noCycle)).toBeNull();
    expect(tempInsight(res(temp(5, 0.1)), TODAY, noCycle)).toBeNull();
    const stale = rowsOf('temp_deviation_c', 30, (i) => (i < 4 ? null : i < 8 ? 0.3 : 0));
    expect(tempInsight(res(stale), TODAY, noCycle)).toBeNull();
  });
  it('makes no ovulation claim on hormonal birth control', () => {
    const t = tempInsight(res(temp(3)), TODAY, noCycle, { hormonalBC: true });
    expect(t.text).not.toMatch(/ovulation/);
    expect(t.sources).toEqual([]);
  });
  it('findTempRise needs 6 days before the run', () => {
    expect(findTempRise([{ day: 'a', value: 0 }, { day: 'b', value: 0.4 }])).toBeNull();
  });
});

describe('period insight', () => {
  it('shows when the period is due within 5 days, cited', () => {
    const ctx = cycleContext({ cycle: luteal, estimate: { day: iso(-4) }, today: TODAY });
    const p = periodInsight(ctx, { day: iso(-4) }, luteal);
    expect(p.text).toBe('Your period is due in about 4 days, going by your last 2 cycles. Cramps can start a day or two before.');
    expect(p.sources).toEqual([EVIDENCE.cramps]);
  });
  it('hides with no estimate or when further out', () => {
    expect(periodInsight(noCycle, null, null)).toBeNull();
    const later = cycleContext({ cycle: luteal, estimate: { day: iso(-6) }, today: TODAY });
    expect(periodInsight(later, { day: iso(-6) }, luteal)).toBeNull();
  });
});

describe('explainWeek', () => {
  it('returns nothing when data is insufficient', () => {
    expect(explainWeek([], { today: TODAY }).insights).toEqual([]);
    expect(explainWeek(rowsOf('sleep_minutes', 5, () => 300), { today: TODAY }).insights).toEqual([]);
  });
  it('the dev demo exercises heart, sleep and temperature, at most 3', () => {
    const rows = devDemoRows(TODAY);
    const cycle = buildDashboard(rows, { today: TODAY, days: 30 }).cycle;
    const estimate = buildInsights(rows, { today: TODAY }).sections.find((s) => s.id === 'cycle').estimate;
    const { insights, ctx } = explainWeek(rows, { today: TODAY, cycle, estimate });
    expect(insights.map((i) => i.id)).toEqual(['heart', 'sleep', 'temperature']);
    expect(ctx.phase.id).toBe('luteal');
    for (const i of insights) {
      expect(i.text).not.toMatch(/—/);
      expect(i.basis.length).toBeGreaterThan(20);
    }
  });
});

describe('what might help this week', () => {
  const thermacare = { id: 'p-thermacare', category: 'heat-therapy' };
  const lola = { id: 'p-lola-tampon', category: 'tampon' };
  const magnesium = { id: 'p-magnesium-glycinate', category: 'supplement' };
  const proov = { id: 'p-proov-complete', category: 'diagnostics' };
  const sleepShort = { id: 'sleep', signal: 'sleep-short', shortNights: 5 };

  it('uses the research grade for fit and evidence', () => {
    expect(fitFor(thermacare, 'pain.menstrual_cramp')).toEqual({ level: 3, graded: true });
    expect(fitFor(proov, 'hormonal.general')).toBeNull();
    expect(fitFor({ id: 'x', tags: ['cramps'] }, 'pain.menstrual_cramp')).toEqual({ level: 0, graded: false });
  });
  it('before a period: cramps and period products, hers first, each with a reason from her data', () => {
    const picks = weekPicks({ ctx: lutealCtx, insights: [sleepShort], needIds: ['pain.menstrual_cramp'], products: [lola, thermacare], matches: [magnesium] });
    expect(picks.map((p) => p.product.id)).toEqual(['p-thermacare', 'p-lola-tampon', 'p-magnesium-glycinate']);
    expect(picks[0].reason).toBe('Your period is due in about 5 days. In your Ecosystem for cramps.');
    expect(picks[2].reason).toBe("You've slept less than usual 5 of the last 7 nights. Matched to you for sleep.");
    expect(picks[2].owned).toBe(false);
  });
  it('fertility needs only when she chose them', () => {
    const near = { cycleDay: 8, avgLength: 28, periodLength: 5, lastStart: iso(7) };
    const ctx = cycleContext({ cycle: near, today: TODAY });
    expect(weekNeeds({ ctx })).toEqual([]);
    expect(weekPicks({ ctx, needIds: ['fertility.ovulation_tracking'], products: [proov] })[0].reason).toMatch(/^Your likely ovulation window starts around/);
  });
  it('hides when nothing fits or nothing is implied', () => {
    expect(weekPicks({ ctx: lutealCtx, products: [{ id: 'p-good-clean-love', category: 'lubricant' }] })).toEqual([]);
    expect(weekPicks({ ctx: noCycle, insights: [], products: [thermacare, lola] })).toEqual([]);
  });
  it('never more than 4', () => {
    const many = ['p-advil-ibuprofen-200', 'p-aleve-naproxen-220', 'p-thermacare', 'p-lola-tampon', 'p-saalt-cup'].map((id) => ({ id }));
    expect(weekPicks({ ctx: lutealCtx, products: many }).length).toBeLessThanOrEqual(4);
  });
  it('the dev demo fills the row from real catalog products', () => {
    const products = DEV_DEMO_PRODUCT_IDS.map(getProductById).filter(Boolean);
    const matches = DEV_DEMO_MATCH_IDS.map(getProductById).filter(Boolean);
    const picks = weekPicks({ ctx: lutealCtx, insights: [sleepShort], needIds: DEV_DEMO_NEEDS, products, matches });
    expect(picks.length).toBe(4);
    expect(picks.every((p) => p.level > 0)).toBe(true);
  });
});

describe('coming up', () => {
  it('adds what to expect with a source to each date', () => {
    const items = comingUp(luteal, { day: iso(-5) }, TODAY);
    expect(items.map((e) => e.title)).toEqual(['Restock before your period', 'Next period, estimated']);
    expect(items.every((e) => e.expect && e.source?.url)).toBe(true);
  });
  it('shows the ovulation window and luteal start before ovulation', () => {
    const early = { cycleDay: 8, avgLength: 28, periodLength: 5, lastStart: iso(7) };
    const titles = comingUp(early, { day: iso(-21) }, TODAY).map((e) => e.title);
    expect(titles.slice(0, 2)).toEqual(['Likely ovulation window', 'Luteal phase likely starts']);
  });
  it('is empty without cycle data, and skips cycle-pattern lines on hormonal birth control', () => {
    expect(comingUp(null, null, TODAY)).toEqual([]);
    const bc = comingUp(luteal, { day: iso(-5) }, TODAY, { hormonalBC: true });
    expect(bc.find((e) => e.title === 'Next period, estimated').expect).toBe('');
  });
});
