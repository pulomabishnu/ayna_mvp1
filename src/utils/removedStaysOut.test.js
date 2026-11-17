// @vitest-environment jsdom
// Nov 17 (Puloma: "products I've removed in the past reappear in my routine / ecosystem, the biggest bug").
// End to end against an in-memory user_ecosystems table: add, remove, reload, re-seed, reload, add back.
import { describe, expect, it } from 'vitest';
import { loadEcosystemForUser, upsertProductState, upsertProductsBatch } from './ecosystemStore.js';

function memoryTable() {
  const rows = new Map(); // product_id -> row
  function query(op) {
    const st = { op, filters: [], payload: null };
    const run = () => {
      const match = (r) => st.filters.every(([k, v]) => (Array.isArray(v) ? v.includes(r[k]) : r[k] === v));
      if (op === 'select') return { data: [...rows.values()].filter(match).map((r) => ({ ...r, product_data: r.product_data && { ...r.product_data } })), error: null };
      if (op === 'upsert') { for (const p of [].concat(st.payload)) rows.set(p.product_id, { ...(rows.get(p.product_id) || { is_saved: false }), ...p }); return { data: null, error: null }; }
      if (op === 'update') { for (const r of rows.values()) if (match(r)) Object.assign(r, st.payload); return { data: null, error: null, count: 1 }; }
      if (op === 'delete') { for (const [k, r] of rows) if (match(r)) rows.delete(k); return { data: null, error: null }; }
      return { data: null, error: null };
    };
    const api = {
      select() { return api; }, eq(k, v) { st.filters.push([k, v]); return api; }, in(k, v) { st.filters.push([k, v]); return api; },
      upsert(p) { st.payload = p; return api; }, update(p) { st.payload = p; return api; }, delete() { return api; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    return api;
  }
  return {
    rows,
    auth: { getUser: async () => ({ data: { user: { id: 'u', user_metadata: {} } } }), getSession: async () => ({ data: { session: null } }), updateUser: async () => ({}), refreshSession: async () => ({}) },
    from() { return { select: () => query('select'), upsert: (p) => query('upsert').upsert(p), update: (p) => query('update').update(p), delete: () => query('delete') }; },
  };
}

const A = { id: 'p-winx-uti-daily-defense', name: 'Winx', intakeGenerated: true };
const B = { id: 'p-always-infinity', name: 'Always', intakeGenerated: true };
const fresh = () => { try { localStorage.clear(); sessionStorage.clear(); } catch { /* jsdom */ } };

describe('a product she removes stays out', () => {
  it('survives a reload on another device and a quiz re-seed, and comes back only when she adds it', async () => {
    const sb = memoryTable();
    fresh();
    await upsertProductsBatch(sb, 'u', [A, B], { inEcosystem: true, isTracked: false, isOmitted: false });
    let eco = await loadEcosystemForUser(sb, 'u');
    expect(Object.keys(eco.myProducts).sort()).toEqual([A.id, B.id].sort());

    // She takes A out (app and website both pass removedByUser).
    await upsertProductState(sb, 'u', A, { inEcosystem: false, isTracked: false, isOmitted: false, removedByUser: true });
    expect(sb.rows.get(A.id)).toMatchObject({ in_ecosystem: false });
    expect(sb.rows.get(A.id).product_data._removedAt).toEqual(expect.any(Number));

    // Another device (empty local copy) loads: A is out and known as removed.
    fresh();
    eco = await loadEcosystemForUser(sb, 'u');
    expect(Object.keys(eco.myProducts)).toEqual([B.id]);
    expect(Object.keys(eco.removedProducts)).toEqual([A.id]);

    // A quiz retake / new goal / AI rebuild seeds A again: it stays out.
    fresh();
    await upsertProductsBatch(sb, 'u', [A, B], { inEcosystem: true, isTracked: false, isOmitted: false });
    eco = await loadEcosystemForUser(sb, 'u');
    expect(Object.keys(eco.myProducts)).toEqual([B.id]);

    // She adds it back herself: it's in, and the mark is gone.
    await upsertProductState(sb, 'u', { ...A, intakeGenerated: false, userAdded: true }, { inEcosystem: true, isTracked: true, isOmitted: false });
    fresh();
    eco = await loadEcosystemForUser(sb, 'u');
    expect(Object.keys(eco.myProducts).sort()).toEqual([A.id, B.id].sort());
    expect(eco.removedProducts[A.id]).toBeUndefined();
    expect(sb.rows.get(A.id).product_data._removedAt).toBeUndefined();
  });
});
