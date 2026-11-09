import { describe, it, expect } from 'vitest';
import {
  EMPTY, SUPPORT_GROUPS, LEGACY_CONCERN_BY_ITEM, buildSnapshot,
  VASOMOTOR_TIMING_OPTIONS, toggleVasomotorTiming, needsVasomotorTiming,
} from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { vasomotorTimingFromIntake } from './vasomotorContext.js';
import { healthAreaLabel } from '../mobile/utils/healthAreaLabel.js';
import { getEcosystemSeedFromQuiz, getMatchCareFlags, getSelectedNeeds } from '../data/products.js';
import { generateTieredRecommendations } from '../utils/recommendationEngine.js';
import { HELP_TOPIC_ITEMS } from '../mobile/data/onboardingFlow.js';
import { MACRO_GROUPS } from '../data/catalogTaxonomy.js';

const input = (stage, support, props = {}) => ({
  ...EMPTY, age: '22', zipcode: '10027', lifeStageSelections: [stage],
  supportSelections: support, allergyStatus: 'No', takesCurrent: 'No',
  diagnosisSelections: ['None that I know of'], safetyConcern: 'No',
  ...props,
});
const snap = i => buildSnapshot(i);
const quiz = i => ({ fullHealthIntake: snap(i), personalizationCompleted: true });

describe('vasomotor symptoms do not cause menopause classification', () => {
  it('shows hot flashes and night sweats as neutral symptoms in the intake', () => {
    const groups = SUPPORT_GROUPS.filter(g => g.items.includes('Hot flashes') || g.items.includes('Night sweats'));
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('Temperature + sweating');
    expect(groups[0].items).toEqual(['Hot flashes', 'Night sweats']);
    expect(SUPPORT_GROUPS.find(g => g.label.startsWith('Perimenopause +'))?.items).toEqual(['Menopause-related body changes']);
    expect(LEGACY_CONCERN_BY_ITEM['Hot flashes']).toBe('Hot flashes and night sweats');
    expect(LEGACY_CONCERN_BY_ITEM['Night sweats']).toBe('Hot flashes and night sweats');
    expect(HELP_TOPIC_ITEMS.Perimenopause).toContain('Hot flashes');
    expect(HELP_TOPIC_ITEMS.Menopause).toContain('Night sweats');
  });

  it('22-year-old with hot flashes around PMS/period or anxiety has symptom shelf, no menopause context', () => {
    const i = input('I get periods regularly', ['Hot flashes', 'PMS symptoms', 'Anxiety'], {
      vasomotorTimingSelections: ['Before my period / PMS', 'During my period', 'When stressed or anxious'],
    });
    const snapshot = snap(i);
    const profile = buildUserProfile(snapshot);
    expect(snapshot.primaryConcerns).toContain('Hot flashes and night sweats');
    expect(snapshot.primaryConcerns).not.toContain('Perimenopause and menopause support');
    expect(profile.physiology.age).toBe(22);
    expect(profile.contexts.menopause_transition).toBeUndefined();
    expect(profile.healthIntent.needs.map(n=>n.id)).toContain('vasomotor.hot_flashes');
    expect(profile.healthIntent.needs.map(n=>n.id)).not.toContain('menopause.body_changes');
    expect(profile.vasomotorTiming).toEqual(['before_period','during_period','stress_anxiety']);
    const eco = getEcosystemSeedFromQuiz(quiz(i), null, { engine: 'v2' });
    expect(eco.shelves.find(s=>s.needId==='vasomotor.hot_flashes')?.label).toBe('Hot flashes');
    expect(eco.shelves.some(s=>s.needId==='menopause.body_changes')).toBe(false);
    const note = getMatchCareFlags(quiz(i)).notes.find(n=>n.code==='vasomotor_other_causes');
    expect(note?.source).toContain('medlineplus.gov');
    expect(note?.text).toMatch(/period/i);
    expect(note?.text).toMatch(/anxious|stress/i);
    expect(note?.text).toMatch(/tracking/i);
    expect(note?.text).not.toMatch(/menopause/i);
  });

  it('co-selecting anxiety and PMS does not manufacture episode timing or a diagnosis', () => {
    const q = quiz(input('I get periods regularly', ['Hot flashes', 'PMS symptoms', 'Anxiety']));
    const profile = buildUserProfile(q);
    expect(profile.vasomotorTiming).toEqual([]);
    expect(profile.contexts.menopause_transition).toBeUndefined();
    const note = getMatchCareFlags(q).notes.find(n => n.code === 'vasomotor_other_causes');
    expect(note?.text).not.toContain('around your period');
    expect(note?.text).toContain('any age');
  });

  it('no period link is assumed from anxiety timing alone', () => {
    const i = input('I get periods regularly', ['Hot flashes','Anxiety'], {vasomotorTimingSelections:['When stressed or anxious']});
    const p = buildUserProfile(snap(i));
    expect(p.vasomotorTiming).toEqual(['stress_anxiety']);
    const note = getMatchCareFlags(quiz(i)).notes.find(n=>n.code==='vasomotor_other_causes');
    expect(note?.text).toMatch(/anxious|stressed/);
    expect(note?.text).not.toContain('around your period');
  });

  it('night sweats alone at 22 are a symptom, not menopause', () => {
    const i = input('I get periods regularly', ['Night sweats'], {vasomotorTimingSelections:['At night']});
    const p = buildUserProfile(snap(i));
    expect(p.contexts.menopause_transition).toBeUndefined();
    expect(p.healthIntent.needs.map(n=>n.id)).toEqual(['vasomotor.night_sweats']);
    expect(getSelectedNeeds(quiz(i)).map(n=>n.id)).toContain('vasomotor.night_sweats');
    expect(getEcosystemSeedFromQuiz(quiz(i)).shelves.map(s=>s.needId)).not.toContain('menopause.body_changes');
  });

  it('actual stated perimenopause and postmenopause still unlock stage-specific context', () => {
    for (const stage of ['I am in perimenopause','I am post-menopause']) {
      const i = input(stage, ['Hot flashes'], {age:'49'});
      const p = buildUserProfile(snap(i));
      expect(p.contexts.menopause_transition, stage).toBeTruthy();
      expect(p.healthIntent.needs.map(n=>n.id)).toContain('vasomotor.hot_flashes');
    }
  });

  it('having regular periods at 45 is not a menopause diagnosis', () => {
    const p = buildUserProfile(snap(input('I get periods regularly',['Hot flashes'],{age:'45'})));
    expect(p.contexts.menopause_transition).toBeUndefined();
  });

  it('old parent concerns cannot override specific current symptom selections', () => {
    const q = quiz(input('I get periods regularly', ['Hot flashes'], {age:'22'}));
    q.primaryConcerns = ['Perimenopause and menopause support'];
    const result = generateTieredRecommendations(q);
    expect(result.some(r=>r.concern==='Hot flashes and night sweats')).toBe(true);
    expect(result.some(r=>r.concern==='Perimenopause and menopause support')).toBe(false);
  });

  it('same match words never become a menopause label solely from symptom', () => {
    expect(healthAreaLabel('Hot flashes')).toBe('Hot flashes & sweats');
    expect(healthAreaLabel('Night sweats')).toBe('Hot flashes & sweats');
    expect(healthAreaLabel('Menopause-related body changes')).toBe('Menopause');
    expect(MACRO_GROUPS.find(g=>g.id==='menopause')?.keywords).not.toContain('hot flash');
  });

  it('timing is optional, exclusive answers are exclusive and structured wins over prose', () => {
    expect(needsVasomotorTiming(input('I get periods regularly',['Hot flashes']))).toBe(true);
    expect(VASOMOTOR_TIMING_OPTIONS).toContain('Before my period / PMS');
    let choices = toggleVasomotorTiming([], 'During my period');
    choices = toggleVasomotorTiming(choices, 'When stressed or anxious');
    choices = toggleVasomotorTiming(choices, 'Not sure');
    expect(choices).toEqual(['Not sure']);
    choices = toggleVasomotorTiming(choices, 'Before my period / PMS');
    expect(choices).toEqual(['Before my period / PMS']);
    const explicit = input('I get periods regularly',['Hot flashes'], {vasomotorTimingSelections:choices,anythingElse:'I get hot flashes with anxiety'});
    expect(vasomotorTimingFromIntake(explicit)).toEqual(['before_period']);
    expect(snap(input('I get periods regularly',['Hot flashes'])).vasomotorTimingSelections).toEqual([]);
  });

  it('existing free-text timing is read without guessing from unrelated prose', () => {
    const inputWithText = input('I get periods regularly',['Hot flashes'],{
      anythingElse: "I get hot flashes during my period and when I'm anxious",
    });
    expect(vasomotorTimingFromIntake(inputWithText)).toContain('around_period_reported');
    expect(vasomotorTimingFromIntake(inputWithText)).toContain('with_stress_reported');
    expect(vasomotorTimingFromIntake(input('I get periods regularly',['Hot flashes'],{anythingElse:'I have PMS and anxiety'}))).toEqual([]);
  });
});
