/* global process */
/**
 * Shared harness for driving route handlers end-to-end in tests.
 *
 * Mocks only the two edges — Supabase and fetch — so everything between the
 * request and the response is the real code path: auth, quota accounting,
 * validation, prompt construction, error mapping.
 */
import { vi } from 'vitest';

/** Minimal Vercel-style response recorder. */
export function mockRes() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    ended: false,
    setHeader(k, v) { this.headers[String(k).toLowerCase()] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; this.ended = true; return this; },
    send(payload) { this.body = payload; this.ended = true; return this; },
    end() { this.ended = true; return this; },
  };
}

export function mockReq({ method = 'POST', body = {}, query = {}, headers = {} } = {}) {
  return {
    method,
    body,
    query,
    headers: { authorization: 'Bearer test-token', ...headers },
  };
}

/**
 * Fake Supabase admin client.
 *
 * `rpcResults` maps an RPC name to the value it returns; `rpcCalls` records
 * every invocation so a test can assert on ORDER — which is the whole point for
 * quota accounting (consume must precede the provider call, refund must follow
 * a failure).
 */
export function mockSupabase({
  user = { id: 'user-1', email: 'u@x.com', app_metadata: {}, user_metadata: {} },
  authError = null,
  rpcResults = {},
  tableResults = {},
} = {}) {
  const rpcCalls = [];
  const tableCalls = [];

  const client = {
    rpcCalls,
    tableCalls,
    auth: {
      getUser: vi.fn(async () => (authError ? { data: null, error: authError } : { data: { user }, error: null })),
      admin: {
        updateUserById: vi.fn(async () => ({ data: {}, error: null })),
      },
    },
    rpc: vi.fn(async (name, args) => {
      rpcCalls.push({ name, args });
      if (name in rpcResults) {
        const r = rpcResults[name];
        return typeof r === 'function' ? r(args) : r;
      }
      return { data: null, error: { message: `no mock for rpc ${name}` } };
    }),
    from: vi.fn((table) => {
      const rec = { table, op: null, filters: {}, payload: null };
      tableCalls.push(rec);
      const api = {
        select(c) { rec.op = 'select'; rec.select = c; return api; },
        insert(p) { rec.op = 'insert'; rec.payload = p; return api; },
        update(p) { rec.op = 'update'; rec.payload = p; return api; },
        upsert(p, o) { rec.op = 'upsert'; rec.payload = p; rec.options = o; return api; },
        delete() { rec.op = 'delete'; return api; },
        eq(col, val) { rec.filters[col] = val; return api; },
        order() { return api; },
        limit() { return api; },
        maybeSingle() { return api; },
        then(resolve) {
          const key = `${table}.${rec.op}`;
          const result = tableResults[key] ?? tableResults[table] ?? { data: null, error: null };
          return Promise.resolve(result).then(resolve);
        },
      };
      return api;
    }),
  };
  return client;
}

/** Set the env every authenticated route needs, and return a restore fn. */
export function withEnv(vars) {
  const saved = {};
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return () => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  };
}

/** Anthropic-shaped success response for a mocked fetch. */
export function anthropicOk(text, stopReason = 'end_turn') {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({ content: [{ text }], stop_reason: stopReason }),
    text: async () => text,
  };
}

/** OpenAI-shaped success response for a mocked fetch — for testing the actual
 * cross-provider fallback (Anthropic fails, OpenAI picks it up), not just the
 * Anthropic-only path most callers exercise. */
export function openaiOk(text, finishReason = 'stop') {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({ choices: [{ message: { content: text }, finish_reason: finishReason }] }),
    text: async () => text,
  };
}

export function httpError(status, headers = {}) {
  return {
    ok: false,
    status,
    headers: new Headers(headers),
    json: async () => ({ error: `status ${status}` }),
    text: async () => `status ${status}`,
  };
}
