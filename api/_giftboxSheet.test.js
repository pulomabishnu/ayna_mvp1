import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSupabase } from './_test-helpers.js';
import { imageUrl, parseCsv, resetSheetSyncClock, rowsToProducts, sheetCsvUrl, syncFromSheet } from './_giftboxSheet.js';

const CSV = [
  ',,,,,,,,,',
  'id,category,brand,name,value,notes,image,link,max,show',
  'tweexy-holder,Nails,Tweexy,"Hinge Untippable Nail Polish Holder, Purple",20,Untippable hinge holder,https://cdn.shopify.com/a.jpg,https://tweexy.com/p,1,yes',
  'secret-berry,Body,Secret,"Clinical ""Berry"" 2.6oz",$14,"100hr protection, hyaluronic acid",https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing,,2,yes',
  'olay-wrinklefiller,Skin,Olay,Regenerist Wrinkle Filler,,Instant filler,,,1,no',
  'no-price,Skin,X,Thing,,,,,1,yes',
  'tweexy-holder,Nails,Tweexy,Dupe row,5,,,,1,yes',
  'bad id!,Skin,X,Bad,5,,,,1,yes',
  ',,,,,,,,,',
].join('\r\n');

beforeEach(() => { resetSheetSyncClock(); vi.unstubAllEnvs(); });

describe('reading the gift box sheet', () => {
  it('parses quoted fields with commas and quotes', () => {
    const rows = parseCsv(CSV);
    expect(rows[2][3]).toBe('Hinge Untippable Nail Polish Holder, Purple');
    expect(rows[3][3]).toBe('Clinical "Berry" 2.6oz');
  });

  it('turns rows into products, hiding no-price and show=no rows', () => {
    const { products, skipped } = rowsToProducts(parseCsv(CSV));
    expect(products.map((p) => p.sheet_id)).toEqual(['tweexy-holder', 'secret-berry', 'olay-wrinklefiller', 'no-price']);
    expect(products[0]).toMatchObject({ category: 'Nails', brand: 'Tweexy', price_cents: 2000, is_active: true, max_per_order: 1, sort_order: 0 });
    expect(products[1]).toMatchObject({ price_cents: 1400, max_per_order: 2, product_url: null });
    expect(products[1].image_url).toBe('https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOp&sz=w1000');
    expect(products[2].is_active).toBe(false);
    expect(products[3].is_active).toBe(false);
    expect(skipped.map((s) => s.reason)).toEqual(['duplicate id tweexy-holder', 'bad id']);
  });

  it('never lets a javascript: link through', () => {
    expect(imageUrl('javascript:alert(1)')).toBeNull();
  });

  it('defaults to the team sheet, overridable by env', () => {
    expect(sheetCsvUrl()).toContain('1O0SYPPDQpnq7_U5LjDI98ED5jJDLourfblzalwtgVeM/export?format=csv');
    vi.stubEnv('GIFTBOX_SHEET_ID', 'other');
    expect(sheetCsvUrl()).toContain('/d/other/export');
  });
});

describe('syncFromSheet', () => {
  const okFetch = vi.fn(async () => ({ ok: true, text: async () => CSV }));

  it('upserts by sheet id and hides products removed from the sheet', async () => {
    const db = mockSupabase({ tableResults: {
      'giftbox_products.upsert': { data: null, error: null },
      'giftbox_products.select': { data: [{ id: 'keep', sheet_id: 'tweexy-holder', is_active: true }, { id: 'gone', sheet_id: 'old-one', is_active: true }], error: null },
      'giftbox_products.update': { data: null, error: null },
    } });
    const r = await syncFromSheet(db, { force: true, fetchImpl: okFetch });
    expect(r).toMatchObject({ ok: true, synced: 4, shown: 2, hiddenRemoved: 1 });
    const up = db.tableCalls.find((c) => c.op === 'upsert');
    expect(up.options).toEqual({ onConflict: 'sheet_id' });
    const hide = db.tableCalls.find((c) => c.op === 'update');
    expect(hide.filters['id in']).toEqual(['gone']);
    expect(hide.payload.is_active).toBe(false);
  });

  it('only re-reads every few minutes unless forced', async () => {
    const db = mockSupabase({ tableResults: { giftbox_products: { data: [], error: null } } });
    const f = vi.fn(async () => ({ ok: true, text: async () => CSV }));
    await syncFromSheet(db, { fetchImpl: f, now: 1_000_000 });
    await syncFromSheet(db, { fetchImpl: f, now: 1_060_000 });
    expect(f).toHaveBeenCalledTimes(1);
    await syncFromSheet(db, { fetchImpl: f, now: 1_400_000 });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('a private sheet (Google sign-in page) changes nothing', async () => {
    const db = mockSupabase();
    const r = await syncFromSheet(db, { force: true, fetchImpl: async () => ({ ok: true, text: async () => '<!DOCTYPE html><html>Sign in</html>' }) });
    expect(r).toMatchObject({ ok: false, error: 'sheet_not_public' });
    expect(db.tableCalls).toHaveLength(0);
  });

  it('a network error never throws', async () => {
    const db = mockSupabase();
    const r = await syncFromSheet(db, { force: true, fetchImpl: async () => { throw new Error('down'); } });
    expect(r).toMatchObject({ ok: false, error: 'sync_failed', detail: 'down' });
  });
});
