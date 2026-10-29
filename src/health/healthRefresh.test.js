import { describe, it, expect } from 'vitest';
import { staleFactsFor, confirmFact, factsToAsk, snooze } from './healthRefresh.js';
import { stampFactUpdates } from '../matching/factFreshness.js';

const NOW = Date.parse('2026-10-29T12:00:00Z');
const old = new Date(NOW - 300 * 86400000).toISOString();
const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };
const intake = (over) => ({ lifeStageSelections: ['I am pregnant'], takesCurrent: 'Yes', currentMedicationItems: ['Sertraline'], supportSelections: ['Trouble sleeping'], personalizationCompletedAt: old, ...over });

describe('health-profile refresh prompt', () => {
  it('asks about old pregnancy and medicine answers, pregnancy first', () => {
    const f = staleFactsFor(intake(), { now: NOW });
    expect(f.map((x) => x.key).slice(0, 2)).toEqual(['pregnancy', 'medications']);
    expect(f[0].when).toMatch(/months ago/);
  });
  it('fresh answers are not asked about', () => {
    expect(staleFactsFor(intake({ personalizationCompletedAt: new Date(NOW - 5 * 86400000).toISOString() }), { now: NOW })).toEqual([]);
  });
  it('Still right stamps only that answer as confirmed today, and later saves keep it', () => {
    const confirmed = confirmFact(intake(), 'pregnancy', new Date(NOW).toISOString());
    expect(staleFactsFor(confirmed, { now: NOW }).map((x) => x.key)).not.toContain('pregnancy');
    expect(staleFactsFor(confirmed, { now: NOW }).map((x) => x.key)).toContain('medications');
    // A later in-place save of another answer keeps the confirmation.
    const later = stampFactUpdates({ ...confirmed, priceRange: ['$'] }, confirmed, new Date(NOW + 1000).toISOString());
    expect(later.factUpdatedAt.pregnancy).toBe(new Date(NOW).toISOString());
  });
  it('Not now hides that question for 14 days', () => {
    const storage = mem();
    snooze('pregnancy', { now: NOW, storage });
    expect(factsToAsk(intake(), { now: NOW, storage }).map((x) => x.key)).not.toContain('pregnancy');
    expect(factsToAsk(intake(), { now: NOW + 15 * 86400000, storage }).map((x) => x.key)).toContain('pregnancy');
  });
});
