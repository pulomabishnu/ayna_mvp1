/* global Buffer */
import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, afterEach } from 'vitest';
import handler, { readProductId, setGoAdminForTests } from './go.js';
import { mockReq, mockRes } from './_test-helpers.js';

function fakeDb(result = { error: null }) {
  const rpc = vi.fn(async () => result);
  return { rpc };
}

afterEach(() => setGoAdminForTests(null));

describe('readProductId', () => {
  it('reads a beacon (text) body, a JSON body or ?p=', () => {
    expect(readProductId({ body: '{"p":"p-monistat-7"}' })).toBe('p-monistat-7');
    expect(readProductId({ body: Buffer.from('{"p":"p-monistat-7"}') })).toBe('p-monistat-7');
    expect(readProductId({ body: { p: 'p-monistat-7' } })).toBe('p-monistat-7');
    expect(readProductId({ body: undefined, query: { p: 'p-monistat-7' } })).toBe('p-monistat-7');
  });
  it('rejects anything that is not a product id', () => {
    for (const body of ['not json', '{"p":"../x"}', '{"p":"a b"}', `{"p":"${'a'.repeat(81)}"}`, '{"p":5}', '{}']) {
      expect(readProductId({ body }), body).toBeNull();
    }
  });
});

describe('POST /api/go', () => {
  it('adds one click for the product and stores nothing about the person', async () => {
    const db = fakeDb();
    setGoAdminForTests(db);
    const res = mockRes();
    await handler(mockReq({ body: '{"p":"p-monistat-7","email":"a@b.co"}', headers: { 'x-forwarded-for': '1.2.3.4', 'user-agent': 'UA' } }), res);
    expect(res.statusCode).toBe(204);
    expect(db.rpc).toHaveBeenCalledWith('record_buy_click', { p_product_id: 'p-monistat-7' });
    expect(JSON.stringify(db.rpc.mock.calls)).not.toMatch(/1\.2\.3\.4|UA|a@b/);
  });
  it('answers 204 and writes nothing for a bad id', async () => {
    const db = fakeDb();
    setGoAdminForTests(db);
    const res = mockRes();
    await handler(mockReq({ body: '{"p":"<script>"}' }), res);
    expect(res.statusCode).toBe(204);
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it('a database error never becomes a page error', async () => {
    setGoAdminForTests(fakeDb({ error: { code: '42P01', message: 'missing' } }));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();
    await handler(mockReq({ body: '{"p":"p-monistat-7"}' }), res);
    expect(res.statusCode).toBe(204);
    spy.mockRestore();
  });
  it('only POST counts', async () => {
    const db = fakeDb();
    setGoAdminForTests(db);
    const res = mockRes();
    await handler(mockReq({ method: 'GET', query: { p: 'p-monistat-7' } }), res);
    expect(res.statusCode).toBe(405);
    expect(db.rpc).not.toHaveBeenCalled();
  });
});

describe('buy_click_daily SQL', () => {
  const sql = readFileSync(new URL('../supabase/buy_click_daily_2026-11-10.sql', import.meta.url), 'utf8');
  it('stores only product, day and count, and only for catalog products', () => {
    const table = sql.slice(sql.indexOf('create table'), sql.indexOf(');', sql.indexOf('create table')));
    const cols = [...table.matchAll(/^\s+(\w+)\s+(?:text|date|integer)/gm)].map((m) => m[1]);
    expect(cols).toEqual(['product_id', 'day', 'clicks']);
    expect(sql).toMatch(/where exists \(select 1 from public\.product_catalog where id = p_product_id\)/);
    expect(sql).toMatch(/revoke all on public\.buy_click_daily from anon, authenticated/);
    expect(sql).toMatch(/revoke all on function public\.record_buy_click\(text\) from public, anon, authenticated/);
  });
});
