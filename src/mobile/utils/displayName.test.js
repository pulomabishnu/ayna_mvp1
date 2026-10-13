import { describe, expect, it } from 'vitest';
import { displayName } from './displayName.js';

describe('displayName', () => {
  it('drops a leading brand already shown on the card', () => {
    expect(displayName({ name: 'Neycher Odor Be Gone', brand: 'Neycher' })).toBe('Odor Be Gone');
    expect(displayName({ name: 'Saalt Menstrual Cup', brand: 'saalt' })).toBe('Menstrual Cup');
    expect(displayName({ name: 'Proov Complete Fertility Testing', brand: 'Proov' })).toBe('Complete Fertility Testing');
  });
  it('keeps names where the brand is not a separate leading word', () => {
    expect(displayName({ name: 'Classic Pelvic Bra', brand: 'My Pelvic Bra' })).toBe('Classic Pelvic Bra');
    expect(displayName({ name: 'Floraboost', brand: 'Flora' })).toBe('Floraboost');
    expect(displayName({ name: 'Thinx', brand: 'Thinx' })).toBe('Thinx');
    expect(displayName({ name: 'Flex Disc' })).toBe('Flex Disc');
    expect(displayName({ name: 'Uqora Control', brand: 'Uqora' })).toBe('Uqora Control');
  });
});
