import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ sb: null }));
vi.mock('./supabaseClient', () => ({ getSupabaseClient: () => mock.sb, getSupabaseUser: async () => ({ id: 'user-a' }) }));
import { clearHealthIntakeForCurrentUser, loadHealthIntakeForCurrentUser, saveHealthIntakeForCurrentUser } from './healthIntakeStore.js';

let rows;
let calls;
beforeEach(() => {
  rows = new Map(); calls = [];
  const local = new Map();
  vi.stubGlobal('window', { localStorage: { getItem: (key) => local.get(key) || null, setItem: (key, value) => local.set(key, value) } });
  mock.sb = { from(table) {
    const call = { table }; calls.push(call);
    const query = {
      select() { call.op = 'select'; return query; },
      upsert(payload) { call.op = 'upsert'; call.payload = payload; rows.set(payload.user_id, payload.profile); return query; },
      delete() { call.op = 'delete'; return query; },
      eq(key, value) { call[key] = value; if (call.op === 'delete') rows.delete(value); return query; },
      maybeSingle: async () => ({ data: rows.has(call.user_id) ? { profile: rows.get(call.user_id) } : null, error: null }),
      then: (resolve) => Promise.resolve({ error: null }).then(resolve),
    }; return query;
  } };
});
describe('intake persistence boundaries', () => {
  it('round trips recommendation quantity and skipped age in the account profile', async () => {
    const profile = { age: null, recommendedProductsPerArea: 5, supportSelections: ['Heavy periods'] };
    expect((await saveHealthIntakeForCurrentUser({ fullHealthIntake: profile })).saved).toBe(true);
    expect(await loadHealthIntakeForCurrentUser()).toEqual(profile);
    expect(calls.find((call) => call.op === 'upsert').payload).toMatchObject({ user_id: 'user-a', profile });
  });
  it('reset clears only the health intake and does not resurrect it', async () => {
    await saveHealthIntakeForCurrentUser({ recommendedProductsPerArea: 3 });
    await clearHealthIntakeForCurrentUser();
    rows.set('user-a', { recommendedProductsPerArea: 3 }); // stale remote response
    expect(await loadHealthIntakeForCurrentUser()).toBe(null);
    expect(calls.filter((call) => call.op === 'delete').every((call) => call.table === 'health_intakes' && call.user_id === 'user-a')).toBe(true);
  });
});
