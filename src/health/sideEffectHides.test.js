// "Side effect" on a tracked try hides that product from her matches in the
// live engine (v1 ranking) and in v2's ecosystem; undoing it brings it back.
import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS, getRecommendationMatchesAndRest, getProductMatchDetailsForProduct } from '../data/products.js';
import { createTry, recordOutcome, outcomesToProductHistory } from './outcomes.js';
import { buildUserProfile } from '../matching/userProfile.js';
import { buildEcosystemV2 } from '../matching/v2.js';
import { withOutcomeHistory } from './outcomes.js';

const quiz = { age: 24, lifeStageSelections: ['I have regular periods'], supportSelections: ['Cramps or period pain'] };

describe('Side effect hides the product', () => {
  const { matches } = getRecommendationMatchesAndRest(quiz);
  const target = matches[0];
  const sideEffect = recordOutcome(createTry({ kind: 'product', product: target, startedDay: '2026-08-01' }), 'side_effect', { day: '2026-09-01' });

  it('v1: gone from matches, with a plain reason; back after undo', () => {
    expect(target).toBeTruthy();
    const outcomeHistory = outcomesToProductHistory([sideEffect], ALL_PRODUCTS);
    const after = getRecommendationMatchesAndRest(quiz, null, { outcomeHistory });
    expect([...after.matches, ...after.others].map((p) => p.id)).not.toContain(target.id);
    const d = getProductMatchDetailsForProduct(target, quiz, null, { outcomeHistory });
    expect(d.eligible).toBe(false);
    expect(JSON.stringify(d)).toMatch(/side effect/i);
    // Undo: the try is removed (tombstone) or the outcome cleared.
    const undone = outcomesToProductHistory([{ ...sideEffect, removed: true }], ALL_PRODUCTS);
    expect(undone).toEqual([]);
    const back = getRecommendationMatchesAndRest(quiz, null, { outcomeHistory: undone });
    expect(back.matches.map((p) => p.id)).toContain(target.id);
  });

  it('v2: never picked for her ecosystem', () => {
    const intake = withOutcomeHistory({ ...quiz }, outcomesToProductHistory([sideEffect], ALL_PRODUCTS));
    const up = buildUserProfile(intake, { catalog: ALL_PRODUCTS });
    const eco = buildEcosystemV2(up, ALL_PRODUCTS);
    expect(JSON.stringify(eco)).not.toContain(`"${target.id}"`);
    const upBefore = buildUserProfile({ ...quiz }, { catalog: ALL_PRODUCTS });
    expect(JSON.stringify(buildEcosystemV2(upBefore, ALL_PRODUCTS))).toContain(`"${target.id}"`);
  });
});
