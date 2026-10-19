import { describe, it, expect } from 'vitest';
import { backfillDays } from './_healthStore.js';

describe('backfillDays', () => {
  const now = Date.parse('2026-10-19T12:00:00Z');
  it('reads 90 days on the first sync', () => expect(backfillDays(null, now)).toBe(90));
  it('reads at least 14 days', () => expect(backfillDays('2026-10-18T12:00:00Z', now)).toBe(14));
  it('covers a three-week gap so no days are lost', () => expect(backfillDays('2026-09-28T12:00:00Z', now)).toBe(23));
  it('never more than 90', () => expect(backfillDays('2026-01-01T00:00:00Z', now)).toBe(90));
});
