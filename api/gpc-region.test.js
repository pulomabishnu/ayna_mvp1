/* global process */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './gpc-region.js';

function mockReqRes({ method = 'GET', headers = {} } = {}) {
  const req = { method, headers, socket: { remoteAddress: '127.0.0.1' } };
  const res = {
    statusCode: null,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end() { return this; },
  };
  return { req, res };
}

describe('GET /api/gpc-region', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('rejects non-GET methods', async () => {
    const { req, res } = mockReqRes({ method: 'POST' });
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it('answers the CORS preflight', async () => {
    const { req, res } = mockReqRes({ method: 'OPTIONS' });
    await handler(req, res);
    expect(res.statusCode).toBe(204);
  });

  it('is never cached by a shared/CDN cache', async () => {
    const { req, res } = mockReqRes({ headers: { 'x-vercel-ip-country': 'US', 'x-vercel-ip-country-region': 'NY' } });
    await handler(req, res);
    expect(res.headers['Cache-Control']).toMatch(/no-store/);
  });

  it('reports mandatory: true for a listed state', async () => {
    const { req, res } = mockReqRes({ headers: { 'x-vercel-ip-country': 'US', 'x-vercel-ip-country-region': 'CA' } });
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ mandatory: true });
  });

  it('reports mandatory: false for a US state not on the list', async () => {
    const { req, res } = mockReqRes({ headers: { 'x-vercel-ip-country': 'US', 'x-vercel-ip-country-region': 'VA' } });
    await handler(req, res);
    expect(res.body).toEqual({ mandatory: false });
  });

  it('reports mandatory: false for a non-US visitor', async () => {
    const { req, res } = mockReqRes({ headers: { 'x-vercel-ip-country': 'GB' } });
    await handler(req, res);
    expect(res.body).toEqual({ mandatory: false });
  });

  it('fails closed (mandatory: true) when no geolocation headers are present at all', async () => {
    const { req, res } = mockReqRes({ headers: {} });
    await handler(req, res);
    expect(res.body).toEqual({ mandatory: true });
  });
});
