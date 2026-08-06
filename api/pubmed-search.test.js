/* global process */
import { describe, it, expect, afterEach, vi } from 'vitest';
import handler from './pubmed-search.js';
import { mockRes } from './_test-helpers.js';

const realFetch = globalThis.fetch;

function jsonOk(body) {
  return { ok: true, status: 200, json: async () => body };
}

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('pubmed-search', () => {
  it('rejects non-GET methods', async () => {
    const res = mockRes();
    await handler({ method: 'POST', query: {} }, res);
    expect(res.statusCode).toBe(405);
  });

  it('400s on a missing or too-short query', async () => {
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'ab' } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'missing_query' });
  });

  it('joins esearch ids with esummary records into article results', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonOk({ esearchresult: { idlist: ['111', '222'] } }))
      .mockResolvedValueOnce(jsonOk({
        result: {
          '111': { title: 'Menstrual cup safety', authors: [{ name: 'Smith J' }], fulljournalname: 'J Womens Health', pubdate: '2021 Jan' },
          '222': { title: 'Tampon absorbency study', authors: [{ name: 'Lee K' }], source: 'Obstet Gynecol', pubdate: '2019' },
        },
      }));
    globalThis.fetch = fetchMock;
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'menstrual cup' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.articles).toHaveLength(2);
    expect(res.body.articles[0]).toMatchObject({ pmid: '111', title: 'Menstrual cup safety', year: '2021', journal: 'J Womens Health' });
    expect(res.body.articles[1]).toMatchObject({ pmid: '222', journal: 'Obstet Gynecol' });
  });

  it('rejects a non-numeric id from esearch before it reaches the next URL', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonOk({ esearchresult: { idlist: ['123', 'DROP TABLE'] } })
    );
    globalThis.fetch = fetchMock;
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'safety' } }, res);
    // Only the valid numeric id should ever reach the esummary call.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const summaryUrl = fetchMock.mock.calls[1][0];
    expect(summaryUrl).toContain('id=123');
    expect(summaryUrl).not.toContain('DROP');
  });

  it('returns an empty list when esearch finds no ids, without calling esummary', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonOk({ esearchresult: { idlist: [] } }));
    globalThis.fetch = fetchMock;
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'nonexistent topic xyz' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.articles).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('drops an id with no matching esummary record instead of throwing', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonOk({ esearchresult: { idlist: ['999'] } }))
      .mockResolvedValueOnce(jsonOk({ result: {} }));
    globalThis.fetch = fetchMock;
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'orphan id' } }, res);
    expect(res.body.articles).toEqual([]);
  });

  it('returns an empty (200) result when esearch responds non-2xx', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'iron deficiency' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.articles).toEqual([]);
  });

  it('returns an empty (200) result when esummary responds non-2xx', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonOk({ esearchresult: { idlist: ['1'] } }))
      .mockResolvedValueOnce({ ok: false, status: 502 });
    globalThis.fetch = fetchMock;
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'pcos' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.articles).toEqual([]);
  });

  it('returns an empty (200) result, not a crash, on a network failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNRESET'));
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'endometriosis' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.articles).toEqual([]);
  });

  it('appends the NCBI api key to both requests when configured', async () => {
    process.env.NCBI_API_KEY = 'test-key';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonOk({ esearchresult: { idlist: ['1'] } }))
      .mockResolvedValueOnce(jsonOk({ result: { '1': { title: 'x' } } }));
    globalThis.fetch = fetchMock;
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'fibroids' } }, res);
    expect(fetchMock.mock.calls[0][0]).toContain('api_key=test-key');
    expect(fetchMock.mock.calls[1][0]).toContain('api_key=test-key');
    delete process.env.NCBI_API_KEY;
    void res;
  });
});
