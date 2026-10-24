/**
 * Cross-cycle patterns. Every log and health row in this file is synthetic,
 * made up for these tests only; none of it is a real person's data.
 */
import { describe, expect, it } from 'vitest';
import { cycleStartsFrom, cyclesFrom, findCyclePatterns, MIN_CYCLES } from './cyclePatterns.js';
import { addDays } from './dailyLog.js';

const FIRST = '2026-05-01';
const LEN = 28;

/**
 * Synthetic log: `cycles` periods of 4 flow days, LEN days apart. `fill(day, ctx)`
 * returns extra fields for a day; ctx = { cycle, cycleDay (1-based), daysToNext }.
 */
function synth({ cycles = 5, len = LEN, start = FIRST, fill = () => ({}), tail = 10 } = {}) {
  const log = {};
  const total = cycles * len + tail;
  for (let i = 0; i < total; i += 1) {
    const day = addDays(start, i);
    const cycle = Math.floor(i / len);
    const cycleDay = (i % len) + 1;
    const daysToNext = len - (i % len);
    const flow = cycle < cycles + 1 && cycleDay <= 4 && i < cycles * len + Math.min(tail, 4) ? 'medium' : 'none';
    log[day] = { day, flow, updatedAt: `${day}T20:00:00Z`, ...fill(day, { cycle, cycleDay, daysToNext }) };
  }
  return { log, today: addDays(start, total - 1) };
}

const BANNED = /caus|because|due to|diagnos|disorder|syndrome|condition|disease|endometriosis|pcos|pmdd|abnormal|you have/i;

describe('cycles', () => {
  it('finds period starts from flow; spotting alone never starts one', () => {
    const { log, today } = synth({ cycles: 3 });
    const starts = cycleStartsFrom({ log, today });
    expect(starts).toEqual([FIRST, addDays(FIRST, 28), addDays(FIRST, 56), addDays(FIRST, 84)]);
    const spotting = { ...log, [addDays(FIRST, 14)]: { day: addDays(FIRST, 14), flow: 'spotting' } };
    expect(cycleStartsFrom({ log: spotting, today })).toEqual(starts);
  });
  it('merges connected flow rows and known starts without doubling a period', () => {
    const rows = [{ metric: 'menstrual_flow', day: '2026-05-02', value: 3 }, { metric: 'menstrual_flow', day: '2026-05-29', value: 2 }];
    const starts = cycleStartsFrom({ healthRows: rows, cycleStarts: ['2026-05-01', '2026-06-26'], today: '2026-07-10' });
    expect(starts).toEqual(['2026-05-02', '2026-05-29', '2026-06-26']);
  });
  it('a gap too long to be one cycle (a missed log) is not a cycle', () => {
    const cycles = cyclesFrom(['2026-01-01', '2026-01-29', '2026-04-15', '2026-05-13'], '2026-05-20');
    expect(cycles.map((c) => c.start)).toEqual(['2026-01-01', '2026-04-15', '2026-05-13']);
    expect(cycles[2].complete).toBe(false);
  });
});

describe('patterns', () => {
  it('sleep rougher before 3 of 4 periods, against her own baseline', () => {
    // Sleep is good (3) except the 3 days before periods 2, 3 and 5 (cycles 0, 1, 3 end rough).
    const { log, today } = synth({
      cycles: 4,
      fill: (_d, { cycle, daysToNext }) => ({ sleep: daysToNext <= 3 && [0, 1, 3].includes(cycle) ? 1 : 3 }),
    });
    const p = findCyclePatterns({ log, today }).find((x) => x.id === 'sleep.premenstrual.harder');
    expect(p).toBeTruthy();
    expect(p.text).toBe('Sleep was rougher in the 3 days before your period than the rest of the cycle, in 3 of the 4 cycles you logged.');
    expect(p.basis).toEqual({ cycles: 3, of: 4 });
    expect(p).toMatchObject({ metric: 'sleep', window: 'premenstrual', direction: 'harder', source: 'ayna_pattern', method: 'derived', validation: 'not_clinically_confirmed', confidence: 'low', dataSources: ['daily_log'] });
    expect(p.observed.from).toBe(FIRST);
  });

  it('pain higher on days 1 and 2 in every cycle she logged', () => {
    const { log, today } = synth({ fill: (_d, { cycleDay }) => ({ pain: cycleDay <= 2 ? 3 : 0 }) });
    const p = findCyclePatterns({ log, today }).find((x) => x.id === 'pain.menstrual.harder');
    expect(p.text).toBe('Pain was higher on days 1 and 2 of your period than the rest of the cycle, in all 6 cycles you logged.');
    expect(p.basis).toEqual({ cycles: 6, of: 6 });
    expect(p.confidence).toBe('moderate');
  });

  it(`needs at least ${MIN_CYCLES} cycles`, () => {
    const { log, today } = synth({ cycles: 2, tail: 3, fill: (_d, { cycleDay }) => ({ pain: cycleDay <= 2 ? 3 : 0 }) });
    expect(findCyclePatterns({ log, today })).toEqual([]);
  });

  it('2 of 4 is not a pattern', () => {
    const { log, today } = synth({ cycles: 4, fill: (_d, { cycle, daysToNext }) => ({ sleep: daysToNext <= 3 && [0, 2].includes(cycle) ? 1 : 3 }) });
    expect(findCyclePatterns({ log, today }).filter((x) => x.metric === 'sleep')).toEqual([]);
  });

  it('a cycle with nothing logged in the window does not count either way (missing is not "fine")', () => {
    // Sleep logged only in cycles 0-2 around the window; cycle 3 has no sleep entries at all.
    const { log, today } = synth({ fill: (_d, { cycle, daysToNext }) => (cycle <= 2 ? { sleep: daysToNext <= 3 ? 1 : 3 } : {}) });
    const p = findCyclePatterns({ log, today }).find((x) => x.id === 'sleep.premenstrual.harder');
    expect(p.basis).toEqual({ cycles: 3, of: 3 });
    expect(p.text).toMatch(/in all 3 cycles you logged/);
  });

  it('a small difference is not a pattern', () => {
    const { log, today } = synth({ fill: (_d, { daysToNext }) => ({ mood: daysToNext <= 3 ? 2 : 2 }) });
    expect(findCyclePatterns({ log, today }).filter((x) => x.metric === 'mood')).toEqual([]);
  });

  it('can be easier too: skin clearer before periods', () => {
    const { log, today } = synth({ fill: (_d, { daysToNext }) => ({ skin: daysToNext <= 3 ? 3 : 1 }) });
    const p = findCyclePatterns({ log, today }).find((x) => x.metric === 'skin');
    expect(p).toMatchObject({ direction: 'easier', window: 'premenstrual' });
    expect(p.text).toMatch(/^Skin was clearer in the 3 days before your period/);
  });

  it('wearable sleep uses one source, never an average across devices', () => {
    const { log, today } = synth({});
    const rows = [];
    for (const day of Object.keys(log)) {
      const daysToNext = 28 - (Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${FIRST}T00:00:00Z`)) / 86400000) % 28);
      rows.push({ metric: 'sleep_minutes', day, value: daysToNext <= 3 ? 360 : 450, origin: 'oura' });
      rows.push({ metric: 'sleep_minutes', day: addDays(day, 0), value: 600, origin: 'phone' }); // second device, other days count less
    }
    const onlyOura = rows.filter((r, i) => r.origin === 'oura' || i % 4 === 1);
    const p = findCyclePatterns({ log, healthRows: onlyOura, today }).find((x) => x.metric === 'sleep_minutes');
    expect(p).toMatchObject({ direction: 'harder', dataSources: ['connected_data'] });
    expect(p.text).toMatch(/^Sleep from your connected data was shorter/);
  });

  it('says "bleed" on hormonal birth control', () => {
    const { log, today } = synth({ fill: (_d, { cycleDay }) => ({ pain: cycleDay <= 2 ? 3 : 0 }) });
    const p = findCyclePatterns({ log, today, hormonalBC: true })[0];
    expect(p.text).toMatch(/your bleed/);
    expect(p.text).not.toMatch(/period/);
  });

  it('never claims a cause or uses diagnosis words', () => {
    const { log, today } = synth({ fill: (_d, { cycleDay, daysToNext }) => ({ pain: cycleDay <= 2 ? 3 : 0, pms: daysToNext <= 3 ? 3 : 0, sleep: daysToNext <= 3 ? 1 : 3, mood: daysToNext <= 3 ? 1 : 3, skin: daysToNext <= 3 ? 1 : 3 }) });
    const all = findCyclePatterns({ log, today });
    expect(all.length).toBeGreaterThanOrEqual(5);
    for (const p of all) {
      expect(p.text).not.toMatch(BANNED);
      expect(p.text).not.toMatch(/—/);
      expect(p.text).toMatch(/cycles? you logged\.$/);
    }
  });

  it('nothing logged, nothing said', () => {
    expect(findCyclePatterns({})).toEqual([]);
    expect(findCyclePatterns({ log: [], healthRows: [], today: '2026-10-24' })).toEqual([]);
  });
});
