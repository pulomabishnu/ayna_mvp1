import { describe, it, expect } from 'vitest';
import { mapIntakeToLegacyQuizProfile } from './healthIntake.js';
import { EMPTY, buildSnapshot } from '../mobile/data/intakeModel.js';

const legacy = (over) => mapIntakeToLegacyQuizProfile(buildSnapshot({ ...EMPTY, ...over })).frustrations;

describe('mapIntakeToLegacyQuizProfile: UI categories are not causes (ASK2)', () => {
  it('vaginal answers never become "Recurrent UTIs"', () => {
    expect(legacy({ supportSelections: ['Vaginal dryness', 'Vaginal odor', 'BV concerns', 'Yeast infection concerns'] })).not.toContain('Recurrent UTIs');
    expect(mapIntakeToLegacyQuizProfile({ customConcerns: ['vaginal itching'], primaryConcerns: [] }).frustrations).toEqual([]);
    expect(mapIntakeToLegacyQuizProfile({ primaryConcerns: ['Gut and vaginal health (probiotics, pH balance)'] }).frustrations).toEqual([]);
  });

  it('night sweats is not "Menopause symptoms" unless she shared the stage', () => {
    expect(legacy({ supportSelections: ['Night sweats', 'Hot flashes'], lifeStageSelections: ['I get periods regularly'] })).toEqual([]);
    expect(legacy({ supportSelections: ['Night sweats'], lifeStageSelections: ['I am in perimenopause'] })).toEqual(['Menopause symptoms']);
  });

  it('digestive bloating is not cycle bloating; joint or abdominal pain is not cramps', () => {
    expect(legacy({ supportSelections: ['Digestive bloating'] })).toEqual([]);
    expect(legacy({ supportSelections: ['Cycle-related bloating'] })).toEqual(['Hormonal bloating']);
    expect(mapIntakeToLegacyQuizProfile({ customConcerns: ['joint pain', 'stomach pain'] }).frustrations).toEqual([]);
    expect(mapIntakeToLegacyQuizProfile({ customConcerns: ['bad period cramps'] }).frustrations).toEqual(['Painful cramps']);
  });

  it('broad areas no longer collapse into unrelated labels', () => {
    const f = mapIntakeToLegacyQuizProfile({ primaryConcerns: ['Hormone balance (supplements, lifestyle)', 'Skin and hair (hormone-related)', 'Sexual health and comfort (lubricants, pelvic floor)'] }).frustrations;
    expect(f).not.toContain('Hormonal bloating');
    expect(f).not.toContain('Pelvic pain');
  });

  it('keeps exact equivalents', () => {
    expect(legacy({ supportSelections: ['Heavy periods', 'Cramps or period pain', 'Recurrent UTI-like symptoms', 'Pelvic pain'] }))
      .toEqual(expect.arrayContaining(['Heavy flow', 'Painful cramps', 'Recurrent UTIs', 'Pelvic pain']));
  });
});
