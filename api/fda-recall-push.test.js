/**
 * Push-notification tests for the recall-monitoring sweep (?sweep=1) in api/fda-recall.js —
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

const pushToUser = vi.fn(async () => ({ sent: 1, failed: 0, devices: 1 }));
vi.mock('./_apns.js', () => ({ apnsConfigured: () => true, pushToUser: (...a) => pushToUser(...a) }));

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
function makeMockAdmin({ trackedRows = [], phoneByUser = {}, recallStateByProduct = {}, prefsByUser = {}, devicesByUser = {} } = {}) {
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
        if (table === 'notification_preferences') {
          return Promise.resolve({ data: prefsByUser[filters.user_id] || null, error: null });
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
        if (table === 'device_tokens') return Promise.resolve({ data: null, count: devicesByUser[filters.user_id] || 0, error: null }).then(resolve, reject);
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


const tracked = [{ user_id: 'u1', product_id: 'p-iron', product_name: 'Iron Supplement', brand: '', category: 'supplement', is_tracked: true }];
const phone = { u1: { phone_number: '+15551234567', is_verified: true, sms_opted_out: false } };

describe('recall sweep — push notifications', () => {
  beforeEach(() => {
    restoreEnv();
    restoreEnv = withEnv({
      CRON_SECRET: 'test-cron-secret', RECALL_SWEEP_ENABLED: '1',
      SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-key',
      TWILIO_ACCOUNT_SID: 'AC1', TWILIO_AUTH_TOKEN: 'tok', TWILIO_PHONE_NUMBER: '+15550000000',
    });
    pushToUser.mockClear();
    globalThis.fetch = vi.fn().mockImplementation((url) => Promise.resolve(String(url).includes('enforcement') ? fdaOk([activeRecallRow]) : fdaNotFound()));
  });

  const run = async () => { const res = mockRes(); await (await loadHandler())(sweepReq({ authorization: 'Bearer test-cron-secret' }), res); return res; };

  it('pushes to the phone and skips the text when the channel is push', async () => {
    globalThis.__mockAdmin = makeMockAdmin({ trackedRows: tracked, phoneByUser: phone, devicesByUser: { u1: 1 }, prefsByUser: { u1: { notifications_enabled: true, delivery_channel: 'push' } } });
    const res = await run();
    expect(res.statusCode).toBe(200);
    expect(pushToUser).toHaveBeenCalledTimes(1);
    expect(pushToUser.mock.calls[0][2].title).toContain('Iron Supplement');
    expect(twilioCreate).not.toHaveBeenCalled();
  });

  it('sends push and text when the channel is text message', async () => {
    globalThis.__mockAdmin = makeMockAdmin({ trackedRows: tracked, phoneByUser: phone, devicesByUser: { u1: 1 }, prefsByUser: { u1: { notifications_enabled: true, delivery_channel: 'sms' } } });
    await run();
    expect(pushToUser).toHaveBeenCalledTimes(1);
    expect(twilioCreate).toHaveBeenCalledTimes(1);
  });

  it('falls back to a text when the push reaches no device', async () => {
    pushToUser.mockResolvedValueOnce({ sent: 0, failed: 1, devices: 1 });
    globalThis.__mockAdmin = makeMockAdmin({ trackedRows: tracked, phoneByUser: phone, devicesByUser: { u1: 1 }, prefsByUser: { u1: { notifications_enabled: true, delivery_channel: 'push' } } });
    await run();
    expect(twilioCreate).toHaveBeenCalledTimes(1);
  });

  it('sends nothing when Notifications is off', async () => {
    globalThis.__mockAdmin = makeMockAdmin({ trackedRows: tracked, phoneByUser: phone, devicesByUser: { u1: 1 }, prefsByUser: { u1: { notifications_enabled: false, delivery_channel: 'push' } } });
    await run();
    expect(pushToUser).not.toHaveBeenCalled();
    expect(twilioCreate).not.toHaveBeenCalled();
  });
});
