/* global process */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockRes } from './_test-helpers.js';

let queryResult = { data: [], error: null };

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve(queryResult),
        }),
      }),
    }),
  }),
}));

async function loadHandler() {
  vi.resetModules();
  const mod = await import('./products.js');
  return mod.default;
}

beforeEach(() => {
  queryResult = { data: [], error: null };
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.VITE_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_ANON_KEY;
});

describe('products', () => {
  it('rejects non-GET methods', async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'POST' }, res);
    expect(res.statusCode).toBe(405);
  });

  it('503s with a clear reason when Supabase env vars are not configured', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET' }, res);
    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ error: 'not_configured', products: [] });
  });

  it('maps a DB row into the historical camelCase client shape, preserving extra fields', async () => {
    queryResult = {
      data: [{
        id: 'p1',
        name: 'DivaCup',
        category: 'cup',
        product_type: 'physical',
        tags: ['reusable'],
        health_functions: ['period-care'],
        where_to_buy: ['Amazon'],
        safety: { fdaStatus: 'Class II' },
        brand: 'Diva International',
        summary: 'A menstrual cup.',
        price: '$30',
        doctor_opinion: 'Great choice.',
        community_review: 'Widely loved.',
        effectiveness: 'Holds 30mL.',
        clinician_opinion_source: 'independent',
        clinician_attribution: 'Dr. Jen Gunter',
        internal: true,
        requires_prescription: false,
        user_rating: 4.5,
        source: 'curated',
        extra: { verificationLinks: { doctor: { aiSummary: 'x' } } },
      }],
      error: null,
    };
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET' }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.products).toHaveLength(1);
    const p = res.body.products[0];
    expect(p.id).toBe('p1');
    expect(p.type).toBe('physical');
    expect(p.healthFunctions).toEqual(['period-care']);
    expect(p.whereToBuy).toEqual(['Amazon']);
    expect(p.doctorOpinion).toBe('Great choice.');
    expect(p.communityReview).toBe('Widely loved.');
    expect(p.clinicianAttribution).toBe('Dr. Jen Gunter');
    expect(p.internal).toBe(true);
    expect(p.requiresPrescription).toBeUndefined();
    expect(p.userRating).toBe(4.5);
    expect(p.verificationLinks).toEqual({ doctor: { aiSummary: 'x' } });
  });

  it('omits requiresPrescription entirely (not false) when the row does not require one', async () => {
    queryResult = { data: [{ id: 'p1', name: 'x', category: 'c', product_type: 'physical', requires_prescription: false }], error: null };
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET' }, res);
    expect('requiresPrescription' in res.body.products[0]).toBe(false);
  });

  it('503s with catalog_empty when the table has no active rows, instead of serving an empty catalog silently', async () => {
    queryResult = { data: [], error: null };
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET' }, res);
    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ error: 'catalog_empty', products: [] });
  });

  it('502s on a query error rather than serving a partial/empty catalog as success', async () => {
    queryResult = { data: null, error: { message: 'connection refused' } };
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET' }, res);
    expect(res.statusCode).toBe(502);
    expect(res.body).toEqual({ error: 'query_failed', products: [] });
  });

  it('sets a long-lived public cache header on a successful response', async () => {
    queryResult = { data: [{ id: 'p1', name: 'x', category: 'c', product_type: 'physical' }], error: null };
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET' }, res);
    expect(res.headers['cache-control']).toMatch(/s-maxage=3600/);
  });
});
