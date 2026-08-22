import { describe, it, expect } from 'vitest';
import {
  loadEcosystemForUser,
  clearEcosystemForUser,
  upsertProductState,
  upsertProductsBatch,
} from './ecosystemStore.js';

/**
 * Minimal PostgREST-shaped stub. Records every call so we can assert on the
 * SHAPE of the query, which is where the data-loss bug lived — the old
 * clearEcosystem issued a DELETE and destroyed is_tracked/is_omitted along with
 * the ecosystem flag.
 */
function makeSupabase({ selectData = [], failOn = null, failCode = null } = {}) {
  const calls = [];
  function builder(table, op) {
    const record = { table, op, filters: {}, payload: null, options: null };
    calls.push(record);
    const api = {
      select(cols) { record.select = cols; return api; },
      eq(col, val) { record.filters[col] = val; return api; },
      update(payload, options) { record.op = 'update'; record.payload = payload; record.options = options; return api; },
      delete() { record.op = 'delete'; return api; },
      upsert(payload, options) { record.op = 'upsert'; record.payload = payload; record.options = options; return api; },
      then(resolve) {
        const failed = failOn === record.op;
        return Promise.resolve(
          failed
            ? { data: null, error: { message: 'boom', code: failCode }, count: null }
            : { data: record.op === 'select' ? selectData : null, error: null, count: 3 }
        ).then(resolve);
      },
    };
    return api;
  }
  return {
    calls,
    from(table) {
      return {
        select: (c) => builder(table, 'select').select(c),
        update: (p, o) => builder(table, 'update').update(p, o),
        delete: () => builder(table, 'delete').delete(),
        upsert: (p, o) => builder(table, 'upsert').upsert(p, o),
      };
    },
  };
}

describe('clearEcosystemForUser — must not destroy tracked/omitted state', () => {
  it('UPDATEs the ecosystem flag rather than deleting the rows', async () => {
    const sb = makeSupabase();
    await clearEcosystemForUser(sb, 'user-1');

    const update = sb.calls.find((c) => c.op === 'update');
    expect(update).toBeTruthy();
    expect(update.payload.in_ecosystem).toBe(false);
    // The flag is the only thing cleared — tracked/omitted are untouched.
    expect(update.payload).not.toHaveProperty('is_tracked');
    expect(update.payload).not.toHaveProperty('is_omitted');
    expect(update.filters).toMatchObject({ user_id: 'user-1', in_ecosystem: true });
  });

  it('deletes ONLY rows left carrying no state at all', async () => {
    const sb = makeSupabase();
    await clearEcosystemForUser(sb, 'user-1');

    const del = sb.calls.find((c) => c.op === 'delete');
    expect(del).toBeTruthy();
    // All three flags must be false — a row still tracked or hidden survives.
    expect(del.filters).toMatchObject({
      user_id: 'user-1',
      in_ecosystem: false,
      is_tracked: false,
      is_omitted: false,
    });
  });

  it('surfaces an RLS denial instead of silently reporting success', async () => {
    const sb = makeSupabase({ failOn: 'update', failCode: '42501' });
    await expect(clearEcosystemForUser(sb, 'user-1')).rejects.toThrow(/RLS/i);
  });
});

describe('upsertProductsBatch', () => {
  it('sends ONE request for many products instead of one per product', async () => {
    const sb = makeSupabase();
    const products = Array.from({ length: 40 }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
    const res = await upsertProductsBatch(sb, 'user-1', products, { inEcosystem: true });

    const upserts = sb.calls.filter((c) => c.op === 'upsert');
    expect(upserts).toHaveLength(1);
    expect(upserts[0].payload).toHaveLength(40);
    expect(res.saved).toBe(40);
  });

  it('chunks beyond 100 rather than sending one oversized request', async () => {
    const sb = makeSupabase();
    const products = Array.from({ length: 250 }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
    await upsertProductsBatch(sb, 'user-1', products, { inEcosystem: true });
    expect(sb.calls.filter((c) => c.op === 'upsert')).toHaveLength(3);
  });

  it('targets the composite key so rows update instead of duplicating', async () => {
    const sb = makeSupabase();
    await upsertProductsBatch(sb, 'user-1', [{ id: 'p1', name: 'P' }], { inEcosystem: true });
    expect(sb.calls[0].options).toMatchObject({ onConflict: 'user_id,product_id' });
  });

  it('names the missing unique constraint (42P10) explicitly', async () => {
    const sb = makeSupabase({ failOn: 'upsert', failCode: '42P10' });
    await expect(
      upsertProductsBatch(sb, 'user-1', [{ id: 'p1', name: 'P' }], { inEcosystem: true })
    ).rejects.toThrow(/unique constraint/i);
  });

  it('skips products with no id and no-ops on an empty list', async () => {
    const sb = makeSupabase();
    const res = await upsertProductsBatch(sb, 'user-1', [null, {}, { name: 'no id' }], { inEcosystem: true });
    expect(res.saved).toBe(0);
    expect(sb.calls.filter((c) => c.op === 'upsert')).toHaveLength(0);
  });
});

describe('upsertProductState', () => {
  it('clears the flags, then deletes the row only if nothing else holds it', async () => {
    const sb = makeSupabase();
    await upsertProductState(sb, 'u', { id: 'p1' }, { inEcosystem: false, isTracked: false, isOmitted: false });

    // A plain DELETE would also wipe is_saved, emptying the user's Save for
    // later list whenever she removed the same product from her ecosystem.
    expect(sb.calls[0].op).toBe('update');
    expect(sb.calls[0].payload).toMatchObject({ in_ecosystem: false, is_tracked: false, is_omitted: false });
    expect(sb.calls[0].filters).toMatchObject({ user_id: 'u', product_id: 'p1' });

    expect(sb.calls[1].op).toBe('delete');
    expect(sb.calls[1].filters).toMatchObject({
      user_id: 'u', product_id: 'p1', in_ecosystem: false, is_tracked: false, is_omitted: false, is_saved: false,
    });
  });

  it('tolerates a database without the is_saved column on the cleanup delete', async () => {
    const sb = makeSupabase({ failOn: 'delete', failCode: '42703' });
    await expect(
      upsertProductState(sb, 'u', { id: 'p1' }, { inEcosystem: false, isTracked: false, isOmitted: false }),
    ).resolves.toBeUndefined();
  });

  it('upserts when any flag is set', async () => {
    const sb = makeSupabase();
    await upsertProductState(sb, 'u', { id: 'p1', name: 'P' }, { inEcosystem: false, isTracked: true, isOmitted: false });
    expect(sb.calls[0].op).toBe('upsert');
    expect(sb.calls[0].payload).toMatchObject({ is_tracked: true, in_ecosystem: false });
  });
});

describe('loadEcosystemForUser', () => {
  it('routes each row into the lists its flags name', async () => {
    const sb = makeSupabase({
      selectData: [
        { product_id: 'a', in_ecosystem: true, is_tracked: false, is_omitted: false, product_data: { id: 'a' } },
        { product_id: 'b', in_ecosystem: true, is_tracked: true, is_omitted: false, product_data: { id: 'b' } },
        { product_id: 'c', in_ecosystem: false, is_tracked: false, is_omitted: true, product_data: { id: 'c' } },
      ],
    });
    const out = await loadEcosystemForUser(sb, 'u');
    expect(Object.keys(out.myProducts)).toEqual(['a', 'b']);
    expect(Object.keys(out.trackedProducts)).toEqual(['b']);
    expect(Object.keys(out.omittedProducts)).toEqual(['c']);
  });

  it('falls back to the flat columns when product_data is absent', async () => {
    const sb = makeSupabase({
      selectData: [{ product_id: 'a', in_ecosystem: true, product_name: 'Name', brand: 'B', category: 'pad', product_type: 'physical' }],
    });
    const out = await loadEcosystemForUser(sb, 'u');
    expect(out.myProducts.a).toMatchObject({ id: 'a', name: 'Name', brand: 'B' });
  });
});
