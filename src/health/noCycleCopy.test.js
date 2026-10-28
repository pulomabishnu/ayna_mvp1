// QA M9: the post-menopause persona (54, post-menopause, Heavy periods with
// flow "Heavy", hot flashes, trouble sleeping) gets no cycle framing: no
// "Log your period" Rundown card, no "around your cycle", "two cycles" or PMS
// in her sleep routine, no gentle movement "for period pain and PMS".
import { describe, it, expect } from 'vitest';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { profileFromIntake } from './todayState.js';
import { safetyContextFrom, isPostCycle } from './interventions.js';
import { buildRoutines } from './routines.js';
import { decide } from './decisionEngine.js';
import { periodCard } from '../components/rundown/rundownData.js';

const intake = (over) => ({ fullHealthIntake: { ...EMPTY, personalizationCompleted: true, ...over }, personalizationCompleted: true });
const PERSONA = intake({ age: '54', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Heavy periods', 'Hot flashes', 'Trouble sleeping'], periodFlow: 'Heavy' });
const REGULAR = intake({ age: '30', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Trouble sleeping'], periodFlow: 'Heavy' });
const text = (x) => JSON.stringify(x);

describe('no cycle framing after menopause', () => {
  const profile = profileFromIntake(PERSONA);
  const ctx = safetyContextFrom(profile);
  it('a flow answer does not bring the cycle back', () => {
    expect(ctx.noCycle).toBe(true);
    expect(isPostCycle(ctx)).toBe(true);
  });
  it('her sleep routine has no cycle words, no PMS source, no period-pain movement', () => {
    const [r] = buildRoutines({ needs: ['cycle_sleep'], profile, catalog: [] });
    const all = text(r);
    expect(r.label).toBe('sleep');
    expect(all).not.toMatch(/around your cycle|cycles?\b|PMS|period pain/i);
    expect([...r.start, ...r.other].some((x) => x.ref === 'movement')).toBe(false);
  });
  it('Today options and the Rundown period card', () => {
    const d = decide({ profile, logs: [], today: '2026-10-25', intent: { need: 'cycle_sleep', showOptions: true } });
    expect(text(d.items)).not.toMatch(/around your cycle|period pain and PMS/);
    expect(periodCard({ log: {}, healthRows: [], today: '2026-10-25', quiet: isPostCycle(ctx), cycleNeed: true })).toBeNull();
  });
  it('someone with a cycle keeps the cycle framing', () => {
    const p = profileFromIntake(REGULAR);
    expect(safetyContextFrom(p).noCycle).toBe(false);
    const [r] = buildRoutines({ needs: ['cycle_sleep'], profile: p, catalog: [] });
    expect(text(r)).toMatch(/two cycles/i);
  });
});
