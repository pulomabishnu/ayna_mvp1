import { describe, it, expect, beforeEach } from 'vitest';
import { sleepReport, saveSleepEntry, readSleepEntries, minutesBetween, enteredSleepRows, nightsFrom, removeSleepEntry } from './sleepReport.js';
import { sleepRows } from './native.js';
import { addDays } from './dailyLog.js';

function mem() { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; }
const TODAY = '2026-11-15';
const rows = (n, minutes, extra = {}) => Array.from({ length: n }, (_, i) => ({ metric: 'sleep_minutes', day: addDays(TODAY, -i), value: typeof minutes === 'function' ? minutes(i) : minutes, origin: 'apple_watch', method: 'derived', ...extra }));
let s;
beforeEach(() => { s = mem(); });

describe('entering a night', () => {
  it('counts over midnight and rejects impossible nights', () => {
    expect(minutesBetween('23:30', '07:00')).toBe(450);
    expect(minutesBetween('01:00', '08:15')).toBe(435);
    expect(saveSleepEntry(TODAY, { bed: '23:00', wake: '23:30' }, { storage: s }).error).toMatch(/under 1 hour/);
    expect(saveSleepEntry(TODAY, { bed: 'x', wake: '07:00' }, { storage: s }).error).toBeTruthy();
    expect(saveSleepEntry(TODAY, { bed: '23:30', wake: '07:00' }, { storage: s })).toEqual({ ok: true, minutes: 450 });
    expect(readSleepEntries(s)[TODAY]).toMatchObject({ bed: '23:30', wake: '07:00', minutes: 450 });
    expect(removeSleepEntry(TODAY, s)).toBe(true);
    expect(readSleepEntries(s)[TODAY]).toBeUndefined();
  });
  it('typed nights only fill nights nothing else recorded', () => {
    const entries = { [TODAY]: { minutes: 400 }, [addDays(TODAY, -1)]: { minutes: 410 } };
    const out = enteredSleepRows(rows(1, 420), entries);
    expect(out.map((r) => r.day)).toEqual([addDays(TODAY, -1)]);
  });
});

describe('iPhone time in bed', () => {
  it('is marked so ayna can call it an estimate; measured sleep wins', () => {
    const inBedOnly = sleepRows([{ startDate: '2026-11-14T23:00:00', endDate: '2026-11-15T07:00:00', sleepState: 'inBed', sourceId: 'com.apple.health' }], 'apple_health');
    expect(inBedOnly.map((r) => r.metric).sort()).toEqual(['sleep_in_bed_minutes', 'sleep_minutes']);
    const both = sleepRows([
      { startDate: '2026-11-14T23:00:00', endDate: '2026-11-15T07:00:00', sleepState: 'inBed', sourceId: 'com.apple.health' },
      { startDate: '2026-11-14T23:30:00', endDate: '2026-11-15T06:30:00', sleepState: 'asleep', sourceId: 'com.apple.health' },
    ], 'apple_health');
    expect(both.find((r) => r.metric === 'sleep_minutes').value).toBe(420);
    expect(both.some((r) => r.metric === 'sleep_in_bed_minutes')).toBe(false);
  });
  it('report says time in bed, never "measured"', () => {
    const r = [...rows(1, 480, { origin: 'iphone' }), { metric: 'sleep_in_bed_minutes', day: TODAY, value: 480, origin: 'iphone' }];
    const rep = sleepReport({ healthRows: r, entries: {}, log: {}, today: TODAY });
    expect(rep.kind).toBe('in_bed');
    expect(rep.title).toBe('You slept about 8h (time in bed).');
    expect(rep.sourceLine).toMatch(/estimate/);
  });
});

describe('sleepReport states', () => {
  it('none: says what to do, no numbers invented', () => {
    const rep = sleepReport({ healthRows: [], entries: {}, log: {}, today: TODAY });
    expect(rep.state).toBe('none');
    expect(rep.minutes).toBeUndefined();
  });
  it('rating only: uses the rating, never turns it into minutes', () => {
    const rep = sleepReport({ healthRows: [], entries: {}, log: { [TODAY]: { sleep: 1 } }, today: TODAY });
    expect(rep.state).toBe('rating_only');
    expect(rep.title).toBe('You rated last night rough.');
    expect(rep.minutes).toBeUndefined();
  });
  it('learning until 7 nights of the same kind', () => {
    const rep = sleepReport({ healthRows: rows(3, 420), entries: {}, log: {}, today: TODAY });
    expect(rep.state).toBe('learning');
    expect(rep.body).toBe('Not enough nights yet to know your usual: ayna needs 5 more nights.');
  });
  it('ready: compares with her usual and gives one sourced step', () => {
    const rep = sleepReport({ healthRows: rows(10, (i) => (i === 0 ? 360 : 450)), entries: {}, log: { [TODAY]: { sleep: 2 } }, today: TODAY });
    expect(rep).toMatchObject({ state: 'ready', usual: 450, status: 'shorter', rating: 'Okay' });
    expect(rep.title).toBe('You slept 6h, about 1h 30m less than usual.');
    expect(rep.tip.source.url).toMatch(/nhlbi\.nih\.gov/);
  });
  it('typed nights build a usual too (no watch at all)', () => {
    const entries = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [addDays(TODAY, -i), { minutes: 420, bed: '23:30', wake: '06:30' }]));
    const rep = sleepReport({ healthRows: [], entries, log: {}, today: TODAY });
    expect(rep).toMatchObject({ state: 'ready', kind: 'entered', status: 'usual', bed: '23:30' });
    expect(rep.title).toBe('You slept about 7h, close to your usual.');
  });
  it('measured nights are not averaged with estimates', () => {
    const n = nightsFrom([...rows(1, 400), { metric: 'sleep_minutes', day: addDays(TODAY, -1), value: 500, origin: 'entered', method: 'user_entered' }], {});
    expect(n.get(TODAY).kind).toBe('measured');
    expect(n.get(addDays(TODAY, -1)).kind).toBe('entered');
  });
});
