import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile, SAFETY_CONFIRM_DAYS } from './userProfile.js';
import { buildProductProfile } from './productProfile.js';
import { evaluateSafety } from './score.js';

const NOW = Date.parse('2026-11-02T12:00:00Z');
const DAY = 86400000;
const base = { allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'] };
const up = (over, ageDays) => buildUserProfile({ ...EMPTY, ...base, ...over, personalizationCompletedAt: new Date(NOW - ageDays * DAY).toISOString() }, { catalog: ALL_PRODUCTS, now: NOW });
const ingested = ALL_PRODUCTS.find((p) => p.id === 'p-magnesium-glycinate');

describe('risk-based freshness (Nov 2)', () => {
  it('a pregnancy answer older than the confirm window asks "still pregnant?" before anything she takes', () => {
    expect(SAFETY_CONFIRM_DAYS.pregnancy).toBeLessThan(280);
    const fresh = evaluateSafety(buildProductProfile(ingested), up({ lifeStageSelections: ['I am pregnant'], supportSelections: ['Trouble sleeping'] }, 10));
    const old = evaluateSafety(buildProductProfile(ingested), up({ lifeStageSelections: ['I am pregnant'], supportSelections: ['Trouble sleeping'] }, 120));
    expect(fresh.missingFields).not.toContain('pregnancy_current');
    expect(old.missingFields).toContain('pregnancy_current');
  });
  it('the same old answer does not hold a pad (nothing she takes)', () => {
    const pad = ALL_PRODUCTS.find((p) => p.category === 'pad');
    const s = evaluateSafety(buildProductProfile(pad), up({ lifeStageSelections: ['I am pregnant'], supportSelections: ['Heavy periods'] }, 120));
    expect(s.missingFields).not.toContain('pregnancy_current');
  });
  it('pregnant and trying to conceive at once asks which is true before anything she takes', () => {
    const p = up({ lifeStageSelections: ['I am pregnant', 'I am trying to conceive'], supportSelections: ['Trouble sleeping'] }, 1);
    expect(p.contradictions.map((c) => c.code)).toContain('pregnant_vs_ttc');
  });
});
