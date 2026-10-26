import { describe, expect, it } from 'vitest';
import { chartSummary, findingStatus, findingTitle, percentile, syncState, usualBand } from './dashView.js';
import { devDemoRows } from './devDemo.js';
import { explainWeek } from './weekInsights.js';

const today = '2026-10-21';
const day = (n) => new Date(Date.parse(`${today}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10);

describe('dashboard view model', () => {
  it('usual band is the 25th to 75th percentile of the 28 days before the last 7, and needs 10 days', () => {
    expect(percentile([1, 2, 3, 4, 5], 0.25)).toBe(2);
    const pts = Array.from({ length: 35 }, (_, i) => ({ day: day(i), value: i < 7 ? 100 : 400 + i }));
    const band = usualBand(pts, today);
    expect(band.n).toBe(28);
    expect(band.lo).toBeGreaterThanOrEqual(407);
    expect(band.hi).toBeLessThanOrEqual(434);
    expect(usualBand(pts.slice(0, 15), today)).toBeNull();
  });

  it('puts the number in each finding title, never an invented one', () => {
    expect(findingTitle({ signal: 'heart-up', rhrDelta: 4, rhrDaysOff: 7, rhrDays: 7 })).toBe('Resting heart rate: 4 bpm above your usual, all 7 days');
    expect(findingTitle({ signal: 'sleep-short', deltaMin: -52, nightsOff: 5, nights: 7 })).toBe('Sleep: 52 min under your usual, 5 of 7 nights');
    expect(findingTitle({ signal: 'unknown', text: 'Something changed.' })).toBe('Something changed');
    const { insights } = explainWeek(devDemoRows(today), { today, max: 7 });
    for (const i of insights) expect(findingTitle(i)).toMatch(/\d/);
  });

  it('marks a finding new or still going from the same rule a week earlier', () => {
    const rows = devDemoRows(today);
    const { insights } = explainWeek(rows, { today, max: 7 });
    const { status } = findingStatus(rows, insights, { today });
    for (const v of Object.values(status)) expect(['New', 'Still going']).toContain(v);
  });

  it('says when data was synced, and goes stale after two days', () => {
    const now = Date.parse('2026-10-21T20:12:00');
    expect(syncState([{ last_synced_at: new Date(now - 3600000).toISOString() }], now).label).toMatch(/^synced \d{1,2}:\d{2} (am|pm)$/);
    const stale = syncState([{ last_synced_at: new Date(now - 3 * 86400000).toISOString() }], now);
    expect(stale.stale).toBe(true);
    expect(stale.label).toMatch(/^Last synced [A-Z][a-z]{2}$/);
    expect(syncState([], now)).toBeNull();
  });

  it('writes a one-sentence summary for every chart', () => {
    const chart = { metric: 'sleep_minutes', label: 'Sleep', points: [{ day: day(1), value: 400 }, { day: day(0), value: 420 }], avg: 410, week: 410, usual: 452 };
    expect(chartSummary(chart)).toBe('Sleep, last 2 nights logged: average 6h 50m. Last 7 nights: 6h 50m, your usual 7h 32m.');
  });
});
