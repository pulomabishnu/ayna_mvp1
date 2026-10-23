import { describe, expect, it } from 'vitest';
import { recordRoutineOutcome } from './routineOutcome.js';

describe('routine product check-ins', () => {
  it('records a dated response and lets a person revise it on the same day', () => {
    const first = recordRoutineOutcome({}, 'product-1', 'helping', '2026-10-22T10:00:00Z');
    expect(first['product-1']).toEqual([{ day: '2026-10-22', rating: 'helping' }]);
    const revised = recordRoutineOutcome(first, 'product-1', 'same', '2026-10-22T18:00:00Z');
    expect(revised['product-1']).toEqual([{ day: '2026-10-22', rating: 'same' }]);
    expect(recordRoutineOutcome(revised, 'product-1', 'diagnosis')).toBe(revised);
  });
  it('uses the local calendar day for a check-in made at night', () => {
    const entry = recordRoutineOutcome({}, 'product-1', 'helping', new Date(2026, 9, 22, 22, 30));
    expect(entry['product-1'][0].day).toBe('2026-10-22');
  });
});
