import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockRes, mockReq } from './_test-helpers.js';

const calls = vi.hoisted(() => ({ anthropic: [] }));
vi.mock('./_usageLimit.js', () => ({ verifyUser: async () => ({ user: { id: 'u1' }, admin: {}, error: null }) }));
vi.mock('./_rateLimit.js', () => ({ rateLimit: async () => ({ ok: true }) }));
vi.mock('./_llm.js', async (orig) => {
  const real = await orig();
  return { ...real, callAnthropic: vi.fn(async (args) => { calls.anthropic.push(args); return { text: '{"values":[{"metric":"sleep_minutes","day":"today","value":392},{"metric":"resting_hr_bpm","day":"2026-10-10","value":68},{"metric":"blood_glucose","day":"2026-10-10","value":5},{"metric":"steps","day":"2099-01-01","value":10}]}' }; }) };
});

const { default: handler, candidatesFromModel } = await import('./health-extract.js');
const run = async (req) => { const res = mockRes(); await handler(req, res); return res; };

describe('/api/health-extract (screenshots)', () => {
  beforeEach(() => { calls.anthropic.length = 0; vi.unstubAllEnvs(); });

  it('is off by default and says so; nothing is sent anywhere', async () => {
    expect((await run(mockReq({ method: 'GET' }))).body).toEqual({ enabled: false });
    const r = await run(mockReq({ body: { mediaType: 'image/png', data: 'AAAA' } }));
    expect(r.body.error).toBe('extraction_disabled');
    expect(calls.anthropic).toHaveLength(0);
  });

  it('when switched on: returns candidates only, drops unknown/future values, redacts the trace', async () => {
    vi.stubEnv('HEALTH_IMAGE_EXTRACTION', 'anthropic');
    const r = await run(mockReq({ body: { mediaType: 'image/png', data: 'iVBORw0KGgo=' } }));
    expect(r.statusCode).toBe(200);
    expect(r.body.candidates.map((c) => c.metric)).toEqual(['sleep_minutes', 'resting_hr_bpm']);
    expect(calls.anthropic[0].trace).toMatchObject({ redact: true });
    expect(JSON.stringify(calls.anthropic[0].trace.messages)).not.toMatch(/iVBOR/);
  });

  it('rejects non-images', async () => {
    vi.stubEnv('HEALTH_IMAGE_EXTRACTION', 'anthropic');
    expect((await run(mockReq({ body: { mediaType: 'text/html', data: 'PGh0bWw+' } }))).body.error).toBe('bad_image');
  });

  it('parser mistakes are caught: garbage output yields nothing', () => {
    expect(candidatesFromModel('not json at all')).toEqual([]);
    expect(candidatesFromModel('{"values":[{"metric":"sleep_minutes","day":"2026-10-01","value":99999}]}')).toEqual([]);
  });
});
