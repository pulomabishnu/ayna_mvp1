import { describe, it, expect, vi, afterEach } from 'vitest';
import { airtableRecordToRow, rowToClientStartup, CATEGORY_MAP } from './_airtableStartups.js';

function mockRes() {
  const res = { statusCode: 0, body: null, headers: {} };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

const RECORD = {
  id: 'recABC',
  fields: {
    'Startup Name': 'Clair Health',
    'One-Liner': 'Hormone wearable',
    Category: 'Hormonal Health',
    Stage: 'Seed',
    'Website URL': 'https://example.com',
    Tags: ['Women-founded'],
    Featured: true,
  },
};

describe('airtable startup mapping', () => {
  it('maps an Airtable record to the client shape without inventing fields', () => {
    const s = rowToClientStartup(airtableRecordToRow(RECORD));
    expect(s).toMatchObject({
      id: 'clair-health', name: 'Clair Health', tagline: 'Hormone wearable',
      category: CATEGORY_MAP['Hormonal Health'], stage: 'Seed', url: 'https://example.com',
      featured: true, productReleased: false, image: null, waitlistUrl: null,
    });
  });
});

describe('/api/startups', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

  it('returns live Airtable startups when configured', async () => {
    vi.stubEnv('AIRTABLE_API_KEY', 'k');
    vi.stubEnv('AIRTABLE_BASE_ID', 'b');
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ records: [RECORD, { id: 'recEmpty', fields: {} }] }) }));
    vi.stubGlobal('fetch', fetchMock);
    const { default: handler } = await import('./startups.js');
    const res = mockRes();
    await handler({ method: 'GET' }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.source).toBe('airtable');
    expect(res.body.startups.map((s) => s.name)).toEqual(['Clair Health']);
    expect(String(fetchMock.mock.calls[0][0])).toContain("Status");
  });

  it('503s with an empty list when nothing is configured', async () => {
    vi.stubEnv('AIRTABLE_API_KEY', '');
    vi.stubEnv('AIRTABLE_BASE_ID', '');
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    vi.stubEnv('SUPABASE_ANON_KEY', '');
    const { default: handler } = await import('./startups.js');
    const res = mockRes();
    await handler({ method: 'GET' }, res);
    expect(res.statusCode).toBe(503);
    expect(res.body.startups).toEqual([]);
  });

  it('rejects non-GET', async () => {
    const { default: handler } = await import('./startups.js');
    const res = mockRes();
    await handler({ method: 'POST' }, res);
    expect(res.statusCode).toBe(405);
  });
});
