import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ sb: null }));
vi.mock('./supabaseClient', () => ({ getSupabaseClient: () => mock.sb, getSupabaseUser: async () => ({ id: 'user-a' }) }));
import { clearHealthIntakeForCurrentUser, loadHealthIntakeForCurrentUser, saveHealthIntakeForCurrentUser } from './healthIntakeStore.js';

let rows;
let calls;
beforeEach(() => {
  rows = new Map(); calls = [];
  const local = new Map();
  const session = new Map();
  vi.stubGlobal('window', {
    localStorage: { getItem: (key) => local.get(key) || null, setItem: (key, value) => local.set(key, value), removeItem: (key) => local.delete(key) },
    sessionStorage: { getItem: (key) => session.get(key) || null, setItem: (key, value) => session.set(key, value), removeItem: (key) => session.delete(key) },
  });
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

describe('a save never overwrites saved answers with blanks', () => {
  it('a quiz finished before her answers loaded keeps her saved fields; explicit new answers still win', async () => {
    rows.set('user-a', { age: 34, lifeStage: 'perimenopause', supportSelections: ['Heavy periods'], cycle: { length: 28, flow: 'heavy' }, conditions: ['PCOS'] });
    const res = await saveHealthIntakeForCurrentUser({ age: null, lifeStage: '', supportSelections: [], cycle: { flow: 'light' }, conditions: ['Endometriosis'], recommendedProductsPerArea: 3 });
    expect(res.saved).toBe(true);
    expect(rows.get('user-a')).toEqual({ age: 34, lifeStage: 'perimenopause', supportSelections: ['Heavy periods'], cycle: { length: 28, flow: 'light' }, conditions: ['Endometriosis'], recommendedProductsPerArea: 3 });
  });
  it('after a reset there is nothing to keep', async () => {
    rows.set('user-a', { age: 34 });
    await clearHealthIntakeForCurrentUser();
    rows.set('user-a', { age: 34 }); // stale remote row while the delete is pending
    await saveHealthIntakeForCurrentUser({ age: null, recommendedProductsPerArea: 2 });
    expect(rows.get('user-a')).toEqual({ age: null, recommendedProductsPerArea: 2 });
  });
});
