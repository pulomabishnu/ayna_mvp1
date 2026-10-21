import { describe, expect, it, vi } from 'vitest';
import { getEcosystemSeedFromQuiz, getSelectedNeeds, getProductMatchDetailsForProduct, getProductById } from '../data/products.js';
import { buildInsights, periodTiming, PERIOD_TIMING_SOURCE } from '../health/insights.js';
import { healthMatchContext, whyLine } from '../health/matchContext.js';
import { devDemoRows } from '../health/devDemo.js';
import { shapeEcosystemWithHealth } from './healthShaping.js';
import { changeText, backedText, sourceName } from '../components/health/healthCopy.js';

const TODAY = '2026-10-21';
const demo = buildInsights(devDemoRows(TODAY), { today: TODAY });
const demoSignals = [...demo.signals, ...demo.timing];
const ctxFor = (q) => healthMatchContext(demoSignals, getSelectedNeeds(q).map((n) => n.id));
const ids = (shelves) => shelves.map((s) => s.needId);
const picks = (shelves) => Object.fromEntries(shelves.map((s) => [s.needId, s.picks.map((p) => p.productId)]));
const allIds = (shelves) => shelves.flatMap((s) => s.picks.map((p) => p.productId)).sort();

describe('demo health data changes her Ecosystem (website v2 and app v1 engines)', () => {
  // Her first goal is cramps; dryness has no health-data link; sleep does.
  const q = { supportSelections: ['Cramps or period pain', 'Vaginal dryness', 'Trouble sleeping'] };
  for (const engine of ['v1', 'v2']) {
    it(`${engine}: sleep moves up, trackers move after things that act on sleep, same products`, () => {
      const before = getEcosystemSeedFromQuiz(q, null, { engine });
      const after = getEcosystemSeedFromQuiz(q, null, { engine, healthContext: ctxFor(q) });
      expect(ids(before.shelves)).toEqual(['pain.menstrual_cramp', 'vaginal.dryness', 'sleep.trouble']);
      expect(ids(after.shelves)).toEqual(['pain.menstrual_cramp', 'sleep.trouble', 'vaginal.dryness']);
      // It only re-orders: never adds or removes a product.
      expect(allIds(after.shelves)).toEqual(allIds(before.shelves));
      const sleepAfter = picks(after.shelves)['sleep.trouble'];
      const lastCategory = getProductById(sleepAfter[sleepAfter.length - 1])?.category;
      expect(['tracker', 'wearable']).toContain(lastCategory);
      expect(sleepAfter).not.toEqual(picks(before.shelves)['sleep.trouble']);
      const change = after.healthShaped.changes.find((c) => c.needId === 'sleep.trouble');
      expect(change).toMatchObject({ kind: 'trend', shelfMovedUp: true, sources: ['apple_health'] });
      // Badges ride along on the picks, never on trackers.
      const sleepPicks = after.shelves.find((s) => s.needId === 'sleep.trouble').picks;
      expect(sleepPicks.every((p) => p.healthBacked?.needId === 'sleep.trouble')).toBe(true);
      expect(sleepPicks.filter((p) => backedText(p.healthBacked)).length).toBeGreaterThan(0);
      expect(sleepPicks.filter((p) => p.healthBacked.tracker).every((p) => backedText(p.healthBacked) === null)).toBe(true);
    });
  }

  it('v1 heavy periods: with the period due, period products come before telehealth', () => {
    const qh = { supportSelections: ['Heavy periods'] };
    const before = picks(getEcosystemSeedFromQuiz(qh, null, { engine: 'v1' }).shelves)['period.heavy'];
    const after = picks(getEcosystemSeedFromQuiz(qh, null, { engine: 'v1', healthContext: ctxFor(qh) }).shelves)['period.heavy'];
    expect(after.slice().sort()).toEqual(before.slice().sort());
    expect(getProductById(after[after.length - 1])?.category).toBe('telehealth');
  });

  it('the product page and Why this match see the same health context', () => {
    const product = getProductById('d-headspace');
    const d = getProductMatchDetailsForProduct(product, q, null, { healthContext: ctxFor(q) });
    expect(d.needMatches.find((m) => m.needId === 'sleep.trouble')?.healthData?.kind).toBe('trend');
    expect(getProductMatchDetailsForProduct(product, q, null, {}).needMatches.find((m) => m.needId === 'sleep.trouble')?.healthData).toBeNull();
  });
});

describe('period timing', () => {
  it('demo: period due in about 5 days, from Apple Health, cited', () => {
    const cramp = demo.timing.find((t) => t.needId === 'pain.menstrual_cramp');
    expect(cramp).toMatchObject({ kind: 'timing', timing: 'period_soon', daysUntil: 5, sources: ['apple_health'], cite: PERIOD_TIMING_SOURCE });
    expect(cramp.summary).toBe('Your period is due in about 5 days');
  });
  it('nothing when the period is more than 5 days away or the cycle is still building', () => {
    expect(buildInsights(devDemoRows(TODAY), { today: '2026-10-12' }).timing).toEqual([]);
    expect(periodTiming([], { status: 'building' }, TODAY)).toEqual([]);
  });
  it('timing never becomes a suggested goal and only backs needs she chose', () => {
    const ctx = healthMatchContext(demo.timing, ['vaginal.dryness']);
    expect(ctx.byNeed).toEqual({});
    expect(ctx.suggestions).toEqual([]);
  });
  it('around-the-period picks come before slow supplements inside a chosen need', () => {
    const eco = { shelves: [{ needId: 'pain.menstrual_cramp', label: 'Cramps or period pain', picks: [{ productId: 'mag', category: 'supplement' }, { productId: 'heat', category: 'cramp-relief' }, { productId: 'nsaid', category: 'medication' }] }] };
    const up = { healthIntent: { needs: [{ id: 'pain.menstrual_cramp', explicit: true, healthData: { kind: 'timing', section: 'cycle', summary: 'Your period is due in about 2 days', sources: ['apple_health'] } }] } };
    const out = shapeEcosystemWithHealth(eco, up);
    expect(out.shelves[0].picks.map((p) => p.productId)).toEqual(['heat', 'nsaid', 'mag']);
    expect(changeText(out.healthShaped.changes[0])).toBe('Your period is due in about 2 days. Cramps or period pain now leads with what you use around your period.');
  });
});

describe('policy limits', () => {
  const backedUp = (needs) => ({ healthIntent: { needs } });
  const shelf = (needId, extra = {}) => ({ needId, label: needId, picks: [{ productId: `${needId}-a`, category: 'tracker' }, { productId: `${needId}-b`, category: 'sleep' }], ...extra });
  const data = { kind: 'trend', section: 'sleep', summary: "You've been sleeping less than usual", sources: ['apple_health'] };

  it('never moves a backed need above her first need, or a shelf past care-first', () => {
    const eco = { shelves: [shelf('a'), shelf('care', { careFirst: true }), shelf('b'), shelf('sleep')] };
    const up = backedUp([{ id: 'a', explicit: true }, { id: 'care', explicit: true }, { id: 'b', explicit: true }, { id: 'sleep', explicit: true, healthData: data }]);
    expect(ids(shapeEcosystemWithHealth(eco, up).shelves)).toEqual(['a', 'care', 'sleep', 'b']);
    // Even when her first need is the one her data backs, nothing jumps it.
    const up2 = backedUp([{ id: 'a', explicit: true }, { id: 'b', explicit: true }, { id: 'sleep', explicit: true, healthData: data }]);
    expect(ids(shapeEcosystemWithHealth({ shelves: [shelf('a'), shelf('b'), shelf('sleep')] }, up2).shelves)[0]).toBe('a');
  });
  it('does not touch care-first shelves, and without health data changes nothing', () => {
    const eco = { shelves: [shelf('sleep', { careFirst: true })] };
    const out = shapeEcosystemWithHealth(eco, backedUp([{ id: 'sleep', explicit: true, healthData: data }]));
    expect(out.shelves[0].picks.map((p) => p.productId)).toEqual(['sleep-a', 'sleep-b']);
    const plain = { shelves: [shelf('a'), shelf('b')] };
    const same = shapeEcosystemWithHealth(plain, backedUp([{ id: 'a', explicit: true }, { id: 'b', explicit: true }]));
    expect(same.shelves).toBe(plain.shelves);
    expect(same.healthShaped).toBeNull();
  });
  it('never creates or removes a need, whatever the data says', () => {
    const q = { supportSelections: ['Vaginal dryness'] };
    const after = getEcosystemSeedFromQuiz(q, null, { engine: 'v2', healthContext: healthMatchContext(demoSignals, ['vaginal.dryness', 'sleep.trouble']) });
    expect(ids(after.shelves)).toEqual(['vaginal.dryness']);
    expect(after.healthShaped).toBeNull();
  });
  it('copy is plain: no em dashes, no AI words', () => {
    const lines = [whyLine({ kind: 'timing', summary: 'Your period is due in about 3 days', sources: ['apple_health'], timing: { cite: PERIOD_TIMING_SOURCE } }), whyLine({ kind: 'trend', summary: data.summary, sources: ['apple_health', 'whoop'] }, sourceName)]
      .map((l) => `${l.text} ${l.detail}`);
    for (const t of lines) expect(t).not.toMatch(/—|unlock|seamless|tailored|journey/i);
    expect(lines[1]).toContain('From Apple Health and WHOOP.');
  });
});

describe('her switch (Use my health data in my matches)', () => {
  it('defaults on and rolls back if saving fails', async () => {
    vi.resetModules();
    vi.doMock('../mobile/utils/notificationPreferencesApi.js', () => ({
      fetchNotificationPreferences: vi.fn(async () => ({ healthDataInMatchesEnabled: true })),
      patchNotificationPreferences: vi.fn(async () => { const e = new Error('needs_migration'); e.code = 'needs_migration'; throw e; }),
    }));
    const pref = await import('../health/matchPref.js');
    pref.resetHealthMatchPref();
    expect(pref.getHealthMatchPref().on).toBe(true);
    expect(await pref.setHealthInMatches(false)).toBe(false);
    expect(pref.getHealthMatchPref()).toMatchObject({ on: true, error: 'needs_migration' });
    vi.doUnmock('../mobile/utils/notificationPreferencesApi.js');
  });
});
