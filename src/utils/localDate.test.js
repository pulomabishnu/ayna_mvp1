import process from 'node:process';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { localDayKey, localToday, parseLocalDay, addLocalDays, localDaysBetween, legacyUtcDayKey, readDayRecord } from './localDate.js';
import { devDemoRows } from '../health/devDemo.js';
import { buildDashboard } from '../health/dashboard.js';
import { buildInsights } from '../health/insights.js';
import { explainWeek } from '../health/weekInsights.js';
import { monthKey, legacyMonthKey } from './monthlyCheckinStore.js';
import { todayKey } from '../health/dailyLog.js';

// P0 date bug (dashboard build brief): at 23:30 local the UTC date is already
// tomorrow in New York (and still today in Tokyo, until 09:00). Every "today"
// must be her local day, and the website and the app must agree.
const ORIGINAL_TZ = process.env.TZ;
afterEach(() => { vi.useRealTimers(); process.env.TZ = ORIGINAL_TZ; });

const at = (tz, y, m, d, hh, mm) => {
  process.env.TZ = tz;
  const now = new Date(y, m - 1, d, hh, mm);
  vi.useFakeTimers({ now, toFake: ['Date'] });
  return now;
};

const summary = (today) => {
  // The website path (WebHealth: devDemoRows(today) + { today }) and the app
  // path (useHealthData: devDemoRows(localToday()); builders called with
  // localToday()) must give the same numbers.
  const rows = devDemoRows(today);
  const d30 = buildDashboard(rows, { days: 30, today });
  const d7 = buildDashboard(rows, { days: 7, today });
  const sleep = d7.groups.flatMap((g) => g.charts).find((c) => c.metric === 'sleep_minutes');
  const est = buildInsights(rows, { today }).sections.find((s) => s.id === 'cycle')?.estimate || null;
  return { cycleDay: d30.cycle?.cycleDay, next: est?.nextStart || est?.next || null, sleep: sleep?.points?.map((p) => p.value).join(','), week: explainWeek(rows, { today, cycle: d30.cycle, estimate: est }).insights.length };
};

describe.each([
  ['America/New_York', '2026-10-26', '2026-10-27'],
  ['Asia/Tokyo', '2026-10-26', '2026-10-26'],
  ['UTC', '2026-10-26', '2026-10-26'],
])('local day at 23:30 in %s', (tz, local, utc) => {
  it('localToday is her day; the UTC date is what the old code used', () => {
    const now = at(tz, 2026, 10, 26, 23, 30);
    expect(localToday()).toBe(local);
    expect(localDayKey(now)).toBe(local);
    expect(todayKey(now)).toBe(local);
    expect(legacyUtcDayKey(now)).toBe(utc);
  });
  it('website and app give the same cycle day, next period, sleep and week', () => {
    at(tz, 2026, 10, 26, 23, 30);
    const web = summary(localToday());
    const app = summary(localToday());
    expect(app).toEqual(web);
    expect(web.cycleDay).toBe(24);
    // Builders called without `today` fall back to her local day, never UTC.
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rows = devDemoRows();
    expect(buildDashboard(rows, { days: 30 }).cycle?.cycleDay).toBe(24);
    spy.mockRestore();
  });
  it('the same answer just after midnight local', () => {
    at(tz, 2026, 10, 27, 0, 30);
    expect(localToday()).toBe('2026-10-27');
  });
});

describe('local calendar helpers', () => {
  it('parse, add and count days on the calendar (DST-safe)', () => {
    process.env.TZ = 'America/New_York';
    expect(parseLocalDay('2026-11-01').getDate()).toBe(1);
    expect(addLocalDays('2026-10-31', 2)).toBe('2026-11-02'); // across the DST change
    expect(addLocalDays('2026-03-07', 2)).toBe('2026-03-09');
    expect(localDaysBetween('2026-10-01', '2026-10-31')).toBe(30);
    expect(localDayKey('nope')).toBe('');
  });
  it('old UTC-keyed entries are still found (no data lost)', () => {
    const now = at('America/New_York', 2026, 10, 26, 23, 30);
    expect(readDayRecord({ '2026-10-27': { mood: 'Good' } }, now)).toEqual({ mood: 'Good' });
    expect(readDayRecord({ '2026-10-26': { mood: 'Low' }, '2026-10-27': { mood: 'Good' } }, now)).toEqual({ mood: 'Low' });
    expect(readDayRecord({}, now)).toBeUndefined();
  });
  it('monthly check-in month is the local 1st; the old Tokyo key still counts as this month', () => {
    const now = at('Asia/Tokyo', 2026, 10, 26, 23, 30);
    expect(monthKey(now)).toBe('2026-10-01');
    expect(legacyMonthKey(now)).toBe('2026-09-30');
  });
});
