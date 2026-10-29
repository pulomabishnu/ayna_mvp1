// Algorithm review (Oct 29, second pass): invariants across many personas,
// plus the two fixes it found. See docs/matching/review-2026-10-29.md.
import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct, getEcosystemSeedFromQuiz } from '../data/products.js';
import { buildProductProfile } from './productProfile.js';
import { fitLabel } from '../utils/matchDisplay.js';
import { matchLabel } from './breakdown.js';
import { HELP_TOPIC_ITEMS, supportGroupsForTopics } from '../mobile/data/onboardingFlow.js';

const base = { allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'] };
const q = (over) => ({ fullHealthIntake: { ...base, ...over }, personalizationCompleted: true });

describe('label never claims more than the engine', () => {
  it('80+ the engine did not call Strong (low confidence) reads Good fit', () => {
    expect(fitLabel(84, 'good')).toBe('Good fit');
    expect(fitLabel(84, 'strong')).toBe('Strong fit');
    expect(fitLabel(84)).toBe('Strong fit');
    expect(matchLabel(84, 'good')).toBe('Good fit');
  });
});

describe('post-menopause', () => {
  it('is a topic in the quiz with its own needs', () => {
    expect(HELP_TOPIC_ITEMS['Post-menopause']).toEqual(expect.arrayContaining(['Vaginal dryness', 'Bone health', 'Bladder leakage or incontinence']));
    expect(supportGroupsForTopics(['Post-menopause'])[0].label).toBe('Post-menopause');
  });
  it('never gets period products, cycle trackers or prenatal picks on any shelf', () => {
    for (const needs of [['Hot flashes', 'Night sweats'], ['Vaginal dryness'], ['Bone health'], ['Bladder leakage or incontinence'], ['Period product support'], ['Trouble sleeping', 'Low mood']]) {
      const { shelves } = getEcosystemSeedFromQuiz(q({ lifeStageSelections: ['I am post-menopause'], supportSelections: needs }));
      for (const s of shelves) for (const p of s.picks) {
        const pp = buildProductProfile(ALL_PRODUCTS.find((x) => x.id === p.productId));
        expect(['not_relevant', 'contraindicated'], `${needs} ${p.productId}`).not.toContain(pp.life_stage.postmenopause);
      }
    }
  });
  it('bleeding after menopause gets the see-a-clinician message, not period products', () => {
    const tampon = ALL_PRODUCTS.find((p) => p.category === 'tampon');
    const d = getProductMatchDetailsForProduct(tampon, q({ lifeStageSelections: ['I am post-menopause'], supportSelections: ['Heavy periods'] }));
    expect(['bleeding-evaluation', 'excluded']).toContain(d.matchStatus);
    expect(d.percent || 0).toBe(0);
  });
});
