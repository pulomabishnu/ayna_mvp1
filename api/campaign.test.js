import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./_usageLimit.js', () => ({ verifyUser: vi.fn() }));
vi.mock('./_rateLimit.js', () => ({ rateLimit: vi.fn(async () => ({ ok: true })), getClientIp: () => 'test' }));
const sendEmail = vi.fn(async () => ({ ok: true }));
vi.mock('./_campaignEmail.js', async (orig) => ({ ...(await orig()), sendEmail: (...a) => sendEmail(...a) }));

import { verifyUser } from './_usageLimit.js';
import { rateLimit } from './_rateLimit.js';
import handler from './campaign.js';
import adminHandler from './campaign-admin.js';

const USER = { id: '11111111-1111-4111-8111-111111111111', email: 'her@example.com', is_anonymous: false };
const REWARD = '22222222-2222-4222-8222-222222222222';
const GOOD = 'The match scores helped me pick a pad for sensitive skin, and seeing why each one fit made me trust the recommendation more than reviews.';

function progress(over = {}) {
  return {
    campaign: { id: 'free-product-2026', open: true, feedback_min_chars: 120, referrals_required: 3, ends_at: null },
    verified: true, feedback_done: [], referrals_joined: 0, referrals_verified: 0,
    eligible: false, inventory_available: true, claim: null, ...over,
  };
}

/** Minimal fake of the service-role Supabase client. */
function fakeAdmin({ rpcs = {}, tables = {} } = {}) {
  const calls = { rpc: [], upserts: [], updates: [] };
  const admin = {
    calls,
    rpc: vi.fn(async (fn, args) => {
      calls.rpc.push([fn, args]);
      const v = typeof rpcs[fn] === 'function' ? rpcs[fn](args) : rpcs[fn];
      return v instanceof Error ? { data: null, error: v } : { data: v ?? null, error: null };
    }),
    from(table) {
      const state = { table, op: 'select' };
      const result = () => {
        const v = tables[`${table}.${state.op}`];
        return typeof v === 'function' ? v(state) : (v ?? { data: state.op === 'select' ? [] : null, error: null });
      };
      const b = {
        select() { return b; }, eq() { return b; }, neq() { return b; }, order() { return b; }, limit() { return b; },
        maybeSingle() { return Promise.resolve(result()); },
        upsert(row) { state.op = 'upsert'; calls.upserts.push([table, row]); return b; },
        update(row) { state.op = 'update'; calls.updates.push([table, row]); return b; },
        then(res, rej) { return Promise.resolve(result()).then(res, rej); },
      };
      return b;
    },
  };
  return admin;
}

const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.send = (b) => { r.body = b; return r; };
  return r;
};
const call = async (h, { method = 'POST', body, query = {}, headers = {} } = {}) => {
  const res = mockRes();
  await h({ method, body, query, headers: { authorization: 'Bearer t', ...headers } }, res);
  return res;
};

let admin;
beforeEach(() => {
  vi.clearAllMocks();
  admin = fakeAdmin({
    rpcs: { campaign_progress: progress(), campaign_referral_rows: [], ayna_get_referral_code: 'k7m2p9qa' },
  });
  verifyUser.mockResolvedValue({ user: USER, error: null, admin });
});

describe('auth', () => {
  it('401 without a session', async () => {
    verifyUser.mockResolvedValue({ user: null, error: 'auth_required', admin: null });
    expect((await call(handler, { method: 'GET' })).code).toBe(401);
  });
  it('rejects anonymous Community guest sessions', async () => {
    verifyUser.mockResolvedValue({ user: { ...USER, is_anonymous: true }, error: null, admin });
    expect((await call(handler, { method: 'GET' })).code).toBe(401);
    expect(admin.rpc).not.toHaveBeenCalled();
  });
  it('sets no-store', async () => {
    const r = await call(handler, { method: 'GET' });
    expect(r.headers['Cache-Control']).toMatch(/no-store/);
  });
});

describe('status', () => {
  it('masks friends and uses the opaque referral code', async () => {
    admin = fakeAdmin({ rpcs: {
      campaign_progress: progress({ referrals_joined: 2, referrals_verified: 1 }),
      campaign_referral_rows: [
        { referred_user_id: 'aaaaaaaa-0000-4000-8000-000000000001', joined_at: '2026-10-16T10:00:00Z', verified: true },
        { referred_user_id: 'aaaaaaaa-0000-4000-8000-000000000002', joined_at: '2026-10-17T10:00:00Z', verified: false },
      ],
      ayna_get_referral_code: 'k7m2p9qa',
    } });
    verifyUser.mockResolvedValue({ user: USER, error: null, admin });
    const r = await call(handler, { method: 'GET' });
    expect(r.code).toBe(200);
    expect(r.body.friends).toEqual([
      { label: 'Friend 1', status: 'verified', joinedAt: '2026-10-16' },
      { label: 'Friend 2', status: 'joined', joinedAt: '2026-10-17' },
    ]);
    expect(JSON.stringify(r.body)).not.toContain('aaaaaaaa-');
    expect(r.body.referralLink).toMatch(/\/join\?ref=k7m2p9qa$/);
    expect(r.body.referralLink).not.toContain(USER.id.slice(0, 8));
  });
  it('eligibility comes from the database, not the request', async () => {
    const r = await call(handler, { method: 'GET', query: { eligible: 'true' }, body: { eligible: true } });
    expect(r.body.eligible).toBe(false);
  });
});

describe('feedback', () => {
  const post = (body) => call(handler, { body: { action: 'feedback', ...body } });
  it('rejects short answers without writing', async () => {
    const r = await post({ questionKey: 'like', response: 'love it' });
    expect(r.code).toBe(422);
    expect(r.body.error).toBe('too_short');
    expect(admin.calls.upserts).toHaveLength(0);
  });
  it('rejects padded / repeated text', async () => {
    expect((await post({ questionKey: 'like', response: 'good '.repeat(40) })).body.error).toBe('low_effort');
    expect((await post({ questionKey: 'like', response: 'a'.repeat(200) })).body.error).toBe('low_effort');
    expect((await post({ questionKey: 'like', response: ' '.repeat(200) })).body.error).toBe('too_short');
  });
  it('rejects the same answer pasted into another question', async () => {
    admin = fakeAdmin({ rpcs: { campaign_progress: progress() }, tables: {
      'campaign_feedback.select': { data: [{ question_key: 'like', response: GOOD }], error: null },
    } });
    verifyUser.mockResolvedValue({ user: USER, error: null, admin });
    const r = await post({ questionKey: 'friction', response: `${GOOD} Honestly.` });
    expect(r.code).toBe(422);
    expect(r.body.error).toBe('duplicate');
  });
  it('rejects unknown questions', async () => {
    expect((await post({ questionKey: 'admin', response: GOOD })).code).toBe(400);
  });
  it('stores the server-side question text, not anything the client sends', async () => {
    const r = await post({ questionKey: 'like', response: GOOD, question: 'injected' });
    expect(r.code).toBe(200);
    const [, row] = admin.calls.upserts.find(([t]) => t === 'campaign_feedback');
    expect(row).toMatchObject({ question_key: 'like', user_id: USER.id, response: GOOD });
    expect(row.question).not.toBe('injected');
  });
  it('closed campaign / already claimed', async () => {
    admin.rpc.mockImplementationOnce(async () => ({ data: progress({ campaign: { ...progress().campaign, open: false } }), error: null }));
    expect((await post({ questionKey: 'like', response: GOOD })).body.error).toBe('campaign_closed');
    admin.rpc.mockImplementationOnce(async () => ({ data: progress({ claim: { id: 'x' } }), error: null }));
    expect((await post({ questionKey: 'like', response: GOOD })).body.error).toBe('already_claimed');
  });
  it('rate limited', async () => {
    rateLimit.mockResolvedValueOnce({ ok: false, retryAfterSec: 30 });
    expect((await post({ questionKey: 'like', response: GOOD })).code).toBe(429);
  });
});

describe('spin', () => {
  it('ineligible -> 403, empty pool -> 409', async () => {
    admin = fakeAdmin({ rpcs: { campaign_spin: { status: 'not_eligible' } } });
    verifyUser.mockResolvedValue({ user: USER, error: null, admin });
    expect((await call(handler, { body: { action: 'spin' } })).code).toBe(403);
    admin = fakeAdmin({ rpcs: { campaign_spin: { status: 'empty' } } });
    verifyUser.mockResolvedValue({ user: USER, error: null, admin });
    const r = await call(handler, { body: { action: 'spin' } });
    expect(r.code).toBe(409);
    expect(r.body.status).toBe('empty');
  });
  it('returns what the server picked', async () => {
    admin = fakeAdmin({ rpcs: { campaign_spin: { status: 'ok', spin_id: 7, spin_count: 3, reward_id: REWARD, product: { id: 'p1', name: 'P' } } } });
    verifyUser.mockResolvedValue({ user: USER, error: null, admin });
    const r = await call(handler, { body: { action: 'spin', productId: 'something-else' } });
    expect(r.body).toEqual({ status: 'ok', spinId: 7, spinCount: 3, rewardId: REWARD, product: { id: 'p1', name: 'P' } });
    expect(admin.calls.rpc[0]).toEqual(['campaign_spin', { p_user: USER.id, p_campaign: 'free-product-2026' }]);
  });
});

describe('claim', () => {
  const body = { action: 'claim', rewardId: REWARD, spinId: 9, idempotencyKey: 'abcdefghijklmnop1234' };
  it('validates input before touching the database', async () => {
    for (const bad of [{ rewardId: 'x' }, { spinId: -1 }, { spinId: 'drop table' }, { idempotencyKey: 'short' }]) {
      expect((await call(handler, { body: { ...body, ...bad } })).code).toBe(400);
    }
    expect(admin.rpc).not.toHaveBeenCalled();
  });
  it('claims and sends the confirmation email once', async () => {
    let logged = false;
    admin = fakeAdmin({
      rpcs: {
        campaign_claim: { status: 'claimed', claim_id: 'c1', product_id: 'p1', product_name: 'P', product_brand: 'B', spins_before_claim: 4 },
        campaign_progress: progress(), campaign_referral_rows: [], ayna_get_referral_code: 'k7m2p9qa',
      },
      tables: { 'campaign_email_log.upsert': () => { const first = !logged; logged = true; return { data: first ? [{ kind: 'claimed' }] : [], error: null }; } },
    });
    verifyUser.mockResolvedValue({ user: USER, error: null, admin });
    const r = await call(handler, { body });
    expect(r.code).toBe(200);
    expect(r.body.status).toBe('claimed');
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(admin.calls.rpc.find(([f]) => f === 'campaign_claim')[1]).toEqual({
      p_user: USER.id, p_campaign: 'free-product-2026', p_reward: REWARD, p_spin_id: 9, p_idempotency_key: body.idempotencyKey,
    });
  });
  it('replayed request returns 200 with the same claim, no second email', async () => {
    admin = fakeAdmin({ rpcs: { campaign_claim: { status: 'already_claimed', same_request: true }, campaign_progress: progress(), campaign_referral_rows: [] } });
    verifyUser.mockResolvedValue({ user: USER, error: null, admin });
    const r = await call(handler, { body });
    expect(r.code).toBe(200);
    expect(r.body.status).toBe('already_claimed');
    expect(sendEmail).not.toHaveBeenCalled();
  });
  it('out of stock / stale / ineligible map to friendly codes', async () => {
    for (const [status, code] of [['out_of_stock', 409], ['stale_spin', 409], ['not_eligible', 403]]) {
      admin = fakeAdmin({ rpcs: { campaign_claim: { status } } });
      verifyUser.mockResolvedValue({ user: USER, error: null, admin });
      const r = await call(handler, { body });
      expect([r.code, r.body.status]).toEqual([code, status]);
    }
  });
});

describe('shipping', () => {
  it('validates the address server-side', async () => {
    const r = await call(handler, { body: { action: 'shipping', address: { fullName: 'A', postal: 'abc' } } });
    expect(r.code).toBe(422);
    expect(Object.keys(r.body.fields)).toEqual(expect.arrayContaining(['fullName', 'line1', 'city', 'state', 'postal', 'email']));
  });
  it('no claim -> 409', async () => {
    admin = fakeAdmin({ rpcs: { campaign_save_shipping: { status: 'no_claim' } } });
    verifyUser.mockResolvedValue({ user: USER, error: null, admin });
    const r = await call(handler, { body: { action: 'shipping', address: { fullName: 'Ana B', line1: '1 Main St', city: 'Ithaca', state: 'ny', postal: '14850', email: 'a@b.co' } } });
    expect(r.code).toBe(409);
  });
});

describe('sweep', () => {
  it('refuses without CRON_SECRET', async () => {
    vi.stubEnv('CRON_SECRET', 'shh');
    expect((await call(handler, { method: 'GET', query: { sweep: '1' }, headers: { authorization: 'Bearer nope' } })).code).toBe(401);
    vi.unstubAllEnvs();
  });
});

describe('admin', () => {
  it('403 for non-admins, 403 for anonymous', async () => {
    vi.stubEnv('ADMIN_EMAILS', 'team@aynahealth.co');
    expect((await call(adminHandler, { method: 'GET' })).code).toBe(403);
    verifyUser.mockResolvedValue({ user: { ...USER, email: 'team@aynahealth.co', is_anonymous: true }, error: null, admin });
    expect((await call(adminHandler, { method: 'GET' })).code).toBe(403);
    vi.unstubAllEnvs();
  });
  it('only known fulfillment statuses', async () => {
    vi.stubEnv('ADMIN_EMAILS', 'her@example.com');
    expect((await call(adminHandler, { body: { claimId: REWARD, status: 'free' } })).code).toBe(400);
    expect((await call(adminHandler, { body: { claimId: REWARD, status: 'shipped' } })).code).toBe(200);
    expect(admin.calls.updates[0][1]).toMatchObject({ fulfillment_status: 'shipped' });
    vi.unstubAllEnvs();
  });
});
