/**
 * Tests for the background product-discovery pipeline (cron-triggered,
 * api/discover-products.js). The whole point of this endpoint is that
 * nothing it finds reaches a real user without a human approving it first —
 * these tests exist to catch a regression in that specific guarantee, not
 * just "does it run".
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockRes, mockReq, withEnv, anthropicOk } from './_test-helpers.js';
import { slugify, normalizeKey, buildExclusionSet, toRow, dayOfYear, pickCategory, CATEGORIES } from './discover-products.js';

const realFetch = globalThis.fetch;
let restoreEnv;

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => globalThis.__mockAdmin,
}));

async function loadHandler() {
  vi.resetModules();
  return (await import('./discover-products.js')).default;
}

/** Purpose-built mock: product_catalog gets queried three different ways
 * (by category for exclusion, by id for the already-reviewed check, then
 * inserted/updated) — a single canned response per table isn't enough. */
function makeMockAdmin({ existingByCategory = [], alreadyReviewed = [] } = {}) {
  const inserted = [];
  const updated = [];

  function selectBuilder(filters) {
    return {
      eq(col, val) { return selectBuilder({ ...filters, [col]: val }); },
      in(col, vals) { return selectBuilder({ ...filters, [`${col}__in`]: vals }); },
      then(resolve, reject) {
        if (filters.category !== undefined) {
          return Promise.resolve({ data: existingByCategory, error: null }).then(resolve, reject);
        }
        if (filters['id__in'] !== undefined) {
          const rows = alreadyReviewed.filter((r) => filters['id__in'].includes(r.id));
          return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
        }
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      },
    };
  }

  return {
    inserted, updated,
    from(table) {
      if (table !== 'product_catalog') throw new Error(`unexpected table ${table}`);
      return {
        select: () => selectBuilder({}),
        insert(payload) {
          inserted.push(...payload);
          return Promise.resolve({ data: null, error: null });
        },
        update(payload) {
          return {
            eq(col, val) {
              updated.push({ payload, col, val });
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
      };
    },
  };
}

function fdaNoRecall() {
  return { ok: false, status: 404, json: async () => ({ error: { code: 'NOT_FOUND' } }) };
}
function fdaActiveRecall() {
  return {
    ok: true, status: 200,
    json: async () => ({
      results: [{
        recall_number: 'R-999', status: 'Ongoing', event_date_initiated: '20260101',
        reason_for_recall: 'Contamination', product_description: 'Discovered Test Product',
      }],
    }),
  };
}

const validLlmResponse = JSON.stringify({
  products: [
    { name: 'Test Pad Pro', brand: 'TestBrand', category: 'pad', type: 'physical', summary: 'A test pad.', price: '$10', url: 'https://testbrand.com/pad', isSupplement: false },
  ],
});

beforeEach(() => {
  restoreEnv = withEnv({
    CRON_SECRET: 'test-cron-secret',
    SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    ANTHROPIC_API_KEY: 'ak-test',
    OPENAI_API_KEY: undefined,
    SERPER_API_KEY: undefined, // exercise the "no search key" path by default
  });
});

afterEach(() => {
  restoreEnv();
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

function req(overrides = {}) {
  return mockReq({ method: 'GET', query: {}, headers: { authorization: 'Bearer test-cron-secret' }, ...overrides });
}

describe('GET /api/discover-products — access control', () => {
  it('401s when CRON_SECRET is not configured, before touching Supabase or the LLM', async () => {
    restoreEnv();
    restoreEnv = withEnv({ CRON_SECRET: undefined });
    globalThis.__mockAdmin = makeMockAdmin();
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;
    const res = mockRes();
    await (await loadHandler())(req({ headers: {} }), res);
    expect(res.statusCode).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('401s when the Authorization header does not match CRON_SECRET', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    const res = mockRes();
    await (await loadHandler())(req({ headers: { authorization: 'Bearer wrong-secret' } }), res);
    expect(res.statusCode).toBe(401);
  });

  it('rejects non-GET/POST methods', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    const res = mockRes();
    await (await loadHandler())(req({ method: 'DELETE' }), res);
    expect(res.statusCode).toBe(405);
  });
});

describe('GET /api/discover-products — happy path', () => {
  it('inserts a discovered candidate as pending and inactive, never live', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('anthropic')) return anthropicOk(validLlmResponse);
      if (u.includes('api.fda.gov')) return fdaNoRecall();
      throw new Error(`unexpected fetch to ${u}`);
    });

    const res = mockRes();
    await (await loadHandler())(req({ query: { category: 'pad' } }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.inserted).toBe(1);
    expect(globalThis.__mockAdmin.inserted).toHaveLength(1);

    const row = globalThis.__mockAdmin.inserted[0];
    expect(row.source).toBe('discovered');
    expect(row.review_status).toBe('pending');
    expect(row.is_active).toBe(false); // the one thing this endpoint must never get wrong
    expect(row.name).toBe('Test Pad Pro');
    expect(row.brand).toBe('TestBrand');
  });

  it('still inserts (pending, inactive) when a recall is found — flags it for the reviewer instead of silently dropping or auto-approving', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('anthropic')) return anthropicOk(validLlmResponse);
      if (u.includes('api.fda.gov')) return fdaActiveRecall();
      throw new Error(`unexpected fetch to ${u}`);
    });

    const res = mockRes();
    await (await loadHandler())(req({ query: { category: 'pad' } }), res);

    expect(res.body.inserted).toBe(1);
    const row = globalThis.__mockAdmin.inserted[0];
    expect(row.is_active).toBe(false);
    expect(row.review_status).toBe('pending');
    expect(row.safety.recalls).toMatch(/recall/i);
  });

  it('skips a candidate when the recall check itself fails — unknown safety status is not inserted', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('anthropic')) return anthropicOk(validLlmResponse);
      if (u.includes('api.fda.gov')) return { ok: false, status: 500, json: async () => ({}) };
      throw new Error(`unexpected fetch to ${u}`);
    });

    const res = mockRes();
    await (await loadHandler())(req({ query: { category: 'pad' } }), res);

    expect(globalThis.__mockAdmin.inserted).toHaveLength(0);
    expect(res.body.inserted).toBe(0);
  });

  it('does not duplicate or reset review_status for an id a human already reviewed', async () => {
    globalThis.__mockAdmin = makeMockAdmin({
      alreadyReviewed: [{ id: 'disc-testbrand-test-pad-pro', review_status: 'rejected' }],
    });
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('anthropic')) return anthropicOk(validLlmResponse);
      if (u.includes('api.fda.gov')) return fdaNoRecall();
      throw new Error(`unexpected fetch to ${u}`);
    });

    const res = mockRes();
    await (await loadHandler())(req({ query: { category: 'pad' } }), res);

    // Not re-inserted (would either duplicate or, worse, silently overwrite a
    // human's 'rejected' verdict back to 'pending').
    expect(globalThis.__mockAdmin.inserted).toHaveLength(0);
    expect(res.body.inserted).toBe(0);
    // Discovery metadata (search grounding, recheck timestamp) still refreshes.
    expect(globalThis.__mockAdmin.updated).toHaveLength(1);
    expect(globalThis.__mockAdmin.updated[0].payload).toHaveProperty('discovery_meta');
  });

  it('excludes a product already in the bundled catalog by name+brand', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    // LOLA Organic Cotton Pads is a real bundled product in category 'pad'.
    const dupeResponse = JSON.stringify({
      products: [
        { name: 'Organic Cotton Pads', brand: 'LOLA', category: 'pad', type: 'physical', summary: 'x', price: '$9', url: 'https://mylola.com', isSupplement: false },
        { name: 'Test Pad Pro', brand: 'TestBrand', category: 'pad', type: 'physical', summary: 'x', price: '$9', url: 'https://testbrand.com', isSupplement: false },
      ],
    });
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('anthropic')) return anthropicOk(dupeResponse);
      if (u.includes('api.fda.gov')) return fdaNoRecall();
      throw new Error(`unexpected fetch to ${u}`);
    });

    const res = mockRes();
    await (await loadHandler())(req({ query: { category: 'pad' } }), res);

    expect(res.body.afterDedup).toBe(1);
    expect(globalThis.__mockAdmin.inserted).toHaveLength(1);
    expect(globalThis.__mockAdmin.inserted[0].name).toBe('Test Pad Pro');
  });

  it('503s without an LLM provider key configured, before hitting Supabase', async () => {
    restoreEnv();
    restoreEnv = withEnv({ CRON_SECRET: 'test-cron-secret', SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k', ANTHROPIC_API_KEY: undefined, OPENAI_API_KEY: undefined });
    globalThis.__mockAdmin = makeMockAdmin();
    const res = mockRes();
    await (await loadHandler())(req(), res);
    expect(res.statusCode).toBe(503);
  });
});

describe('pure helpers', () => {
  it('slugify normalizes for id/dedup use', () => {
    expect(slugify('Neycher Odor Be Gone')).toBe('neycher-odor-be-gone');
    expect(slugify('  Multi   Space ')).toBe('multi-space');
    expect(slugify(null)).toBe('');
  });

  it('normalizeKey is case/whitespace insensitive so near-identical entries collide', () => {
    expect(normalizeKey('Odor Be Gone', 'Neycher')).toBe(normalizeKey('odor be gone', 'neycher'));
  });

  it('buildExclusionSet pulls names/keys only from the requested category', () => {
    const { keys } = buildExclusionSet('pad', [{ name: 'DB Pad', brand: 'DBBrand', category: 'pad' }, { name: 'Wrong Cat', brand: 'X', category: 'tampon' }]);
    expect(keys.has(normalizeKey('DB Pad', 'DBBrand'))).toBe(true);
    expect(keys.has(normalizeKey('Wrong Cat', 'X'))).toBe(false);
  });

  it('toRow always forces is_active=false and review_status=pending regardless of input', () => {
    const row = toRow(
      { name: 'X', brand: 'Y', category: 'pad', type: 'physical', summary: 's', price: '$1', url: 'https://y.com', safety: { recalls: 'No recalls found.' }, is_active: true, review_status: 'approved' },
      { category: 'pad', searchHits: [], provider: 'anthropic' }
    );
    expect(row.is_active).toBe(false);
    expect(row.review_status).toBe('pending');
    expect(row.source).toBe('discovered');
    expect(row.id).toBe('disc-y-x');
  });

  it('toRow drops a non-https url rather than trusting it', () => {
    const row = toRow({ name: 'X', brand: 'Y', category: 'pad', url: 'javascript:alert(1)' }, { category: 'pad', searchHits: [], provider: 'anthropic' });
    expect(row.url).toBeNull();
  });

  it('pickCategory honours an explicit ?category= override', () => {
    const c = pickCategory({ query: { category: 'supplement' } });
    expect(c.category).toBe('supplement');
  });

  it('pickCategory falls back to a deterministic day-of-year rotation for an unknown category', () => {
    const a = pickCategory({ query: { category: 'not-a-real-category' } });
    expect(CATEGORIES.map((c) => c.category)).toContain(a.category);
  });

  it('dayOfYear is deterministic for a given date', () => {
    expect(dayOfYear(new Date(Date.UTC(2026, 0, 1)))).toBe(1);
    expect(dayOfYear(new Date(Date.UTC(2026, 0, 31)))).toBe(31);
  });
});
