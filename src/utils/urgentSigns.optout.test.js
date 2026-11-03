import { describe, it, expect } from 'vitest';
import { urgentSignsFor } from './urgentSigns';

describe('urgentSignsFor opt-out', () => {
  it("drops the postpartum box for a product marked urgentSigns: 'internal-only'", () => {
    const serum = { category: 'intimate-care', tags: ['postpartum'], name: 'Intimate Serum' };
    expect(urgentSignsFor(serum).length).toBeGreaterThan(0);
    expect(urgentSignsFor({ ...serum, urgentSigns: 'internal-only' })).toEqual([]);
  });
});
