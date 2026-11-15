import { describe, it, expect } from 'vitest';
import { buildDashboard } from './dashboard.js';
import { buildInsights } from './insights.js';

// Founder call, Nov 14 (Eliz): after logging past periods the dial's cycle length and the next-period
// estimate disagreed (28 vs 31 days). Both come from the same last 4 cycles now.
const flow = (days) => days.flatMap((d) => [0, 1, 2, 3].map((k) => ({ metric: 'menstrual_flow', day: new Date(Date.parse(`${d}T12:00:00Z`) + k * 864e5).toISOString().slice(0, 10), value: 2, source: 'manual_import', origin: 'ayna_log' })));

describe('cycle length and next-period estimate agree', () => {
  it('uses the same recent cycles for the dial and the estimate', () => {
    // Older cycles of 24 days, recent ones of 31: a 6-cycle average would say 28.
    const starts = ['2026-03-01', '2026-03-25', '2026-04-18', '2026-05-12', '2026-06-12', '2026-07-13', '2026-08-13', '2026-09-13', '2026-10-14'];
    const rows = flow(starts);
    const today = '2026-11-01';
    const cycle = buildDashboard(rows, { days: 30, today }).cycle;
    const est = buildInsights(rows, { today }).sections.find((s) => s.id === 'cycle').estimate;
    const gap = Math.round((Date.parse(`${est.day}T12:00:00Z`) - Date.parse(`${cycle.lastStart}T12:00:00Z`)) / 864e5);
    expect(cycle.avgLength).toBe(gap);
  });
});
