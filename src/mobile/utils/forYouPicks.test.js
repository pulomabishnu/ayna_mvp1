// QA round 2, B1 item 1: For you shows her matches even when the auto-built
// ecosystem holds them, and no list that implies a fit shows period products.
import { describe, it, expect } from 'vitest';
import { forYouPicks } from './forYouPicks.js';
import { ALL_PRODUCTS, getEcosystemSeedFromQuiz, fitsHerProfile } from '../../data/products.js';
import { EMPTY } from '../data/intakeModel.js';
import { buildProductProfile } from '../../matching/productProfile.js';

const PERSONA = { fullHealthIntake: { ...EMPTY, personalizationCompleted: true, age: '54', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Heavy periods', 'Hot flashes', 'Trouble sleeping'], periodFlow: 'Heavy' }, personalizationCompleted: true };
const PERIOD = new Set(['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cup-steamer']);

describe('For you', () => {
  const seeded = Object.values(getEcosystemSeedFromQuiz(PERSONA).mergedProducts);
  it('auto-built picks still show; ones she added herself do not', () => {
    const eco = seeded.map((p) => ({ ...p, intakeGenerated: true }));
    expect(forYouPicks(seeded, eco).length).toBeGreaterThan(0);
    expect(forYouPicks(seeded, [{ ...seeded[0], userAdded: true }]).some((p) => p.id === seeded[0].id)).toBe(false);
  });
  it('the catalog fallback gate keeps period products out for the persona', () => {
    const shown = ALL_PRODUCTS.filter((p) => fitsHerProfile(p, PERSONA));
    expect(shown.some((p) => PERIOD.has(buildProductProfile(p).category))).toBe(false);
    expect(shown.length).toBeGreaterThan(20);
    expect(fitsHerProfile(ALL_PRODUCTS[0], null)).toBe(true);
  });
});
