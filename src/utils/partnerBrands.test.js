import { describe, it, expect } from 'vitest';
import { isPartnerBrandItem, getPartnerBrandRank, PARTNER_BRAND_ORDER } from './partnerBrands';

describe('partnerBrands', () => {
  it('ranks partners in the requested 2026-09-16 display order', () => {
    const order = ['BUNI Body', 'SootheHer', 'Neycher', 'Winx Health', 'gina', 'Elitone', 'Proov', 'VIO2', 'My Pelvic Bra', 'Connect Pelvic Floor Fitness', 'LOLA'];
    const ranks = order.map((brand) => getPartnerBrandRank({ brand, name: 'Some Product' }));
    expect(ranks.every((r) => r !== null)).toBe(true);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it('does not treat "gina" as matching inside "vagina"', () => {
    expect(isPartnerBrandItem({ brand: '', name: 'Vaginal Moisturizer' })).toBe(false);
  });

  it('recognizes gina as a partner via a real product', () => {
    expect(isPartnerBrandItem({ brand: 'gina', name: 'POWER Protein Builder' })).toBe(true);
  });

  it('ranks Elitone URGE the same as Elitone (brand-level match)', () => {
    const eli = getPartnerBrandRank({ brand: 'Elitone', name: 'Elitone (Stress + Mixed Incontinence)' });
    const urge = getPartnerBrandRank({ brand: 'Elitone', name: 'Elitone URGE (Overactive Bladder)' });
    expect(eli).toBe(urge);
  });

  it('keeps a confirmed partner not in the explicit priority list as a partner, ranked after it', () => {
    const lim = getPartnerBrandRank({ brand: 'LiM Method', name: 'The LiM Bundle' });
    const lastRanked = getPartnerBrandRank({ brand: 'LOLA', name: 'LOLA Organic Cotton Pads' });
    expect(lim).not.toBeNull();
    expect(lim).toBeGreaterThan(lastRanked);
  });

  it('returns null for a non-partner product', () => {
    expect(getPartnerBrandRank({ brand: 'Tampax', name: 'Tampax Pearl' })).toBeNull();
    expect(isPartnerBrandItem({ brand: 'Tampax', name: 'Tampax Pearl' })).toBe(false);
  });

  it('PARTNER_BRAND_ORDER has no duplicate patterns', () => {
    const sources = PARTNER_BRAND_ORDER.map((p) => p.source);
    expect(new Set(sources).size).toBe(sources.length);
  });
});
