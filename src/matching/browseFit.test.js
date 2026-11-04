// Browse fit (founder, Nov 4): a product that isn't for anything she picked still shows how it
// would fit her, scored as if she had picked what it's for. It never becomes one of her matches.
import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS, getProductById, getProductMatchDetailsForProduct, fitsHerProfile } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { decideProduct } from './cleared.js';
import { matchBadge } from '../utils/matchDisplay.js';

const safe = { allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'] };
const quiz = (over) => ({ fullHealthIntake: { ...EMPTY, ...safe, ...over }, personalizationCompleted: true });
const crampsAt22 = quiz({ age: '22', lifeStageSelections: ['Regular periods'], supportSelections: ['Cramps or period pain'], periodPain: 'Moderate' });

describe('browse fit', () => {
  it('a cup she did not pick gets a number for what it is for, labelled as not one of hers', () => {
    const d = getProductMatchDetailsForProduct(getProductById('p-saalt-cup'), crampsAt22);
    expect(d.matchStatus).toBe('no-relevance');
    expect(d.browseFit?.percent).toBeGreaterThan(0);
    const badge = matchBadge(d);
    expect(badge?.browse).toBe(true);
  });
  it('never turns into one of her matches (decide, lists)', () => {
    const d = getProductMatchDetailsForProduct(getProductById('p-saalt-cup'), crampsAt22);
    expect(decideProduct(d).status).not.toBe('cleared');
  });
  it('a product for something she did pick keeps its own match, no browse fit', () => {
    const d = getProductMatchDetailsForProduct(getProductById('p-viboos-heating-pad'), crampsAt22);
    expect(d.matchStatus).toBe('scored');
    expect(d.browseFit).toBeUndefined();
  });
  it('how many products get a number for this profile', () => {
    let scored = 0; let browse = 0; let none = 0; let other = 0;
    for (const p of ALL_PRODUCTS) {
      const d = getProductMatchDetailsForProduct(p, crampsAt22);
      if (d.matchStatus === 'scored') scored += 1;
      else if (d.browseFit && !d.browseFit.hold) browse += 1;
      else if (d.browseFit?.hold) other += 1;
      else if (d.matchStatus === 'no-relevance') none += 1;
      else other += 1;
    }
    console.log(JSON.stringify({ total: ALL_PRODUCTS.length, scored, browse, none, other }));
    expect(browse).toBeGreaterThan(0);
    expect(fitsHerProfile).toBeTypeOf('function');
  });
});
