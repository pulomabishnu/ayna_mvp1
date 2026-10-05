import { describe, it, expect } from 'vitest';
import { computeProfileCompletion, COMPLETION_STEPS } from './profileCompletion';

describe('profile completion', () => {
  it('weights sum to 100', () => {
    expect(COMPLETION_STEPS.reduce((s, x) => s + x.weight, 0)).toBe(100);
  });
  it('is 0 signed out and 100 when everything is done', () => {
    expect(computeProfileCompletion().percent).toBe(0);
    expect(computeProfileCompletion({
      signedIn: true, quizDone: true, ecosystemCount: 5, communityProfile: { bio: 'hi' }, phoneVerified: true, contributions: 2,
    }).percent).toBe(100);
  });
  it('gives partial ecosystem credit and a helpful next step', () => {
    const r = computeProfileCompletion({ signedIn: true, quizDone: true, ecosystemCount: 1 });
    expect(r.percent).toBe(10 + 30 + 7);
    expect(r.next.key).toBe('ecosystem');
    expect(r.next.label).toBe('Add 2 more products');
  });
  it('a bare community profile is partial', () => {
    const r = computeProfileCompletion({ signedIn: true, communityProfile: { username: 'x', public_interests: [] } });
    expect(r.steps.find((s) => s.key === 'community').done).toBe(false);
    expect(r.percent).toBe(10 + 6);
  });
});
