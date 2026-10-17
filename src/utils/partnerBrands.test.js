import { describe, it, expect } from 'vitest';
import {
  isPartnerBrandItem,
  getPartnerBrandRank,
  isPrelaunchPartnerItem,
  getPartnerBadgeLabel,
  getPartnerDisclosureText,
  PARTNER_BRAND_ORDER,
} from './partnerBrands';
import { ALL_PRODUCTS } from '../data/products';
import { resolveBuyUrl } from './buyLink';

describe('partnerBrands', () => {
  it('ranks partners in the team 2026-10-17 display order', () => {
    const order = ['BUNI Body', 'LiM Method', 'Winx Health', 'Neycher', 'SootheHer', 'Alubri', 'Connect Pelvic Floor Fitness', 'Elitone', 'LOLA', 'Proov', 'gina', 'Tampon Tribe', 'My Pelvic Bra', 'VIO2'];
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

  it('ranks the pre-launch partner Rèsa first for now (Eliz, 2026-10-17)', () => {
    expect(getPartnerBrandRank({ brand: 'Rèsa', name: 'Rèsa Rhythm Bracelet' })).toBe(0);
  });

  it('returns null for a non-partner product', () => {
    expect(getPartnerBrandRank({ brand: 'Tampax', name: 'Tampax Pearl' })).toBeNull();
    expect(isPartnerBrandItem({ brand: 'Tampax', name: 'Tampax Pearl' })).toBe(false);
  });

  it('PARTNER_BRAND_ORDER has no duplicate patterns', () => {
    const sources = PARTNER_BRAND_ORDER.map((p) => p.source);
    expect(new Set(sources).size).toBe(sources.length);
  });

  describe('Rèsa (pre-launch partner)', () => {
    const resa = ALL_PRODUCTS.find((p) => p.id === 'p-resa-rhythm-bracelet');

    it('is in the catalog and recognized as a pre-launch partner', () => {
      expect(resa).toBeTruthy();
      expect(isPartnerBrandItem(resa)).toBe(true);
      expect(isPrelaunchPartnerItem(resa)).toBe(true);
      expect(isPrelaunchPartnerItem({ brand: 'Resa', name: 'Bracelet' })).toBe(true);
    });

    it('gets the waitlist badge and the no-commission disclosure', () => {
      expect(getPartnerBadgeLabel(resa)).toBe('ayna partner · Waitlist');
      expect(getPartnerDisclosureText(resa)).toMatch(/does not earn a commission/);
    });

    it('sends Buy to the tracked UTM waitlist link', () => {
      expect(resolveBuyUrl(resa)).toBe('https://shop.resa-labs.com/?utm_source=ayna_partner&utm_medium=referral&utm_campaign=market_test');
    });

    it('leaves regular partners on the standard badge and disclosure', () => {
      const buni = { brand: 'BUNI', name: 'Vulva Balm' };
      expect(isPrelaunchPartnerItem(buni)).toBe(false);
      expect(getPartnerBadgeLabel(buni)).toBe('ayna partner');
      expect(getPartnerDisclosureText(buni)).toMatch(/may earn a commission/);
    });

    it('matches no catalog product other than Rèsa', () => {
      const hits = ALL_PRODUCTS.filter((p) => isPrelaunchPartnerItem(p)).map((p) => p.id);
      expect(hits).toEqual(['p-resa-rhythm-bracelet']);
    });
  });
});
