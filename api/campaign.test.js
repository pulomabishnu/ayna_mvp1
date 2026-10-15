/* global process */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockReq, mockRes, mockSupabase } from './_test-helpers.js';

vi.mock('./_usageLimit.js', () => ({ verifyUser: vi.fn() }));
vi.mock('./_rateLimit.js', () => ({ rateLimit: vi.fn(async () => ({ ok: true })), getClientIp: () => 'test' }));

const { verifyUser } = await import('./_usageLimit.js');
const { rateLimit } = await import('./_rateLimit.js');
const { default: handler } = await import('./campaign.js');

const USER = { id: '3f2a9c10-7b4e-4d1a-9c55-0e1f2a3b4c5d', email: 'me@example.com' };
const SPIN = '11111111-2222-4333-8444-555555555555';
const KEY = 'abcdef0123456789abcdef0123456789';
const GOOD = 'I like that every product shows why it matched me and what the evidence actually says, which makes it way easier to trust the picks.';
const OTHER = 'The quiz felt long on my phone and I was not sure which questions were optional, so I almost stopped halfway through the health part.';

const progress = (over = {}) => ({
  data: {
    campaign: { id: 'free-product-2026', live: true, launched: true, ended: false, feedbackRequired: 3, feedbackMinChars: 120, referralsRequired: 3 },
    verified: true, feedback: [], feedbackComplete: 0, referrals: [], referralsVerified: 0,
    requirementsMet: false, eligible: false, inventoryAvailable: true, spins: 0, lastSpin: null, claim: null,
    ...over,
  },
  error: null,
});

function setup(rpcResults = {}) {
  const admin = mockSupabase({ rpcResults: { campaign_progress: progress(), campaign_pool: { data: [], error: null }, ...rpcResults } });
  verifyUser.mockResolvedValue({ user: USER, error: null, admin });
  return admin;
}

beforeEach(() => {
  vi.clearAllMocks();
  rateLimit.mockResolvedValue({ ok: true });
  delete process.env.CAMPAIGN_EMAILS_ENABLED;
});

describe('api/campaign auth', () => {
  it('401 without a session', async () => {
    verifyUser.mockResolvedValue({ user: null, error: 'auth_required', admin: null });
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(401);
  });

  it('never caches', async () => {
    setup();
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    expect(res.headers['cache-control']).toMatch(/no-store/);
  });

  it('always uses the session user, ignoring any user id in the request', async () => {
    const admin = setup({ campaign_spin: { data: { ok: true, spinId: SPIN, spinNumber: 1, product: {} }, error: null } });
    const res = mockRes();
    await handler(mockReq({ body: { action: 'spin', userId: 'someone-else', p_user: 'x' } }), res);
    expect(res.statusCode).toBe(200);
    expect(admin.rpcCalls.find((c) => c.name === 'campaign_spin').args).toEqual({ p_campaign: 'free-product-2026', p_user: USER.id });
  });
});

describe('GET status', () => {
  it('returns progress plus the invite code, and no pool until requirements are met', async () => {
    const admin = setup();
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.referralCode).toBe('3f2a9c107b');
    expect(res.body.pool).toEqual([]);
    expect(admin.rpcCalls.map((c) => c.name)).not.toContain('campaign_pool');
  });

  it('includes the pool once requirements are met', async () => {
    setup({ campaign_progress: progress({ requirementsMet: true, eligible: true }), campaign_pool: { data: [{ productId: 'p-1' }], error: null } });
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    expect(res.body.pool).toHaveLength(1);
  });

  it('500 without leaking database errors', async () => {
    setup({ campaign_progress: { data: null, error: { message: 'relation does not exist' } } });
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/relation/);
  });
});

describe('feedback', () => {
  it('rejects a short answer without storing it', async () => {
    const admin = setup();
    const res = mockRes();
    await handler(mockReq({ body: { action: 'feedback', key: 'like', response: 'love it' } }), res);
    expect(res.statusCode).toBe(422);
    expect(res.body.reason).toBe('too_short');
    expect(admin.rpcCalls.map((c) => c.name)).not.toContain('campaign_save_feedback');
  });

  it('rejects an unknown question', async () => {
    setup();
    const res = mockRes();
    await handler(mockReq({ body: { action: 'feedback', key: 'other', response: GOOD } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('blocks a copy of an answer already saved in the database', async () => {
    const admin = setup({ campaign_progress: progress({ feedback: [{ key: 'like', response: GOOD, complete: true }] }) });
    const res = mockRes();
    await handler(mockReq({ body: { action: 'feedback', key: 'change', response: GOOD } }), res);
    expect(res.statusCode).toBe(422);
    expect(res.body.reason).toBe('duplicate');
    expect(admin.rpcCalls.map((c) => c.name)).not.toContain('campaign_save_feedback');
  });

  it('stores a valid answer with the canonical question text', async () => {
    const admin = setup({ campaign_save_feedback: { data: { ok: true }, error: null } });
    const res = mockRes();
    await handler(mockReq({ body: { action: 'feedback', key: 'friction', response: `  ${OTHER}  `, question: 'injected' } }), res);
    expect(res.statusCode).toBe(200);
    const call = admin.rpcCalls.find((c) => c.name === 'campaign_save_feedback').args;
    expect(call.p_question).toBe("What's one thing that felt confusing, annoying, or harder than it should be?");
    expect(call.p_response).toBe(OTHER);
    expect(call.p_complete).toBe(true);
  });
});

describe('spin', () => {
  it('409 when nothing is left, so the page never shows an empty wheel', async () => {
    setup({ campaign_spin: { data: { ok: false, error: 'no_inventory' }, error: null } });
    const res = mockRes();
    await handler(mockReq({ body: { action: 'spin' } }), res);
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('no_inventory');
  });

  it('403 when not eligible (e.g. someone opening the reward URL early)', async () => {
    setup({ campaign_spin: { data: { ok: false, error: 'not_eligible' }, error: null } });
    const res = mockRes();
    await handler(mockReq({ body: { action: 'spin' } }), res);
    expect(res.statusCode).toBe(403);
  });

  it('429 when spinning too fast', async () => {
    setup();
    rateLimit.mockResolvedValueOnce({ ok: false, retryAfterSec: 30 });
    const res = mockRes();
    await handler(mockReq({ body: { action: 'spin' } }), res);
    expect(res.statusCode).toBe(429);
  });
});

describe('claim', () => {
  it('400 on a malformed spin id or key', async () => {
    const admin = setup();
    for (const body of [{ spinId: 'nope', idempotencyKey: KEY }, { spinId: SPIN, idempotencyKey: 'short' }]) {
      const res = mockRes();
      await handler(mockReq({ body: { action: 'claim', ...body } }), res);
      expect(res.statusCode).toBe(400);
    }
    expect(admin.rpcCalls.map((c) => c.name)).not.toContain('campaign_claim');
  });

  it('namespaces the idempotency key to the caller', async () => {
    const admin = setup({
      campaign_claim: { data: { ok: true, replayed: false, claim: { id: 'c1', product: { name: 'X' } } }, error: null },
      campaign_mark_notified: { data: true, error: null },
    });
    const res = mockRes();
    await handler(mockReq({ body: { action: 'claim', spinId: SPIN, idempotencyKey: KEY } }), res);
    expect(res.statusCode).toBe(200);
    expect(admin.rpcCalls.find((c) => c.name === 'campaign_claim').args.p_idempotency_key).toBe(`3f2a9c10:${KEY}`);
  });

  it('409 out_of_stock passes the reason through for the friendly message', async () => {
    setup({ campaign_claim: { data: { ok: false, error: 'out_of_stock' }, error: null } });
    const res = mockRes();
    await handler(mockReq({ body: { action: 'claim', spinId: SPIN, idempotencyKey: KEY } }), res);
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('out_of_stock');
  });

  it('a replayed claim succeeds and does not email again', async () => {
    const admin = setup({ campaign_claim: { data: { ok: true, replayed: true, claim: { id: 'c1' } }, error: null } });
    const res = mockRes();
    await handler(mockReq({ body: { action: 'claim', spinId: SPIN, idempotencyKey: KEY } }), res);
    expect(res.statusCode).toBe(200);
    expect(admin.rpcCalls.map((c) => c.name)).not.toContain('campaign_mark_notified');
  });

  it('with emails switched off (the default), nothing is sent and the notification mark is undone', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const admin = setup({
      campaign_claim: { data: { ok: true, replayed: false, claim: { id: 'c1', product: { name: 'X' } } }, error: null },
      campaign_mark_notified: { data: true, error: null },
      campaign_unmark_notified: { data: null, error: null },
    });
    const res = mockRes();
    await handler(mockReq({ body: { action: 'claim', spinId: SPIN, idempotencyKey: KEY } }), res);
    expect(res.statusCode).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(admin.rpcCalls.map((c) => c.name)).toContain('campaign_unmark_notified');
    fetchSpy.mockRestore();
  });
});

describe('shipping', () => {
  it('422 with field errors for a bad address', async () => {
    const admin = setup();
    const res = mockRes();
    await handler(mockReq({ body: { action: 'shipping', address: { fullName: 'A' } } }), res);
    expect(res.statusCode).toBe(422);
    expect(res.body.errors).toHaveProperty('postalCode');
    expect(admin.rpcCalls.map((c) => c.name)).not.toContain('campaign_save_shipping');
  });

  it('saves a cleaned address', async () => {
    const admin = setup({ campaign_save_shipping: { data: { ok: true, claim: {} }, error: null } });
    const res = mockRes();
    await handler(mockReq({ body: { action: 'shipping', address: { fullName: ' Test  Person ', addressLine1: '1 Main St', city: 'New York', state: 'ny', postalCode: '10001', email: 't@example.com' } } }), res);
    expect(res.statusCode).toBe(200);
    expect(admin.rpcCalls.find((c) => c.name === 'campaign_save_shipping').args.p_address).toMatchObject({ fullName: 'Test Person', state: 'NY' });
  });
});
