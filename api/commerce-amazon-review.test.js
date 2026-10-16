import { describe, expect, it } from 'vitest';
import { reviewRowFromBody } from './commerce-amazon-review.js';

const user = { id: '00000000-0000-4000-8000-000000000001', email: 'admin@example.com' };

describe('Amazon review save', () => {
  it('stores the human check as current state', () => {
    const { row } = reviewRowFromBody({ productId: 'p-vitex', variantId: 'v60', asin: 'b003vt3yp0', exactProduct: true, exactVariant: false, verifiedSizeCount: '90 capsules', availabilitySeen: 'AVAILABLE' }, user);
    expect(row).toMatchObject({ product_id: 'p-vitex', ayna_variant_id: 'v60', asin: 'B003VT3YP0', exact_product: true, exact_variant: false, verification_method: 'human', reviewed_by: user.id });
  });

  it('refuses to store an Amazon price', () => {
    expect(reviewRowFromBody({ productId: 'p-vitex', asin: 'B003VT3YP0', priceSeen: 18.99 }, user).error).toBe('amazon_price_not_stored');
  });

  it('validates ids and availability', () => {
    expect(reviewRowFromBody({ productId: 'p-vitex', asin: 'nope' }, user).error).toBe('bad_asin');
    expect(reviewRowFromBody({ productId: 'p-vitex', asin: 'B003VT3YP0', availabilitySeen: 'MAYBE' }, user).error).toBe('bad_availability');
  });
});
