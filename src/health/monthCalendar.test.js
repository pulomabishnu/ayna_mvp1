import { describe, expect, it } from 'vitest';
import { checkinDaySet, dayLines, dayMark, estimatedDaySet, legendFor, monthCells, monthComing, periodDaySet, shiftMonth } from './monthCalendar.js';

const today = '2026-10-27';
const empty = { day: '', pain: null, flow: null, pms: null, sleep: null, mood: null, skin: null };
const entry = (day, o = {}) => ({ ...empty, day, ...o });

describe('periodDaySet', () => {
  it('takes synced flow (level 1+) and her own log (light or more), not spotting or none', () => {
    const rows = [
      { metric: 'menstrual_flow', day: '2026-10-01', value: 3, source: 'apple_health' },
      { metric: 'menstrual_flow', day: '2026-10-02', value: 0, source: 'apple_health' },
      { metric: 'sleep_minutes', day: '2026-10-03', value: 400, source: 'apple_health' },
    ];
    const log = { '2026-10-04': entry('2026-10-04', { flow: 'light' }), '2026-10-05': entry('2026-10-05', { flow: 'spotting' }), '2026-10-06': entry('2026-10-06', { flow: 'none' }) };
    expect([...periodDaySet({ rows, log })].sort()).toEqual(['2026-10-01', '2026-10-04']);
  });
  it('is empty with no data', () => {
    expect(periodDaySet().size).toBe(0);
  });
});

describe('checkinDaySet', () => {
  it('counts any answer, including 0 and "none", and skips all-null days', () => {
    const log = { a: entry('2026-10-10', { pain: 0 }), b: entry('2026-10-11'), c: entry('2026-10-12', { flow: 'none' }) };
    const set = checkinDaySet({ '2026-10-10': log.a, '2026-10-11': log.b, '2026-10-12': log.c });
    expect([...set].sort()).toEqual(['2026-10-10', '2026-10-12']);
  });
});

describe('estimatedDaySet', () => {
  it('spans her own period length from the estimate day', () => {
    expect([...estimatedDaySet({ day: '2026-10-30' }, { today, periodLength: 3 })]).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
  });
  it('is one day when her period length is unknown, and caps long lengths at 8', () => {
    expect(estimatedDaySet({ day: '2026-10-30' }, { today }).size).toBe(1);
    expect(estimatedDaySet({ day: '2026-10-30' }, { today, periodLength: 15 }).size).toBe(8);
  });
  it('never shows a past estimate, a past day, or a day she already logged', () => {
    expect(estimatedDaySet({ day: '2026-10-20' }, { today, periodLength: 5 }).size).toBe(0);
    expect([...estimatedDaySet({ day: '2026-10-27' }, { today, periodLength: 3, logged: new Set(['2026-10-27']) })]).toEqual(['2026-10-28', '2026-10-29']);
  });
  it('is empty with no estimate', () => {
    expect(estimatedDaySet(null, { today }).size).toBe(0);
  });
});

describe('dayMark', () => {
  const sets = { period: new Set(['d1']), estimated: new Set(['d1', 'd2']), checkin: new Set(['d1', 'd2', 'd3']) };
  it('gives at most one marker: period, then estimated, then checked in', () => {
    expect(dayMark('d1', sets)).toBe('period');
    expect(dayMark('d2', sets)).toBe('estimated');
    expect(dayMark('d3', sets)).toBe('checkin');
    expect(dayMark('d4', sets)).toBeNull();
  });
});

describe('monthCells', () => {
  it('starts on Sunday with blanks, has every day, and flags today and the future', () => {
    const cells = monthCells('2026-10', { today, period: new Set(['2026-10-02']), estimated: new Set(), checkin: new Set(['2026-10-27']) });
    // 1 October 2026 is a Thursday: four blanks.
    expect(cells.slice(0, 4)).toEqual([null, null, null, null]);
    const days = cells.filter(Boolean);
    expect(days).toHaveLength(31);
    expect(days[1]).toMatchObject({ day: '2026-10-02', n: 2, mark: 'period', today: false, future: false });
    expect(days[26]).toMatchObject({ day: '2026-10-27', mark: 'checkin', today: true, future: false });
    expect(days[27].future).toBe(true);
  });
  it('handles February in a leap year', () => {
    expect(monthCells('2028-02', { today }).filter(Boolean)).toHaveLength(29);
  });
  it('shifts months across years', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });
});

describe('legendFor', () => {
  it('lists only the markers in view, max 3, and says "Bleed" with hormonal birth control', () => {
    const cells = [null, { mark: 'period' }, { mark: 'checkin' }, { mark: null }];
    expect(legendFor(cells).map((l) => l.label)).toEqual(['Period', 'Checked in']);
    expect(legendFor(cells, { hormonalBC: true })[0].label).toBe('Bleed');
    expect(legendFor([{ mark: 'period' }, { mark: 'estimated' }, { mark: 'checkin' }])).toHaveLength(3);
    expect(legendFor([null, { mark: null }])).toEqual([]);
  });
});

describe('dayLines', () => {
  const log = { '2026-10-20': entry('2026-10-20', { flow: 'medium', pain: 1, sleep: 3 }) };
  it('says what she logged, one line each', () => {
    expect(dayLines('2026-10-20', { mark: 'period', log, today })).toEqual(['Period logged', 'Checked in: Pain mild, Flow medium, Sleep good']);
  });
  it('labels the estimate and adds coming-up items for that day without repeating the estimate', () => {
    const coming = [{ day: '2026-10-30', title: 'Next period, estimated' }, { day: '2026-10-30', title: 'Restock before your period' }];
    expect(dayLines('2026-10-30', { mark: 'estimated', coming, today })).toEqual(['Period expected, estimated', 'Restock before your period']);
  });
  it('says bleed with hormonal birth control', () => {
    expect(dayLines('2026-10-20', { mark: 'period', hormonalBC: true, today })[0]).toBe('Bleed logged');
  });
  it('has a calm line when nothing is there', () => {
    expect(dayLines('2026-10-01', { today })).toEqual(['Nothing logged']);
    expect(dayLines('2026-11-01', { today })).toEqual(['Nothing planned']);
  });
});

describe('monthComing', () => {
  const items = [
    { day: '2026-10-28', title: 'Possible ovulation days' },
    { day: '2026-10-29', title: 'Ovulation has probably happened by now' },
    { day: '2026-11-01', title: 'Restock before your period' },
    { day: '2026-11-06', title: 'Next period, estimated' },
  ];
  it('keeps restock and the next period, drops the ovulation range, max 3', () => {
    expect(monthComing(items).map((c) => c.title)).toEqual(['Restock before your period', 'Next period, estimated']);
    expect(monthComing([...items, ...items, ...items]).length).toBe(3);
  });
  it('says bleed with hormonal birth control', () => {
    expect(monthComing(items, { hormonalBC: true }).map((c) => c.title)).toEqual(['Restock before your bleed', 'Next bleed, estimated']);
  });
});
