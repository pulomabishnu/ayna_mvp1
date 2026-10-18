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
