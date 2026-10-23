import { describe, expect, it } from 'vitest';
import { addMemory, appointmentSummary, completeTrial, guideContext, productNotesFromRoutine, readGuide, removeMemory, saveGuide, startTrial, trialResult } from './aynaGuide.js';

function storage() {
  const map = new Map();
  return { getItem: (key) => map.get(key) || null, setItem: (key, value) => map.set(key, value) };
}

describe('Ayna personal guide', () => {
  it('keeps each account separate and sends chosen memory only after opt-in', () => {
    const store = storage();
    const guide = addMemory(readGuide('a', store), 'Fragrance irritates my skin');
    expect(saveGuide('a', guide, store)).toBe(true);
    expect(readGuide('b', store).memories).toEqual([]);
    expect(guideContext(readGuide('a', store))).toBe('');
    expect(guideContext({ ...guide, shareWithAsk: true })).toContain('Fragrance irritates my skin');
    expect(removeMemory(guide, guide.memories[0].id).memories).toEqual([]);
  });

  it('records a dated baseline and follow-up without claiming causation', () => {
    const start = new Date('2026-10-23T12:00:00');
    const guide = startTrial(readGuide('a', storage()), { action: 'Earlier bedtime', goal: 'Morning energy', baseline: 2 }, start);
    expect(guide.trials[0].due).toBe('2026-10-30');
    const done = completeTrial(guide, guide.trials[0].id, 4, 'Also had a week off', new Date('2026-10-30T12:00:00'));
    expect(trialResult(done.trials[0])).toBe('You rated this better at follow-up.');
    const report = appointmentSummary({ guide: done, recap: 'Sleep was shorter this week.', includeRecap: true, now: start });
    expect(report).toContain('2/5 before, 4/5 on 2026-10-30');
    expect(report).toContain('Also had a week off');
    expect(report).toContain('These are observations, not causes or a diagnosis.');
    expect(appointmentSummary({ guide: done, recap: 'Sleep was shorter this week.', now: start })).not.toContain('Sleep was shorter this week.');
  });

  it('includes routine product self-reports only when chosen for an appointment note', () => {
    const notes = productNotesFromRoutine([{ id: 'p1', name: 'Heat wrap' }], { p1: [{ day: '2026-10-20', rating: 'same' }, { day: '2026-10-23', rating: 'helping' }] });
    expect(notes).toEqual(['Heat wrap — I marked it “helping” on 2026-10-23']);
    const guide = readGuide('a', storage());
    expect(appointmentSummary({ guide, productNotes: notes })).toContain('Self-reports, not evidence a product caused the change.');
    expect(appointmentSummary({ guide })).not.toContain('Heat wrap');
  });
});
