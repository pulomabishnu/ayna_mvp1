/**
 * Tests for the background product-discovery pipeline (cron-triggered,
 * api/discover-products.js). The whole point of this endpoint is that
 * nothing it finds reaches a real user without EITHER a human approving it
 * first OR the candidate clearing the narrow isAutoApprovable() gate (clean,
 * fully-answered recall check + real https source URL) — these tests exist
 * to catch a regression in that specific guarantee, not just "does it run".
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockRes, mockReq, withEnv, anthropicOk } from './_test-helpers.js';
import { slugify, normalizeKey, buildExclusionSet, toRow, isAutoApprovable, dayOfYear, pickCategory, slotOfDay, RUN_HOURS_UTC, CATEGORIES } from './discover-products.js';

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
      // product_description deliberately contains the candidate's own
      // name/brand ("Test Pad Pro" / "TestBrand") — recallRecordMatchesProduct
      // (api/fda-recall.js) discards any FDA record that doesn't textually
      // match the product, so a mock record with unrelated text would silently
      // never match and this fixture would test nothing.
      results: [{
        recall_number: 'R-999', status: 'Ongoing', event_date_initiated: '20260101',
        reason_for_recall: 'Contamination', product_description: 'TestBrand Test Pad Pro',
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
  it('auto-approves a candidate with both a clean recall check AND a real source URL', async () => {
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
    expect(res.body.autoApproved).toBe(1);
    expect(globalThis.__mockAdmin.inserted).toHaveLength(1);

    const row = globalThis.__mockAdmin.inserted[0];
    expect(row.source).toBe('discovered');
    expect(row.review_status).toBe('approved');
    expect(row.is_active).toBe(true);
    expect(row.discovery_meta.autoApproved).toBe(true);
    expect(row.name).toBe('Test Pad Pro');
    expect(row.brand).toBe('TestBrand');
  });

  it('leaves a candidate pending and inactive when the model gave no source URL, even with a clean recall check', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    const noUrlResponse = JSON.stringify({
      products: [{ name: 'Test Pad Pro', brand: 'TestBrand', category: 'pad', type: 'physical', summary: 'A test pad.', price: '$10', url: '', isSupplement: false }],
    });
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('anthropic')) return anthropicOk(noUrlResponse);
      if (u.includes('api.fda.gov')) return fdaNoRecall();
      throw new Error(`unexpected fetch to ${u}`);
    });

    const res = mockRes();
    await (await loadHandler())(req({ query: { category: 'pad' } }), res);

    expect(res.body.inserted).toBe(1);
    expect(res.body.autoApproved).toBe(0);
    const row = globalThis.__mockAdmin.inserted[0];
    expect(row.review_status).toBe('pending');
    expect(row.is_active).toBe(false); // the one thing this endpoint must never get wrong absent both signals
    expect(row.discovery_meta.autoApproved).toBeUndefined();
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

  describe('isAutoApprovable', () => {
    const base = { url: 'https://brand.com/product' };
    it('true only when the recall check fully answered "ok" AND found nothing, AND a url exists', () => {
      expect(isAutoApprovable({ ...base, discovery_meta: { recallCheck: { status: 'ok', hasRecalls: false } } })).toBe(true);
    });
    it('false when the recall check found an active recall, even if otherwise "ok"', () => {
      expect(isAutoApprovable({ ...base, discovery_meta: { recallCheck: { status: 'ok', hasRecalls: true } } })).toBe(false);
    });
    it('false when the recall check was only "partial" — a failed dataset could be hiding a real recall', () => {
      expect(isAutoApprovable({ ...base, discovery_meta: { recallCheck: { status: 'partial', hasRecalls: false } } })).toBe(false);
    });
    it('false when there is no url, even with a clean recall check', () => {
      expect(isAutoApprovable({ url: null, discovery_meta: { recallCheck: { status: 'ok', hasRecalls: false } } })).toBe(false);
    });
    it('false when there is no recallCheck at all', () => {
      expect(isAutoApprovable({ ...base, discovery_meta: {} })).toBe(false);
    });
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

  it('slotOfDay matches each scheduled cron hour to a distinct slot', () => {
    expect(RUN_HOURS_UTC.map((h) => slotOfDay(new Date(Date.UTC(2026, 0, 1, h))))).toEqual([0, 1, 2]);
  });

  it('slotOfDay falls back to a sane bucket for an off-schedule hour', () => {
    expect(slotOfDay(new Date(Date.UTC(2026, 0, 1, 3)))).toBeGreaterThanOrEqual(0);
    expect(slotOfDay(new Date(Date.UTC(2026, 0, 1, 3)))).toBeLessThan(RUN_HOURS_UTC.length);
  });

  it("pickCategory gives each of a day's 3 scheduled runs a different category", () => {
    const picks = RUN_HOURS_UTC.map((h) => pickCategory({ query: {} }, new Date(Date.UTC(2026, 5, 15, h))).category);
    expect(new Set(picks).size).toBe(RUN_HOURS_UTC.length);
  });

  it('pickCategory advances to new categories on the next day rather than repeating the same 3', () => {
    const day1 = RUN_HOURS_UTC.map((h) => pickCategory({ query: {} }, new Date(Date.UTC(2026, 5, 15, h))).category);
    const day2 = RUN_HOURS_UTC.map((h) => pickCategory({ query: {} }, new Date(Date.UTC(2026, 5, 16, h))).category);
    expect(day2).not.toEqual(day1);
  });

  it('a full 15-category rotation completes within 5 days at 3 runs/day', () => {
    const seen = new Set();
    for (let day = 0; day < 5; day++) {
      for (const h of RUN_HOURS_UTC) {
        seen.add(pickCategory({ query: {} }, new Date(Date.UTC(2026, 5, 15 + day, h))).category);
      }
    }
    expect(seen.size).toBe(CATEGORIES.length);
  });
});
