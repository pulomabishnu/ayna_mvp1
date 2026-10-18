import { describe, expect, it } from 'vitest';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from '../matching/userProfile.js';
import { V2 } from '../matching/v2.js';
import { healthMatchContext } from './matchContext.js';

const intake = (over) => ({ ...EMPTY, ...over });
const sleepSignal = [{ needId: 'sleep.trouble', summary: 'Your recent sleep has been shorter than your usual', sources: ['apple_health'], metric: 'sleep_minutes', section: 'sleep' }];

describe('health data in the matching engine', () => {
  it('strengthens a need she chose and records where it came from', () => {
    const ctx = healthMatchContext(sleepSignal, ['sleep.trouble']);
    const up = buildUserProfile(intake({ supportSelections: ['Trouble sleeping'] }), { healthContext: ctx });
    const need = up.healthIntent.needs.find((n) => n.id === 'sleep.trouble');
    expect(need.corroborated).toBe(true);
    expect(need.healthData.sources).toEqual(['apple_health']);
  });

  it('never creates a need she did not choose', () => {
    const ctx = { byNeed: { 'sleep.trouble': sleepSignal[0] }, suggestions: [] };
    const up = buildUserProfile(intake({ supportSelections: ['Heavy periods'] }), { healthContext: ctx });
    expect(up.healthIntent.needs.map((n) => n.id)).not.toContain('sleep.trouble');
  });

  it('without health data the profile is unchanged', () => {
    const a = buildUserProfile(intake({ supportSelections: ['Trouble sleeping'] }));
    expect(a.healthIntent.needs[0].corroborated).toBeUndefined();
  });

  it('the boost is bounded so data never outweighs what she said first', () => {
    expect(V2.needWeight.picked + V2.corroborationBoost).toBeLessThan(V2.needWeight.first);
  });
});

describe('Apple Health Records in matching', () => {
  it('join the profile for safety and context but never add a need', async () => {
    const { getSelectedNeeds, getMatchCareFlags } = await import('../data/products.js');
    const q = { supportSelections: ['Trouble sleeping'] };
    const healthRecords = { allergies: ['Latex'], conditions: ['Endometriosis'], medications: ['Warfarin'] };
    expect(getSelectedNeeds(q, null, { healthRecords }).map((n) => n.id)).toEqual(getSelectedNeeds(q).map((n) => n.id));
    expect(getMatchCareFlags(q, null, { healthRecords }).profileCompleteness).toBeGreaterThan(getMatchCareFlags(q).profileCompleteness);
  });
});
