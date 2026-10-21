/**
 * Every route that spends money (model calls, a shared API key) refuses work
 * once its rate limit says no, BEFORE any provider is called. Premium
 * accounts included: the weekly quota skips them, the burst cap does not.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockReq, mockRes, mockSupabase, withEnv } from './_test-helpers.js';

const limiter = vi.fn(async () => ({ ok: false, retryAfterSec: 60 }));
vi.mock('./_rateLimit.js', () => ({ rateLimit: (...a) => limiter(...a), getClientIp: () => '9.9.9.9', isDurableStoreConfigured: () => false }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => globalThis.__mockSupabase }));

const realFetch = globalThis.fetch;
let restoreEnv;
beforeEach(() => {
  restoreEnv = withEnv({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k', ANTHROPIC_API_KEY: 'test' });
  globalThis.fetch = vi.fn(async () => { throw new Error('provider must not be called'); });
  limiter.mockClear();
});
afterEach(() => { restoreEnv(); globalThis.fetch = realFetch; });

const premium = { id: 'p1', email: 'p@x.com', app_metadata: { is_premium: true }, user_metadata: {} };

describe.each([
  ['ask-ayna', () => import('./ask-ayna.js'), { message: 'hi' }],
  ['product-chat', () => import('./product-chat.js'), { question: 'is it safe?', product: { id: 'x', name: 'X' } }],
  ['llm-recommendations', () => import('./llm-recommendations.js'), { concerns: ['pcos'], buildId: 'b1' }],
])('%s burst limit', (_name, load, body) => {
  it('429s a premium user once the burst cap is hit, without calling a model', async () => {
    globalThis.__mockSupabase = mockSupabase({ user: premium });
    const { default: handler } = await load();
    const res = mockRes();
    await handler(mockReq({ body }), res);
    expect(res.statusCode).toBe(429);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(limiter.mock.calls[0][0]).toContain('p1');
  });
});

describe.each([
  ['pubmed-search', () => import('./pubmed-search.js')],
  ['dsld-search', () => import('./dsld-search.js')],
])('%s', (_name, load) => {
  it('429s when the per-IP limit is hit', async () => {
    const { default: handler } = await load();
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'magnesium' }, headers: {} }, res);
    expect(res.statusCode).toBe(429);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it('rejects an oversized query', async () => {
    const { default: handler } = await load();
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'x'.repeat(400) }, headers: {} }, res);
    expect(res.statusCode).toBe(400);
  });
});

describe('news-summary', () => {
  it('falls back to the no-model summary when limited', async () => {
    const { summarize } = await import('./news-summary.js');
    const call = vi.fn();
    const out = await summarize({ id: 'n1', title: 't', body: 'We added ten new brands this week. More soon.' }, { call, allowModel: false });
    expect(call).not.toHaveBeenCalled();
    expect(out.ai).toBe(false);
    expect(out.summary).toContain('ten new brands');
  });
});
