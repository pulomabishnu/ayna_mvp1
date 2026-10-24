import { describe, expect, it } from 'vitest';
import { EMPTY, buildSnapshot, getIntakeSteps, reconstructIntakeFromSnapshot } from './intakeModel.js';
import { GOALS, HELP_TOPICS, HELP_TOPIC_ITEMS, LATER_STEP_IDS, getOnboardingSteps, moreRemaining, onboardingProgress, supportGroupsForTopics, topicsFromSupport } from './onboardingFlow.js';
import { buildUserProfile } from '../../matching/userProfile.js';
import { nextProgressiveAsk, progressiveAskId } from '../utils/profileCompleteness.js';
import { decide, dismissWithReason, typeKey } from '../../health/decisionEngine.js';
import { aynaBeliefs } from '../../utils/aynaBeliefs.js';
import { SUPPORT_GROUPS } from './intakeModel.js';

const intake = (over = {}) => ({ ...EMPTY, ...over });
const ids = (i) => getOnboardingSteps(intake(i)).map((s) => s.id);

describe('first-run setup (seven screens)', () => {
  it('asks every required question, in screen order, and leaves only the rarely needed ones for later', () => {
    for (const over of [{}, { supportSelections: ['Cramps or period pain', 'Heavy periods'], lifeStageSelections: ['I am pregnant'] }, { supportSelections: ['Burning with urination'], lifeStageSelections: ['I am postpartum', 'I am trying to conceive'] }]) {
      const all = getIntakeSteps(intake(over));
      const ob = getOnboardingSteps(intake(over));
      const obIds = new Set(ob.map((s) => s.id));
      for (const s of all.filter((x) => x.required)) expect(obIds.has(s.id)).toBe(true);
      // Nothing from the full quiz is lost: each step is in the first run or asked later.
      for (const s of all) expect(obIds.has(s.id) || LATER_STEP_IDS.includes(s.id)).toBe(true);
      const screens = ob.map((s) => s.screen);
      expect([...screens].sort((a, b) => a - b)).toEqual(screens);
      expect(ob.every((s) => s.why)).toBe(true);
    }
    expect(ids({}).slice(0, 3)).toEqual(['helpTopics', 'support', 'safety']);
  });

  it('minimum questions first, the optional ones only after the reveal', () => {
    const i = intake({ supportSelections: ['Cramps or period pain'] });
    const core = getOnboardingSteps(i, { part: 'core' });
    const more = getOnboardingSteps(i, { part: 'more' });
    expect(core.map((s) => s.id)).toEqual(['helpTopics', 'support', 'periodPain', 'safety', 'age', 'lifeStage', 'conditions', 'allergies', 'medications']);
    expect(more.map((s) => s.id)).toEqual(['goals', 'formats', 'priceRange', 'avoidIngredients', 'preferIngredients', 'fsaHsa', 'trust', 'periodFlow']);
    expect(onboardingProgress(core[4], 'core').label).toBe('Step 3 of 5');
    expect(more.find((s) => s.id === 'priceRange').title).toBe('What would you usually spend on one product?');
    expect(more.find((s) => s.id === 'avoidIngredients').title).toBe('Anything you want your products to avoid?');
    expect(more.find((s) => s.id === 'preferIngredients').title).toBe('Anything you prefer your products to have or be?');
    expect(more.find((s) => s.id === 'fsaHsa').subtitle).toMatch(/before tax/);
    expect(moreRemaining(i)).toBe(8);
    expect(moreRemaining({ ...i, goals: ['Improve sleep'], skippedSteps: ['formats', 'priceRange', 'avoidIngredients', 'preferIngredients', 'fsaHsa', 'trust', 'periodFlow'] })).toBe(0);
  });

  it('screen 1 is a list of topics with Something else; screen 3 the spec goals', () => {
    expect(HELP_TOPICS).toContain('Something else');
    expect(HELP_TOPICS).toContain('Periods & cramps');
    expect(getOnboardingSteps(intake())[0].title).toBe('What would you like ayna to help you with?');
    expect(GOALS).toContain('Find evidence-backed options');
    expect(getOnboardingSteps(intake())[0].subtitle).toContain('You don’t need a diagnosis to use ayna.');
  });

  it('topics only narrow screen 2; no topic shows everything; every option is a real intake option', () => {
    const known = new Set(SUPPORT_GROUPS.flatMap((g) => g.items));
    for (const items of Object.values(HELP_TOPIC_ITEMS)) for (const i of items) expect(known.has(i)).toBe(true);
    expect(supportGroupsForTopics([]).length).toBeGreaterThan(10);
    const g = supportGroupsForTopics(['Sleep', 'Energy']);
    const flat = g.flatMap((x) => x.items);
    expect(new Set(flat).size).toBe(flat.length);
    expect(flat).toContain('Trouble sleeping');
    expect(topicsFromSupport(['Trouble sleeping'])).toContain('Sleep');
  });

  it('topics and goals are saved but never become needs', () => {
    const base = intake({ age: '30', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Trouble sleeping'] });
    const a = buildSnapshot(base);
    const b = buildSnapshot({ ...base, helpTopics: ['PCOS', 'Fertility'], goals: ['Support fertility', 'Manage symptoms'] });
    expect(b.helpTopics).toEqual(['PCOS', 'Fertility']);
    expect(b.goals).toEqual(['Support fertility', 'Manage symptoms']);
    expect(buildUserProfile(b).healthIntent.needs.map((n) => n.id)).toEqual(buildUserProfile(a).healthIntent.needs.map((n) => n.id));
    expect(reconstructIntakeFromSnapshot(b).goals).toEqual(['Support fertility', 'Manage symptoms']);
  });
});

describe('progressive asks', () => {
  const done = buildSnapshot(intake({ age: '30', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Trouble sleeping'], diagnosisSelections: ['None that I know of'], allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No' }));
  it('asks one skipped question at a time, never one already answered', () => {
    const first = nextProgressiveAsk(done, { today: '2026-10-24' });
    expect(first.stepId).toBe('goals');
    const later = nextProgressiveAsk({ ...done, goals: ['Improve sleep'] }, { today: '2026-10-24' });
    expect(later.stepId).toBe('formats');
  });
  it('"Not now" keeps a question away until it expires', () => {
    const dismissed = { [progressiveAskId('goals')]: { until: '2026-11-20' } };
    expect(nextProgressiveAsk(done, { dismissed, today: '2026-10-24' }).stepId).toBe('formats');
    expect(nextProgressiveAsk(done, { dismissed, today: '2026-11-21' }).stepId).toBe('goals');
  });
  it('a question she skipped during setup waits a week', () => {
    const fresh = { ...done, skippedSteps: ['goals'], personalizationCompletedAt: '2026-10-24T10:00:00Z' };
    expect(nextProgressiveAsk(fresh, { today: '2026-10-25' }).stepId).toBe('formats');
    expect(nextProgressiveAsk(fresh, { today: '2026-11-02' }).stepId).toBe('goals');
  });
  it('nothing before the first run is finished', () => {
    expect(nextProgressiveAsk({ ...done, personalizationCompleted: false })).toBeNull();
  });
});

describe('Not useful reasons', () => {
  it("Don't show this type hides the whole type, never care", () => {
    const today = '2026-10-24';
    const base = decide({ today, logs: [] });
    const checkIn = base.items.find((i) => i.type === 'check_in');
    expect(checkIn).toBeTruthy();
    const dismissed = dismissWithReason({}, checkIn, today, 'dont_show_type');
    expect(dismissed[typeKey('check_in')].reason).toBe('dont_show_type');
    expect(dismissed[checkIn.id].reason).toBe('dont_show_type');
    const after = decide({ today, logs: [], dismissed: { [typeKey('check_in')]: dismissed[typeKey('check_in')] } });
    expect(after.items.some((i) => i.type === 'check_in')).toBe(false);
    expect(after.debug.suppressed.some((s) => s.why === 'type_dismissed')).toBe(true);
    // Unknown reasons are stored as not_relevant.
    expect(dismissWithReason({}, checkIn, today, 'weird')[checkIn.id].reason).toBe('not_relevant');
  });
});

describe('What ayna knows', () => {
  it('lists stated answers with their source and removes one cleanly', () => {
    const snap = buildSnapshot(intake({ age: '31', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Trouble sleeping', 'Acne'], goals: ['Improve sleep'], helpTopics: ['Sleep'], allergyStatus: 'Yes', allergyItems: ['Latex'] }));
    const groups = aynaBeliefs(snap, { todayAnswers: { pregnancy: 'no' } });
    const needs = groups.find((g) => g.id === 'needs').rows;
    expect(needs.map((r) => r.source)).toEqual(['stated', 'stated']);
    const acne = needs.find((r) => /acne/i.test(r.label));
    const next = acne.remove();
    expect(next.supportSelections).toEqual(['Trouble sleeping']);
    expect(next.goals).toEqual(['Improve sleep']);
    expect(groups.find((g) => g.id === 'interests').note).toMatch(/never change a match/);
    expect(groups.find((g) => g.id === 'safety').rows.some((r) => r.source === 'today')).toBe(true);
    expect(groups.find((g) => g.id === 'data').rows[0].missing).toBe(true);
  });
  it('a missing answer is shown as missing, not guessed', () => {
    const snap = buildSnapshot(intake({ supportSelections: ['Trouble sleeping'] }));
    const stage = aynaBeliefs(snap).find((g) => g.id === 'stage').rows;
    expect(stage.find((r) => r.id === 'age').missing).toBe(true);
  });
});

