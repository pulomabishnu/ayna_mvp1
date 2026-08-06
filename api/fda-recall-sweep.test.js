/**
 * Tests for the recall-monitoring sweep (?sweep=1) in api/fda-recall.js —
 * the cron-triggered path that actually acts on the "🔔 Monitor Safety
 * Recalls" flag, which previously did nothing. This is a real-SMS-cost path,
 * so Twilio is always mocked; never let a test send one for real.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockRes, mockReq, withEnv } from './_test-helpers.js';

const realFetch = globalThis.fetch;
let restoreEnv;

const twilioCreate = vi.fn(async () => ({ sid: 'SM123' }));
vi.mock('twilio', () => ({
  default: () => ({ messages: { create: (...args) => twilioCreate(...args) } }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => globalThis.__mockAdmin,
}));

async function loadHandler() {
  vi.resetModules();
  return (await import('./fda-recall.js')).default;
}

/**
 * A small, purpose-built Supabase mock. The generic mockSupabase() in
 * _test-helpers.js resolves every call to a table+op to the SAME canned
 * result, which doesn't work here — the sweep queries the same table
 * (phone_numbers, product_recall_state) once per distinct product/user with
 * DIFFERENT expected results each time. This one resolves based on the
 * actual accumulated .eq() filters.
 */
function makeMockAdmin({ trackedRows = [], phoneByUser = {}, recallStateByProduct = {} } = {}) {
  const inserted = [];
  const updated = [];
  const upserted = [];
  const sentKeys = new Set(); // simulates the unique index on (user_id, product_id, recall_signature) where status='sent'

  function selectBuilder(table, filters) {
    return {
      eq(col, val) { return selectBuilder(table, { ...filters, [col]: val }); },
      maybeSingle() {
        if (table === 'phone_numbers') {
          return Promise.resolve({ data: phoneByUser[filters.user_id] || null, error: null });
        }
        if (table === 'product_recall_state') {
          const sig = recallStateByProduct[filters.product_id];
          return Promise.resolve({ data: sig !== undefined ? { recall_signature: sig } : null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      then(resolve, reject) {
        if (table === 'user_ecosystems') {
          const rows = trackedRows.filter((r) =>
            Object.entries(filters).every(([k, v]) => r[k] === v)
          );
          return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
        }
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      },
    };
  }

  function updateBuilder(table, payload, filters) {
    return {
      eq(col, val) { return updateBuilder(table, payload, { ...filters, [col]: val }); },
      then(resolve, reject) {
        updated.push({ table, payload, filters });
        return Promise.resolve({ data: null, error: null }).then(resolve, reject);
      },
    };
  }

  return {
    inserted, updated, upserted,
    from(table) {
      return {
        select: () => selectBuilder(table, {}),
        insert(payload) {
          if (table === 'recall_notifications' && payload.status === 'sent') {
            const key = `${payload.user_id}:${payload.product_id}:${payload.recall_signature}`;
            if (sentKeys.has(key)) {
              return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate key' } });
            }
            sentKeys.add(key);
          }
          inserted.push({ table, payload });
          return Promise.resolve({ data: null, error: null });
        },
        update(payload) { return updateBuilder(table, payload, {}); },
        upsert(payload, opts) {
          upserted.push({ table, payload, opts });
          return Promise.resolve({ data: null, error: null });
        },
      };
    },
  };
}

function fdaOk(rows) {
  return { ok: true, status: 200, json: async () => ({ results: rows }) };
}
function fdaNotFound() {
  return { ok: false, status: 404, json: async () => ({ error: { code: 'NOT_FOUND' } }) };
}

const activeRecallRow = {
  recall_number: 'R-001',
  status: 'Ongoing',
  event_date_initiated: '20260101',
  reason_for_recall: 'Undeclared allergen',
  product_description: 'Iron Supplement 60ct',
};

beforeEach(() => {
  restoreEnv = withEnv({
    CRON_SECRET: 'test-cron-secret',
    RECALL_SWEEP_ENABLED: undefined,
    SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    TWILIO_ACCOUNT_SID: 'AC1', TWILIO_AUTH_TOKEN: 'tok', TWILIO_PHONE_NUMBER: '+15550000000',
  });
  twilioCreate.mockClear();
});

afterEach(() => {
  restoreEnv();
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

function sweepReq(headers = {}) {
  return mockReq({ method: 'GET', query: { sweep: '1' }, headers });
}

describe('GET /api/fda-recall?sweep=1 — access control', () => {
  it('401s when CRON_SECRET is not configured, before touching Supabase or Twilio', async () => {
    restoreEnv();
    restoreEnv = withEnv({ CRON_SECRET: undefined });
    globalThis.__mockAdmin = makeMockAdmin();
    const res = mockRes();
    await (await loadHandler())(sweepReq({ authorization: 'Bearer whatever' }), res);
    expect(res.statusCode).toBe(401);
  });

  it('401s when the Authorization header does not match CRON_SECRET', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    const res = mockRes();
    await (await loadHandler())(sweepReq({ authorization: 'Bearer wrong-secret' }), res);
    expect(res.statusCode).toBe(401);
  });

  it('401s with no Authorization header at all', async () => {
    globalThis.__mockAdmin = makeMockAdmin();
    const res = mockRes();
    await (await loadHandler())(sweepReq({}), res);
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/fda-recall?sweep=1 — dry run (default, RECALL_SWEEP_ENABLED unset)', () => {
  it('detects a new active recall but sends nothing and writes nothing', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url) =>
      Promise.resolve(String(url).includes('enforcement') ? fdaOk([activeRecallRow]) : fdaNotFound())
    );
    globalThis.__mockAdmin = makeMockAdmin({
      trackedRows: [
        { user_id: 'u1', product_id: 'p-iron', product_name: 'Iron Supplement', brand: '', category: 'supplement', is_tracked: true },
      ],
      phoneByUser: { u1: { phone_number: '+15551234567', is_verified: true, sms_opted_out: false } },
      recallStateByProduct: {}, // never checked before
    });

    const res = mockRes();
    await (await loadHandler())(sweepReq({ authorization: 'Bearer test-cron-secret' }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.dryRun).toBe(true);
    expect(res.body.productsWithNewRecalls).toBe(1);
    expect(twilioCreate).not.toHaveBeenCalled();
    expect(globalThis.__mockAdmin.inserted).toHaveLength(0);
    expect(globalThis.__mockAdmin.upserted).toHaveLength(0);
  });
});

describe('GET /api/fda-recall?sweep=1 — real run (RECALL_SWEEP_ENABLED=1)', () => {
  beforeEach(() => {
    restoreEnv();
    restoreEnv = withEnv({
      CRON_SECRET: 'test-cron-secret',
      RECALL_SWEEP_ENABLED: '1',
      SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
      TWILIO_ACCOUNT_SID: 'AC1', TWILIO_AUTH_TOKEN: 'tok', TWILIO_PHONE_NUMBER: '+15550000000',
    });
  });

  it('texts a verified, opted-in user about a genuinely new recall, and records it', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url) =>
      Promise.resolve(String(url).includes('enforcement') ? fdaOk([activeRecallRow]) : fdaNotFound())
    );
    globalThis.__mockAdmin = makeMockAdmin({
      trackedRows: [
        { user_id: 'u1', product_id: 'p-iron', product_name: 'Iron Supplement', brand: '', category: 'supplement', is_tracked: true },
      ],
      phoneByUser: { u1: { phone_number: '+15551234567', is_verified: true, sms_opted_out: false } },
      recallStateByProduct: {},
    });

    const res = mockRes();
    await (await loadHandler())(sweepReq({ authorization: 'Bearer test-cron-secret' }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.dryRun).toBe(false);
    expect(res.body.notified).toBe(1);
    expect(twilioCreate).toHaveBeenCalledTimes(1);
    expect(twilioCreate.mock.calls[0][0].to).toBe('+15551234567');
    expect(twilioCreate.mock.calls[0][0].body).toContain('Iron Supplement');

    const sentRow = globalThis.__mockAdmin.inserted.find((r) => r.table === 'recall_notifications');
    expect(sentRow.payload.status).toBe('sent');
    expect(globalThis.__mockAdmin.upserted[0].table).toBe('product_recall_state');
  });

  it('skips a user with no verified phone number, without calling Twilio', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url) =>
      Promise.resolve(String(url).includes('enforcement') ? fdaOk([activeRecallRow]) : fdaNotFound())
    );
    globalThis.__mockAdmin = makeMockAdmin({
      trackedRows: [
        { user_id: 'u1', product_id: 'p-iron', product_name: 'Iron Supplement', brand: '', category: 'supplement', is_tracked: true },
      ],
      phoneByUser: {}, // no phone on file
      recallStateByProduct: {},
    });

    const res = mockRes();
    await (await loadHandler())(sweepReq({ authorization: 'Bearer test-cron-secret' }), res);

    expect(twilioCreate).not.toHaveBeenCalled();
    expect(res.body.skipped).toBe(1);
    const skipRow = globalThis.__mockAdmin.inserted.find((r) => r.table === 'recall_notifications');
    expect(skipRow.payload.status).toBe('skipped_no_phone');
  });

  it('skips a user who opted out of SMS, without calling Twilio', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url) =>
      Promise.resolve(String(url).includes('enforcement') ? fdaOk([activeRecallRow]) : fdaNotFound())
    );
    globalThis.__mockAdmin = makeMockAdmin({
      trackedRows: [
        { user_id: 'u1', product_id: 'p-iron', product_name: 'Iron Supplement', brand: '', category: 'supplement', is_tracked: true },
      ],
      phoneByUser: { u1: { phone_number: '+15551234567', is_verified: true, sms_opted_out: true } },
      recallStateByProduct: {},
    });

    const res = mockRes();
    await (await loadHandler())(sweepReq({ authorization: 'Bearer test-cron-secret' }), res);

    expect(twilioCreate).not.toHaveBeenCalled();
    expect(res.body.skipped).toBe(1);
  });

  it('does NOT re-notify when the recall signature is unchanged from last check', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url) =>
      Promise.resolve(String(url).includes('enforcement') ? fdaOk([activeRecallRow]) : fdaNotFound())
    );
    globalThis.__mockAdmin = makeMockAdmin({
      trackedRows: [
        { user_id: 'u1', product_id: 'p-iron', product_name: 'Iron Supplement', brand: '', category: 'supplement', is_tracked: true },
      ],
      phoneByUser: { u1: { phone_number: '+15551234567', is_verified: true, sms_opted_out: false } },
      // Already recorded as the current state — same signature the live fetch will compute.
      recallStateByProduct: { 'p-iron': 'R-001' },
    });

    const res = mockRes();
    await (await loadHandler())(sweepReq({ authorization: 'Bearer test-cron-secret' }), res);

    expect(res.body.productsWithNewRecalls).toBe(0);
    expect(twilioCreate).not.toHaveBeenCalled();
  });

  it('does not double-text when the recall_notifications claim already exists (idempotency)', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url) =>
      Promise.resolve(String(url).includes('enforcement') ? fdaOk([activeRecallRow]) : fdaNotFound())
    );
    const admin = makeMockAdmin({
      trackedRows: [
        { user_id: 'u1', product_id: 'p-iron', product_name: 'Iron Supplement', brand: '', category: 'supplement', is_tracked: true },
      ],
      phoneByUser: { u1: { phone_number: '+15551234567', is_verified: true, sms_opted_out: false } },
      recallStateByProduct: {},
    });
    globalThis.__mockAdmin = admin;

    // Run the sweep twice in a row without the mock's state being reset —
    // simulates a retry/overlapping cron invocation before product_recall_state
    // would have caught up.
    const res1 = mockRes();
    await (await loadHandler())(sweepReq({ authorization: 'Bearer test-cron-secret' }), res1);
    expect(twilioCreate).toHaveBeenCalledTimes(1);

    // Manually revert the recall state to simulate a concurrent run that
    // hasn't upserted yet — the claim (recall_notifications unique index)
    // is what should prevent the double-send, not the state table.
    const res2 = mockRes();
    await (await loadHandler())(sweepReq({ authorization: 'Bearer test-cron-secret' }), res2);
    expect(twilioCreate).toHaveBeenCalledTimes(1); // still just once
    expect(res2.body.skipped).toBe(1);
  });

  it('skips a product whose FDA check failed outright, without crashing the whole sweep', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}), text: async () => 'err' });
    globalThis.__mockAdmin = makeMockAdmin({
      trackedRows: [
        { user_id: 'u1', product_id: 'p-iron', product_name: 'Iron Supplement', brand: '', category: 'supplement', is_tracked: true },
      ],
      phoneByUser: { u1: { phone_number: '+15551234567', is_verified: true, sms_opted_out: false } },
      recallStateByProduct: {},
    });

    const res = mockRes();
    await (await loadHandler())(sweepReq({ authorization: 'Bearer test-cron-secret' }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.productsWithNewRecalls).toBe(0);
    expect(twilioCreate).not.toHaveBeenCalled();
  });

  it('deduplicates multiple ecosystem rows for the same product (only checks it once)', async () => {
    const fetchMock = vi.fn().mockImplementation((url) =>
      Promise.resolve(String(url).includes('enforcement') ? fdaOk([activeRecallRow]) : fdaNotFound())
    );
    globalThis.fetch = fetchMock;
    globalThis.__mockAdmin = makeMockAdmin({
      trackedRows: [
        { user_id: 'u1', product_id: 'p-iron', product_name: 'Iron Supplement', brand: '', category: 'supplement', is_tracked: true },
        { user_id: 'u2', product_id: 'p-iron', product_name: 'Iron Supplement', brand: '', category: 'supplement', is_tracked: true },
      ],
      phoneByUser: {
        u1: { phone_number: '+15551111111', is_verified: true, sms_opted_out: false },
        u2: { phone_number: '+15552222222', is_verified: true, sms_opted_out: false },
      },
      recallStateByProduct: {},
    });

    const res = mockRes();
    await (await loadHandler())(sweepReq({ authorization: 'Bearer test-cron-secret' }), res);

    expect(res.body.productsChecked).toBe(1);
    expect(twilioCreate).toHaveBeenCalledTimes(2); // both trackers of the one product notified
  });
});
