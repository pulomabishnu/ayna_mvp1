import { describe, it, expect } from 'vitest';
import { ONLINE_REVIEWS, NO_TRUSTED_REVIEWS, onlineReviewsFor } from './onlineReviews.js';
import { CATALOG_PRODUCTS } from '../products.js';

const byId = new Map(CATALOG_PRODUCTS.map((p) => [p.id, p]));

describe('ayna’s summaries of online reviews', () => {
  it('only covers real products whose team copy has no review text (never replaces the team’s)', () => {
    for (const id of [...Object.keys(ONLINE_REVIEWS), ...NO_TRUSTED_REVIEWS]) {
      const p = byId.get(id);
      expect(p, id).toBeTruthy();
      expect(String(p.communityReview || '').trim().length <= 20, id).toBe(true);
    }
  });
  it('every summary has points, a checked date and https sources', () => {
    for (const [id, r] of Object.entries(ONLINE_REVIEWS)) {
      expect(r.points.length, id).toBeGreaterThan(0);
      expect(r.checked, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.sources.length, id).toBeGreaterThan(0);
      for (const s of r.sources) { expect(s.url, id).toMatch(/^https:\/\//); expect(s.label, id).toBeTruthy(); }
      for (const t of r.points) expect(t, id).not.toMatch(/—|–/);
    }
  });
  it('a product checked with nothing trustworthy says so; an unchecked one returns nothing', () => {
    expect(onlineReviewsFor(NO_TRUSTED_REVIEWS[0])).toMatchObject({ none: true });
    expect(onlineReviewsFor('not-a-product')).toBe(null);
    expect(NO_TRUSTED_REVIEWS.some((id) => ONLINE_REVIEWS[id])).toBe(false);
  });
});
