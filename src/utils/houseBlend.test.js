import { describe, expect, it } from 'vitest';
import { readBlend, applyBlend } from './houseBlend.js';
import { buildUserProfile } from '../matching/userProfile.js';

const value = (intake, id) => readBlend(intake).find((b) => b.id === id).value;

describe('house blend', () => {
  it('reads nothing from an empty intake (no invented answers)', () => {
    expect(readBlend({}).map((b) => b.value)).toEqual([null, null, null, null]);
  });
  it('reads and writes the scent preference', () => {
    expect(value({ avoidIngredients: ['Fragrance', 'Fragrance-free'] }, 'scent')).toBe(0);
    expect(value({ avoidIngredients: ['Vegan'] }, 'scent')).toBe(1);
    const off = applyBlend({ avoidIngredients: ['Vegan'], productPreferences: ['vegan'] }, 'scent', 0);
    expect(off.avoidIngredients).toEqual(['Vegan', 'Fragrance', 'Fragrance-free']);
    expect(off.productPreferences).toContain('fragrance-free');
    const on = applyBlend(off, 'scent', 1);
    expect(on.avoidIngredients).toEqual(['Vegan']);
    expect(on.productPreferences).not.toContain('fragrance-free');
  });
  it('budget follows the quiz ranges', () => {
    expect(value({ priceRange: ['Under $25', '$75–$150'] }, 'budget')).toBe(2);
    expect(value({ priceRange: ['Price is not a major factor for me'] }, 'budget')).toBe(3);
    expect(applyBlend({}, 'budget', 0).priceRange).toEqual(['Under $25']);
  });
  it('brands and trust write values the engine reads', () => {
    const next = applyBlend(applyBlend({}, 'brands', 3), 'trust', 1);
    expect(next.brandOpenness).toBe('I enjoy discovering new brands');
    expect(value(next, 'trust')).toBe(1);
    const up = buildUserProfile(applyBlend(next, 'budget', 0));
    expect(up).toBeTruthy();
  });
});
