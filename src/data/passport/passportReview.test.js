import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../products.js';
import { buildPassport, passportFacts, listedIngredientIds, getPassportFacts, getCorrections, getListingStatus, primePassport, linkStateFor } from './index.js';
import { PASSPORT_REVIEWS } from './reviews.js';

const byId = Object.fromEntries(ALL_PRODUCTS.map((p) => [p.id, p]));
const DAY = 86400000;
const base = { id: 't-pass', name: 'Test Magnesium Capsules', category: 'supplement', type: 'physical', ingredients: 'Magnesium glycinate 200mg, cellulose capsule', safety: {}, url: 'https://brand.example/products/mag' };
const review = (over = {}) => ({
  qa_status: 'in_review',
  reviewed_by: 'test',
  reviewed_at: '2026-10-01',
  last_checked: '2026-10-01',
  next_review_due: '2026-10-15',
  recall_status: 'none_found',
  notes: 'test',
  corrections: [{ field: 'pricing.price', catalog: '$10', source_says: '$12 for 60', source_url: 'https://brand.example/p' }],
  facts: {
    'pricing.price': { value: '$12 for 60', source: 'Brand page', source_url: 'https://brand.example/p', source_type: 'brand', verified_at: '2026-10-01' },
    'safety.pregnancy': { value: 'Consult your physician if pregnant.', source: 'Label', source_url: 'https://brand.example/label', source_type: 'official_label', verified_at: '2026-10-01' },
  },
  ...over,
});
const build = (rev, opts = {}) => buildPassport(base, { reviews: { [base.id]: rev }, links: null, now: Date.parse('2026-10-05T00:00:00Z'), ...opts });

describe('passport review fields', () => {
  it('maps last_checked / next_review_due into dates, and stale after the due date', () => {
    const p = build(review());
    expect(p.dates).toEqual({ first_verified: '2026-10-01', last_verified: '2026-10-01', next_review_due: '2026-10-15' });
    expect(p.freshness.state).toBe('current');
    expect(p.status).toBe('current');
    const later = build(review(), { now: Date.parse('2026-11-01T00:00:00Z') });
    expect(later.freshness.state).toBe('stale');
    expect(later.freshness.days_overdue).toBeGreaterThan(0);
    expect(later.status).toBe('stale');
    expect(later.pricing.price.status).toBe('stale'); // price refresh is 14 days
  });

  it('computes next_review_due from the fact families when the review omits it', () => {
    const p = build(review({ next_review_due: undefined }));
    expect(p.dates.next_review_due).toBe('2026-10-15'); // pricing fact -> 14 days
  });

  it('never-reviewed products are unverified and need review', () => {
    const p = buildPassport(base, { reviews: {}, links: null });
    expect(p.freshness.state).toBe('unverified');
    expect(p.status).toBe('needs_review');
    expect(p.dates).toEqual({ first_verified: null, last_verified: null, next_review_due: null });
  });

  it("recall_status 'recalled' makes the passport recalled; a catalog warning note never does", () => {
    expect(build(review({ recall_status: 'recalled' })).status).toBe('recalled');
    expect(build(review()).safety.recalls.value.text).toBe('No recall found');
    // Catalog "⚠" notes (lawsuits, old recalls, label concerns) are not active recalls.
    for (const id of ['p-boppy-pillow', 'p-lola-tampon', 'p-winx-uti-pain-relief']) {
      if (byId[id]) expect(buildPassport(byId[id], { reviews: {}, links: null }).status).not.toBe('recalled');
    }
  });

  it('discontinued / unavailable come from the review status or structured catalog fields', () => {
    expect(build(review({ status: 'discontinued' })).status).toBe('discontinued');
    expect(buildPassport({ ...base, discontinued: true }, { reviews: {}, links: null }).status).toBe('discontinued');
  });

  it('keeps source_url on every reviewed fact and lists corrections', () => {
    const p = build(review());
    const facts = passportFacts(p);
    const price = facts.find((f) => f.path === 'pricing.price');
    expect(price).toMatchObject({ value: '$12 for 60', source_url: 'https://brand.example/p', reviewed: true, verified_at: '2026-10-01', label: 'Price' });
    expect(facts.find((f) => f.path === 'identity.name')).toMatchObject({ reviewed: false, source_url: null });
    expect(p.corrections).toEqual([{ field: 'pricing.price', catalog: '$10', source_says: '$12 for 60', source_url: 'https://brand.example/p', note: null }]);
  });

  it('PDP helpers return flat facts and corrections for catalog products', () => {
    const product = ALL_PRODUCTS[0];
    const facts = getPassportFacts(product);
    expect(facts.length).toBeGreaterThan(5);
    facts.forEach((f) => expect(f).toHaveProperty('source_url'));
    expect(Array.isArray(getCorrections(product))).toBe(true);
    const reviewedId = Object.keys(PASSPORT_REVIEWS).find((id) => byId[id]);
    if (reviewedId) {
      expect(getPassportFacts(byId[reviewedId]).some((f) => f.reviewed && f.source_url)).toBe(true);
    }
  });
});

describe('link check wiring', () => {
  const links = (purchase, extra = {}) => ({
    generated_at: '2026-10-04T00:00:00Z',
    urls: { 'https://brand.example/products/mag': { kinds: ['purchase'], ...purchase }, ...extra },
  });

  it('404 / 410 on the purchase URL -> unavailable, with an availability fact', () => {
    for (const status of [404, 410]) {
      const p = build(review(), { links: links({ status, ok: false }) });
      expect(p.status).toBe('unavailable');
      expect(p.pricing.link_check.value).toMatchObject({ state: 'unavailable', http_status: status });
    }
  });

  it('bot blocks and timeouts are unverified, never unavailable', () => {
    expect(linkStateFor({ status: 403, ok: false })).toBe('unverified');
    expect(linkStateFor({ status: null, ok: false, error: 'timeout' })).toBe('unverified');
    expect(build(review(), { links: links({ status: 403, ok: false }) }).status).toBe('current');
  });

  it('a changed brand page flags the passport for review', () => {
    const p = build(review(), { links: links({ status: 200, ok: true, changed: true, content_hash: 'b', previous_hash: 'a' }) });
    expect(p.links.changed.map((l) => l.url)).toContain('https://brand.example/products/mag');
    expect(p.status).toBe('needs_review');
  });

  it('source URL results are attached', () => {
    const p = build(review(), { links: links({ status: 200, ok: true }, { 'https://brand.example/p': { kinds: ['source'], status: 404, ok: false } }) });
    expect(p.links.broken.map((l) => l.url)).toContain('https://brand.example/p');
    expect(p.status).toBe('current'); // a broken source does not take the product off the shelf
  });
});

describe('listing status and ingredient ids', () => {
  it('off-shelf listing flag for Shop', () => {
    const product = { ...base, id: 't-listing' };
    primePassport(product, buildPassport(product, { reviews: { [product.id]: review({ recall_status: 'recalled' }) }, links: null }));
    expect(getListingStatus(product)).toMatchObject({ state: 'recalled', offShelf: true, label: 'Recalled' });
    expect(getListingStatus(ALL_PRODUCTS[0]).offShelf).toBe(false);
  });

  it('listedIngredientIds never reads "free of" or "-free" as presence', () => {
    expect(listedIngredientIds('Fragrance-free. Free of soy isoflavones, latex. Contains: cotton')).toEqual(['cotton']);
    expect(listedIngredientIds('Natural rubber latex, cotton').sort()).toEqual(['cotton', 'latex']);
    expect(listedIngredientIds(['Sodium salicylate 162.5 mg', 'Methylparaben']).sort()).toEqual(['parabens', 'sodium-salicylate']);
  });
});
