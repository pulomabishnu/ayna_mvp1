import { describe, expect, it } from 'vitest';
import {
  AVOID_GROUPS, AVOID_INGREDIENTS, AVOID_PAIRS, EMPTY, LEGACY_CONCERN_BY_ITEM, PREFERENCE_MAP, SUPPORT_GROUPS,
  asksBreastfeedingOnTiming, buildSnapshot, getIntakeSteps, reconstructIntakeFromSnapshot, ttcDurationOptions,
} from './intakeModel.js';
import { CONCERN_AREAS } from '../../utils/healthIntake.js';

const intake = (patch) => ({ ...EMPTY, ...patch });
const stepIds = (i) => getIntakeSteps(i).map((s) => s.id);

describe('conditional questions', () => {
  it('asks how long you have been trying only when trying to conceive, and saves it', () => {
    expect(stepIds(intake({}))).not.toContain('ttcDuration');
    const ttc = intake({ supportSelections: ['Trying to conceive'], ttcDuration: '6–12 months' });
    expect(stepIds(ttc)).toContain('ttcDuration');
    expect(buildSnapshot(ttc).ttcDuration).toBe('6–12 months');
    expect(buildSnapshot(intake({ ttcDuration: '6–12 months' })).ttcDuration).toBe('');
    expect(reconstructIntakeFromSnapshot(buildSnapshot(ttc)).ttcDuration).toBe('6–12 months');
  });

  it('drops "Not trying yet" when trying to conceive is a life stage', () => {
    expect(ttcDurationOptions(intake({ supportSelections: ['Fertility support'] }))).toContain('Not trying yet');
    expect(ttcDurationOptions(intake({ lifeStageSelections: ['I am trying to conceive'] }))).not.toContain('Not trying yet');
  });

  it('asks and saves breastfeeding for anyone postpartum, from the life stage or a need', () => {
    const byStage = intake({ lifeStageSelections: ['I am postpartum'], breastfeedingStatus: 'Yes' });
    const byNeed = intake({ supportSelections: ['Breastfeeding or lactation support'], breastfeedingStatus: 'No' });
    expect(asksBreastfeedingOnTiming(byStage)).toBe(false);
    expect(asksBreastfeedingOnTiming(byNeed)).toBe(true);
    expect(stepIds(byNeed)).toContain('postpartumTiming');
    expect(buildSnapshot(byStage).breastfeedingStatus).toBe('Yes');
    expect(buildSnapshot(byNeed).breastfeedingStatus).toBe('No');
  });

  it('saves the last period only for perimenopause, and $75+ frequency always', () => {
    const peri = intake({ lifeStageSelections: ['I am in perimenopause'], perimenopauseLastPeriod: '3–6 months ago', largePurchaseFrequency: 'Rarely' });
    const snap = buildSnapshot(peri);
    expect(snap.perimenopauseLastPeriod).toBe('3–6 months ago');
    expect(snap.largePurchaseFrequency).toBe('Rarely');
    expect(buildSnapshot(intake({ perimenopauseLastPeriod: '3–6 months ago' })).perimenopauseLastPeriod).toBe('');
    expect(reconstructIntakeFromSnapshot(snap).largePurchaseFrequency).toBe('Rarely');
  });
});

describe('option strings match their mappings', () => {
  it('maps every support option to a real legacy concern', () => {
    const items = SUPPORT_GROUPS.flatMap((g) => g.items).filter((i) => i !== 'Nothing right now');
    for (const item of items) {
      const mapped = [].concat(LEGACY_CONCERN_BY_ITEM[item] || []);
      expect(mapped.length, item).toBeGreaterThan(0);
      mapped.forEach((m) => expect(CONCERN_AREAS, item).toContain(m));
    }
  });

  it('only maps avoid/must-have options that exist', () => {
    const shown = [...AVOID_GROUPS.avoid, ...AVOID_GROUPS.want];
    shown.forEach((v) => expect(AVOID_INGREDIENTS).toContain(v));
    Object.entries(AVOID_PAIRS).forEach(([k, v]) => { expect(AVOID_INGREDIENTS).toContain(k); expect(AVOID_INGREDIENTS).toContain(v); });
    expect(PREFERENCE_MAP['Animal-derived']).toBe('vegan');
    expect(buildSnapshot(intake({ avoidIngredients: ['Animal-derived', 'Fragrance', 'Fragrance-free'] })).productPreferences).toEqual(expect.arrayContaining(['vegan', 'fragrance-free']));
  });

  it('auto-avoids products that made things worse, using the words the quiz saves', () => {
    const snap = buildSnapshot(intake({ productHistory: [
      { name: 'A', worked: 'Made it worse', reaction: '' },
      { name: 'B', worked: '', reaction: 'Serious' },
      { name: 'C', worked: 'Made things worse', reaction: '' },
      { name: 'D', worked: 'Helped a lot', reaction: 'Mild' },
    ] }));
    expect(snap.dislikedProducts).toEqual(['A', 'B', 'C']);
  });

  it('saves brand support from "Should be" and keeps it on resume', () => {
    const snap = buildSnapshot(intake({ avoidIngredients: ['Black-owned', 'Vegan'] }));
    expect(snap.brandSupportPreferences).toEqual(['Black-owned']);
    const back = reconstructIntakeFromSnapshot(snap);
    expect(back.brandSupportPreferences).toEqual(['Black-owned']);
    expect(buildSnapshot({ ...back, avoidIngredients: ['Vegan'] }).brandSupportPreferences).toEqual([]);
  });
});
