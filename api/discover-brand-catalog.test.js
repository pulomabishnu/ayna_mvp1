/**
 * Tests for the admin-triggered Shopify-feed brand catalog import
 * (api/discover-brand-catalog.js). Same safety guarantee as
 * api/discover-products.js's own tests exist to catch a regression in:
 * nothing reaches a real user without either a human approving it, or the
 * candidate clearing the narrow auto-approval bar (clean recall + a URL
 * verifyUrlIsLive actually confirms, on a confidently-classified category).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockRes, mockReq, withEnv } from './_test-helpers.js';
import {
  classifyShopifyProduct,
  shouldExcludeShopifyProduct,
  normalizeDomain,
  fetchShopifyProducts,
  shopifyProductToCandidate,
} from './discover-brand-catalog.js';

const realFetch = globalThis.fetch;
let restoreEnv;

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => globalThis.__mockAdmin,
}));

async function loadHandler() {
  vi.resetModules();
  return (await import('./discover-brand-catalog.js')).default;
}

function makeMockAdmin({ existingRows = [] } = {}) {
  const inserted = [];
  return {
    inserted,
    from(table) {
      if (table !== 'product_catalog') throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({
          then(resolve, reject) {
            return Promise.resolve({ data: existingRows, error: null }).then(resolve, reject);
          },
        }),
        insert(payload) {
          inserted.push(...payload);
          return Promise.resolve({ data: null, error: null });
        },
      };
    },
  };
}

function fdaNoRecall() {
  return { ok: false, status: 404, json: async () => ({ error: { code: 'NOT_FOUND' } }) };
}
function liveUrl(finalUrl) {
  return { ok: true, status: 200, url: finalUrl, json: async () => ({}) };
}

const SHOPIFY_FIXTURE = {
  products: [
    {
      title: 'Daily Wellness Probiotic',
      body_html: '<p>A daily probiotic supplement supporting digestive and immune health.</p>',
      product_type: 'Supplement',
      tags: ['probiotic', 'daily'],
      handle: 'daily-wellness-probiotic',
      variants: [{ price: '28.00' }],
      images: [{ src: 'https://cdn.shopify.com/example/probiotic.png' }],
    },
    {
      title: 'Starter Bundle',
      body_html: '<p>Everything in one box.</p>',
      product_type: 'Bundle',
      tags: [],
      handle: 'starter-bundle',
      variants: [{ price: '89.00' }],
      images: [],
    },
    {
      title: 'UTI Antibiotics Online Prescription',
      body_html: '<p>Prescription antibiotics for UTI.</p>',
      product_type: 'Prescription',
      tags: [],
      handle: 'uti-antibiotics',
      variants: [{ price: '49.00' }],
      images: [],
    },
    {
      title: 'Brand Crewneck Sweatshirt',
      body_html: '<p>Cozy merch.</p>',
      product_type: 'Apparel',
      tags: ['merch'],
      handle: 'brand-crewneck',
      variants: [{ price: '48.00' }],
      images: [],
    },
    {
      title: 'UTI Test + Treat',
      body_html: '<p>An at-home UTI test with telehealth treatment access.</p>',
      product_type: 'UTI tests',
      tags: [],
      handle: 'uti-tests',
      variants: [{ price: '15.00' }],
      images: [{ src: 'https://cdn.shopify.com/example/uti-test.png' }],
    },
  ],
};

function shopifyOk(data) {
  return { ok: true, status: 200, json: async () => data };
}

beforeEach(() => {
  restoreEnv = withEnv({
    CRON_SECRET: 'test-cron-secret',
    SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  });
});

afterEach(() => {
  restoreEnv();
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

function req(overrides = {}) {
  return mockReq({
    method: 'POST',
    body: { brand: 'TestBrand', domain: 'testbrand.com' },
    headers: { authorization: 'Bearer test-cron-secret' },
    ...overrides,
  });
}

// ─── Pure function unit tests ──────────────────────────────────────────────

describe('normalizeDomain', () => {
  it('strips protocol, www, and trailing slash to a bare hostname', () => {
    expect(normalizeDomain('https://www.oboo.love/')).toBe('oboo.love');
    expect(normalizeDomain('oboo.love')).toBe('oboo.love');
    expect(normalizeDomain('http://oboo.love')).toBe('oboo.love');
  });

  it('returns null for empty or unparseable input', () => {
    expect(normalizeDomain('')).toBeNull();
    expect(normalizeDomain('   ')).toBeNull();
  });
});

describe('classifyShopifyProduct', () => {
  it('classifies a test/diagnostic product as diagnostics even when it also mentions a body-part keyword', () => {
    const result = classifyShopifyProduct({ title: 'UTI Test + Treat', bodyText: 'at-home UTI test', productType: 'UTI tests' });
    expect(result.category).toBe('diagnostics');
    expect(result.confident).toBe(true);
  });

  it('classifies a vaginal-health-named product as intimate-care, not generic supplement (body-part rule outranks supplement rule)', () => {
    const result = classifyShopifyProduct({ title: 'Vaginal Health Probiotic', bodyText: 'daily supplement for vaginal health', productType: 'Supplement' });
    expect(result.category).toBe('intimate-care');
    expect(result.healthFunctions).toContain('vaginal-health');
  });

  it('falls back to category "other" with confident=false when nothing matches', () => {
    const result = classifyShopifyProduct({ title: 'Mystery Item 3000', bodyText: '', productType: '' });
    expect(result.category).toBe('other');
    expect(result.confident).toBe(false);
  });

  it('never returns a health function outside the real HEALTH_FUNCTIONS vocabulary', () => {
    const result = classifyShopifyProduct({ title: 'period underwear', bodyText: '', productType: '' });
    expect(result.healthFunctions.every((h) => typeof h === 'string' && h.length > 0)).toBe(true);
  });
});

describe('shouldExcludeShopifyProduct', () => {
  it('excludes anything matching the prescription pattern', () => {
    expect(shouldExcludeShopifyProduct({ title: 'BV Antibiotics Online Prescription', bodyText: '', productType: '' })).toBe('prescription');
    expect(shouldExcludeShopifyProduct({ title: 'Restart Morning-After Pill', bodyText: '', productType: '' })).toBe('prescription');
  });

  it('excludes a Shopify product_type explicitly tagged Bundle', () => {
    expect(shouldExcludeShopifyProduct({ title: 'Starter Set', bodyText: '', productType: 'Bundle' })).toBe('bundle');
  });

  it('excludes an obvious value pack or donation by title even without a Bundle product_type', () => {
    expect(shouldExcludeShopifyProduct({ title: 'Pregnancy Test Value Pack', bodyText: '', productType: '' })).toBe('bundle');
    expect(shouldExcludeShopifyProduct({ title: 'Charity Donation Pack', bodyText: '', productType: '' })).toBe('bundle');
  });

  it('excludes merch/apparel', () => {
    expect(shouldExcludeShopifyProduct({ title: 'Vote with ur v@g crewneck', bodyText: '', productType: '' })).toBe('merch');
  });

  it('does NOT exclude a real single-purpose product that merely contains a soft bundle word like "kit"', () => {
    // Soft words (kit/combo/duo/set) only downgrade confidence, checked via
    // shopifyProductToCandidate's categoryConfident — they don't hard-exclude,
    // since some brands use them for genuinely single SKUs.
    expect(shouldExcludeShopifyProduct({ title: 'Moon Anal Training Kit', bodyText: '', productType: 'Tool' })).toBeNull();
  });

  it('allows a normal real product through', () => {
    expect(shouldExcludeShopifyProduct({ title: 'Daily Wellness Probiotic', bodyText: 'a daily supplement', productType: 'Supplement' })).toBeNull();
  });
});

describe('shopifyProductToCandidate', () => {
  it('builds a real candidate with the exact product-page URL and real image', () => {
    const result = shopifyProductToCandidate(SHOPIFY_FIXTURE.products[0], { domain: 'testbrand.com', brand: 'TestBrand' });
    expect(result.excluded).toBeNull();
    expect(result.candidate.url).toBe('https://testbrand.com/products/daily-wellness-probiotic');
    expect(result.candidate.image).toBe('https://cdn.shopify.com/example/probiotic.png');
    expect(result.candidate.price).toBe('$28');
    expect(result.category).toBe('supplement');
    expect(result.categoryConfident).toBe(true);
  });

  it('returns excluded for a bundle product instead of a candidate', () => {
    const result = shopifyProductToCandidate(SHOPIFY_FIXTURE.products[1], { domain: 'testbrand.com', brand: 'TestBrand' });
    expect(result.excluded).toBe('bundle');
    expect(result.candidate).toBeUndefined();
  });
});

// ─── fetchShopifyProducts: Shopify shape detection ─────────────────────────

describe('fetchShopifyProducts', () => {
  it('returns the product array for a real Shopify feed', async () => {
    globalThis.fetch = vi.fn(async () => shopifyOk(SHOPIFY_FIXTURE));
    const products = await fetchShopifyProducts('testbrand.com');
    expect(products).toHaveLength(5);
  });

  it('returns null for a non-Shopify site that 200s with an unrelated JSON shape', async () => {
    globalThis.fetch = vi.fn(async () => shopifyOk({ notProducts: true }));
    expect(await fetchShopifyProducts('notashop.com')).toBeNull();
  });

  it('returns null for a non-Shopify site that 200s with HTML (json() throws)', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => { throw new Error('not json'); } }));
    expect(await fetchShopifyProducts('notashop.com')).toBeNull();
  });

  it('returns null on a 404', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }));
    expect(await fetchShopifyProducts('doesnotexist.com')).toBeNull();
  });

  it('returns an empty array for a real Shopify store with zero products (not treated as non-Shopify)', async () => {
    globalThis.fetch = vi.fn(async () => shopifyOk({ products: [] }));
    expect(await fetchShopifyProducts('emptyshop.com')).toEqual([]);
  });
});

// ─── Full handler: access control ──────────────────────────────────────────

describe('POST /api/discover-brand-catalog — access control', () => {
  it('401s when CRON_SECRET is not configured, before touching Supabase or fetch', async () => {
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

  it('401s on a wrong bearer token', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    const res = mockRes();
    await (await loadHandler())(req({ headers: { authorization: 'Bearer wrong' } }), res);
    expect(res.statusCode).toBe(401);
  });

  it('405s on GET', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    const res = mockRes();
    await (await loadHandler())(req({ method: 'GET' }), res);
    expect(res.statusCode).toBe(405);
  });

  it('400s when domain is missing/unparseable', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    const res = mockRes();
    await (await loadHandler())(req({ body: { brand: 'TestBrand', domain: '' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('invalid_domain');
  });

  it('400s when brand is missing', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    const res = mockRes();
    await (await loadHandler())(req({ body: { domain: 'testbrand.com' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('missing_brand');
  });
});

// ─── Full handler: happy path ───────────────────────────────────────────────

describe('POST /api/discover-brand-catalog — happy path', () => {
  it('reports isShopify=false and imports nothing for a non-Shopify domain', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }));
    const res = mockRes();
    await (await loadHandler())(req(), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.isShopify).toBe(false);
    expect(globalThis.__mockAdmin.inserted).toHaveLength(0);
  });

  it('filters bundles/prescriptions/merch, imports the rest, and auto-approves a clean confidently-classified one', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('/products.json')) return shopifyOk(SHOPIFY_FIXTURE);
      if (u.includes('api.fda.gov')) return fdaNoRecall();
      if (u.includes('/products/daily-wellness-probiotic') || u.includes('/products/uti-tests')) {
        return liveUrl(u);
      }
      throw new Error(`unexpected fetch to ${u}`);
    });

    const res = mockRes();
    await (await loadHandler())(req(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.isShopify).toBe(true);
    expect(res.body.found).toBe(5);
    expect(res.body.excluded).toEqual({ bundle: 1, prescription: 1, merch: 1 });
    expect(res.body.inserted).toBe(2); // probiotic + UTI test survive filtering
    expect(res.body.autoApproved).toBe(2); // both: clean recall + live URL + confidently classified

    const inserted = globalThis.__mockAdmin.inserted;
    const probiotic = inserted.find((r) => r.name === 'Daily Wellness Probiotic');
    expect(probiotic.url).toBe('https://testbrand.com/products/daily-wellness-probiotic');
    expect(probiotic.image).toBe('https://cdn.shopify.com/example/probiotic.png');
    expect(probiotic.is_active).toBe(true);
    expect(probiotic.review_status).toBe('approved');
    expect(probiotic.source).toBe('discovered');
    expect(probiotic.clinician_opinion_source).toBe('brand');
  });

  it('leaves a candidate pending when its URL does not actually resolve, even with a clean recall check', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('/products.json')) return shopifyOk({ products: [SHOPIFY_FIXTURE.products[0]] });
      if (u.includes('api.fda.gov')) return fdaNoRecall();
      if (u.includes('/products/daily-wellness-probiotic')) return { ok: false, status: 404, url: '', json: async () => ({}) };
      throw new Error(`unexpected fetch to ${u}`);
    });

    const res = mockRes();
    await (await loadHandler())(req(), res);

    expect(res.body.inserted).toBe(1);
    expect(res.body.autoApproved).toBe(0);
    const row = globalThis.__mockAdmin.inserted[0];
    expect(row.review_status).toBe('pending');
    expect(row.is_active).toBe(false);
  });

  it('never auto-approves a product the classifier could not confidently categorize, even with a clean recall and a live URL', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    const mysteryProduct = {
      title: 'Mystery Item 3000',
      body_html: '<p>Does something.</p>',
      product_type: '',
      tags: [],
      handle: 'mystery-item-3000',
      variants: [{ price: '19.00' }],
      images: [],
    };
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('/products.json')) return shopifyOk({ products: [mysteryProduct] });
      if (u.includes('api.fda.gov')) return fdaNoRecall();
      if (u.includes('/products/mystery-item-3000')) return liveUrl(u);
      throw new Error(`unexpected fetch to ${u}`);
    });

    const res = mockRes();
    await (await loadHandler())(req(), res);

    expect(res.body.inserted).toBe(1);
    expect(res.body.autoApproved).toBe(0);
    const row = globalThis.__mockAdmin.inserted[0];
    expect(row.review_status).toBe('pending');
    expect(row.discovery_meta.categoryConfident).toBe(false);
  });

  it('skips (does not re-insert or touch) a product whose id already exists in the catalog', async () => {
    globalThis.__mockAdmin = makeMockAdmin({
      existingRows: [{ id: 'disc-testbrand-daily-wellness-probiotic', review_status: 'approved' }],
    });
    globalThis.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('/products.json')) return shopifyOk({ products: [SHOPIFY_FIXTURE.products[0]] });
      throw new Error(`unexpected fetch to ${u}`); // no FDA/liveness call should happen for an already-existing id
    });

    const res = mockRes();
    await (await loadHandler())(req(), res);

    expect(res.body.duplicates).toBe(1);
    expect(res.body.inserted).toBe(0);
    expect(globalThis.__mockAdmin.inserted).toHaveLength(0);
  });

  it('reports zero found for a real Shopify store with no products, without erroring', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    globalThis.fetch = vi.fn(async () => shopifyOk({ products: [] }));
    const res = mockRes();
    await (await loadHandler())(req(), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.isShopify).toBe(true);
    expect(res.body.found).toBe(0);
  });
});
