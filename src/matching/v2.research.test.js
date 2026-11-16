import { describe, it, expect } from 'vitest';
import { researchNudge } from './v2.js';

describe('researchNudge (Nov 16: more research ranks a same-fit product higher)', () => {
  it('product studies count most, capped small, nothing on file = 0', () => {
    const one = { passport: { claim_evidence: { 'pain.menstrual_cramp': { product_specific: 1, guideline: 0, ingredient_level: 0 } } } };
    const more = { passport: { claim_evidence: { 'pain.menstrual_cramp': { product_specific: 2, guideline: 1, ingredient_level: 1 } } } };
    const lots = { passport: { claim_evidence: { 'pain.menstrual_cramp': { product_specific: 9, guideline: 9, ingredient_level: 9 } } } };
    expect(researchNudge({}, 'pain.menstrual_cramp')).toBe(0);
    expect(researchNudge(more, 'pain.menstrual_cramp')).toBeGreaterThan(researchNudge(one, 'pain.menstrual_cramp'));
    expect(researchNudge(lots, 'pain.menstrual_cramp')).toBe(0.03);
    expect(researchNudge(one, 'sleep.trouble')).toBe(0);
  });
});
