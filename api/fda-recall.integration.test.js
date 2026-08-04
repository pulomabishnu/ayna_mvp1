/* global process */
/**
 * End-to-end test of the /api/fda-recall route handler: a real req/res pair
 * through the exported handler, with only the network stubbed.
 *
 * This is the safety-critical contract in the app — the difference between
 * "we checked and found nothing" and "we could not check" is what decides
 * whether a woman is shown a green all-clear for a recalled product.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from './fda-recall.js';

const realFetch = globalThis.fetch;

function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    send(payload) { this.body = payload; return this; },
  };
  return res;
}

const req = (query = {}) => ({ method: 'GET', query, headers: {} });

/** OpenFDA returns 404 + NOT_FOUND for a search with zero matches. */
function notFound() {
  return { ok: false, status: 404, json: async () => ({ error: { code: 'NOT_FOUND' } }) };
}
function results(rows) {
  return { ok: true, status: 200, json: async () => ({ results: rows }) };
}
function serverError(status = 500) {
  return { ok: false, status, json: async () => ({}), text: async () => 'err' };
}

beforeEach(() => { delete process.env.OPENFDA_API_KEY; });
afterEach(() => { globalThis.fetch = realFetch; vi.restoreAllMocks(); });

describe('GET /api/fda-recall', () => {
  it('400s without a product name', async () => {
    const res = mockRes();
    await handler(req({}), res);
    expect(res.statusCode).toBe(400);
  });

  it('405s on a non-GET', async () => {
    const res = mockRes();
    await handler({ method: 'POST', query: {}, headers: {} }, res);
    expect(res.statusCode).toBe(405);
  });

  it('reports status=ok / hasRecalls=false when every dataset answers empty', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(notFound());
    const res = mockRes();
    await handler(req({ name: 'Thinx Hiphugger', category: 'period-underwear' }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.hasRecalls).toBe(false);
    // Only a trustworthy answer may be cached.
    expect(res.headers['cache-control']).toContain('s-maxage');
  });

  it('reports status=failed with hasRecalls=NULL when nothing answers', async () => {
    // The core regression: this used to be 200 {hasRecalls:false}, which the
    // modal rendered as a green "No FDA Recalls Found".
    globalThis.fetch = vi.fn().mockResolvedValue(serverError(500));
    const res = mockRes();
    await handler(req({ name: 'Thinx Hiphugger', category: 'period-underwear' }), res);

    expect(res.statusCode).toBe(502);
    expect(res.body.status).toBe('failed');
    expect(res.body.hasRecalls).toBeNull();
    expect(res.body.hasRecalls).not.toBe(false);
    // Must never be cached — a blip would be pinned as a false all-clear.
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('reports status=partial when some datasets fail, and does not cache it', async () => {
    let call = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      call += 1;
      return Promise.resolve(call === 1 ? notFound() : serverError(429));
    });
    const res = mockRes();
    await handler(req({ name: 'Thinx Hiphugger', category: 'period-underwear' }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('partial');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.failedDatasets.length).toBeGreaterThan(0);
  });

  it('returns a genuine match', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      results([{
        product_description: 'Cotton Tampons, regular absorbency',
        reason_for_recall: 'Possible contamination',
        recall_number: 'Z-1234',
        report_date: '20250101',
        status: 'Ongoing',
      }])
    );
    const res = mockRes();
    await handler(req({ name: 'Cotton Tampons', category: 'tampon' }), res);

    expect(res.body.hasRecalls).toBe(true);
    expect(res.body.recalls[0].reason).toContain('contamination');
  });

  it('filters out a row that does not actually name the product', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      results([{ product_description: 'Unrelated surgical mesh', reason_for_recall: 'Sterility' }])
    );
    const res = mockRes();
    await handler(req({ name: 'Cotton Tampons', category: 'tampon' }), res);

    expect(res.body.hasRecalls).toBe(false);
    expect(res.body.status).toBe('ok');
  });

  it('queries the FOOD dataset for supplements — where supplement recalls live', async () => {
    const fetchMock = vi.fn().mockResolvedValue(notFound());
    globalThis.fetch = fetchMock;
    const res = mockRes();
    await handler(req({ name: 'Inositol', category: 'supplement' }), res);

    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes('food/enforcement'))).toBe(true);
    expect(res.body.datasetsChecked).toContain('foodEnforcement');
  });

  it('uses device datasets for period-care products', async () => {
    const fetchMock = vi.fn().mockResolvedValue(notFound());
    globalThis.fetch = fetchMock;
    await handler(req({ name: 'Saalt Cup', category: 'cup' }), mockRes());

    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes('device/recall'))).toBe(true);
    expect(urls.some((u) => u.includes('device/enforcement'))).toBe(true);
  });

  it('skips telehealth entirely rather than reporting a clean check', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    const res = mockRes();
    await handler(req({ name: 'Allara Health', category: 'telehealth' }), res);

    expect(res.body.status).toBe('skipped');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('escapes Lucene metacharacters so a quoted name cannot break the query', async () => {
    const fetchMock = vi.fn().mockResolvedValue(notFound());
    globalThis.fetch = fetchMock;
    const res = mockRes();
    // An unescaped quote used to yield a malformed query -> 400 -> "no recalls".
    await handler(req({ name: 'Ritual "Essential" Prenatal', category: 'supplement' }), res);

    expect(res.statusCode).toBe(200);
    const url = decodeURIComponent(String(fetchMock.mock.calls[0][0]));
    expect(url).toContain('\\"');
  });

  it('retries unsorted when OpenFDA rejects the sort field', async () => {
    // device/recall.json has no report_date; a 400 here must not be reported as
    // a dataset failure.
    let call = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      call += 1;
      return Promise.resolve(call === 1 ? serverError(400) : notFound());
    });
    const res = mockRes();
    await handler(req({ name: 'Saalt Cup', category: 'cup' }), res);
    expect(res.body.status).not.toBe('failed');
  });

  it('does NOT raise a live alert for a terminated recall from a decade ago', async () => {
    // drug/enforcement keeps Terminated rows back to 2012. These used to render
    // as "⚠️ FDA Recall Records Found — review carefully before purchasing".
    globalThis.fetch = vi.fn().mockResolvedValue(
      results([{
        product_description: 'Cotton Tampons, regular absorbency',
        reason_for_recall: 'Single lot, resolved',
        recall_number: 'Z-0001',
        report_date: '20130115',
        status: 'Terminated',
      }])
    );
    const res = mockRes();
    await handler(req({ name: 'Cotton Tampons', category: 'tampon' }), res);

    expect(res.body.hasRecalls).toBe(false);
    expect(res.body.hasHistoricalRecalls).toBe(true);
    expect(res.body.recalls).toHaveLength(0);
    expect(res.body.historicalRecalls).toHaveLength(1);
  });

  it('DOES raise a live alert for an ongoing recall', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      results([{
        product_description: 'Cotton Tampons, regular absorbency',
        reason_for_recall: 'Contamination',
        report_date: '20250601',
        status: 'Ongoing',
      }])
    );
    const res = mockRes();
    await handler(req({ name: 'Cotton Tampons', category: 'tampon' }), res);
    expect(res.body.hasRecalls).toBe(true);
  });

  it('still raises an alert for a RECENT terminated recall', async () => {
    // Terminated last month is still decision-relevant; only age demotes it.
    const lastMonth = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const stamp = `${lastMonth.getUTCFullYear()}${String(lastMonth.getUTCMonth() + 1).padStart(2, '0')}${String(lastMonth.getUTCDate()).padStart(2, '0')}`;
    globalThis.fetch = vi.fn().mockResolvedValue(
      results([{
        product_description: 'Cotton Tampons',
        reason_for_recall: 'Resolved recently',
        report_date: stamp,
        status: 'Terminated',
      }])
    );
    const res = mockRes();
    await handler(req({ name: 'Cotton Tampons', category: 'tampon' }), res);
    expect(res.body.hasRecalls).toBe(true);
  });

  it('treats an undated terminated recall as live rather than silently hiding it', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      results([{ product_description: 'Cotton Tampons', reason_for_recall: 'x', status: 'Terminated' }])
    );
    const res = mockRes();
    await handler(req({ name: 'Cotton Tampons', category: 'tampon' }), res);
    // No date means we cannot prove it is old — fail toward showing it.
    expect(res.body.hasRecalls).toBe(true);
  });

  it('caps an absurdly long product name', async () => {
    const fetchMock = vi.fn().mockResolvedValue(notFound());
    globalThis.fetch = fetchMock;
    await handler(req({ name: 'A'.repeat(50_000), category: 'cup' }), mockRes());
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url.length).toBeLessThan(2000);
  });

  it('takes the first value when a query param is repeated', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(notFound());
    const res = mockRes();
    await handler(req({ name: ['Thinx', 'Other'], category: 'period-underwear' }), res);
    expect(res.statusCode).toBe(200);
  });
});
