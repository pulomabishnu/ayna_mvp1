import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockRes } from './_test-helpers.js';

const safeFetch = vi.fn();
vi.mock('./_ssrfSafeFetch.js', () => ({ isSafePublicUrl: vi.fn(async () => true), safeFetch: (...a) => safeFetch(...a) }));
vi.mock('./_rateLimit.js', () => ({ rateLimit: vi.fn(async () => ({ ok: true })), getClientIp: () => '1.2.3.4' }));
const { default: handler, PROXIED_IMAGE_CSP } = await import('./image-proxy.js');

const req = (headers = {}) => ({ method: 'GET', query: { url: 'https://evil.example/x.svg' }, headers });

beforeEach(() => safeFetch.mockReset());

describe('api/image-proxy', () => {
  it('does not act as an open redirect for a page navigation', async () => {
    safeFetch.mockResolvedValue({ ok: false });
    const res = mockRes();
    await handler(req({ 'sec-fetch-dest': 'document', 'sec-fetch-mode': 'navigate' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.headers.location).toBeUndefined();
  });

  it('still falls back to the original for an <img> load', async () => {
    safeFetch.mockResolvedValue({ ok: false });
    const res = mockRes();
    await handler(req({ 'sec-fetch-dest': 'image' }), res);
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('https://evil.example/x.svg');
  });

  it('serves proxied bytes with a sandboxing CSP so an SVG cannot run script on our origin', async () => {
    const body = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    safeFetch.mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'image/svg+xml' }), arrayBuffer: async () => body.buffer });
    const res = mockRes();
    await handler(req({ 'sec-fetch-dest': 'image' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-security-policy']).toBe(PROXIED_IMAGE_CSP);
    expect(PROXIED_IMAGE_CSP).toContain('sandbox');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  // Nov 14: the iPhone app runs on capacitor://localhost; 'same-origin' made WebKit block every proxied
  // photo there ("a lot of missing pics"). Checked on the live site: blocked from another origin.
  it('lets the app (another origin) show proxied photos', async () => {
    const body = new Uint8Array([0xff, 0xd8, 0xff]);
    safeFetch.mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'image/jpeg' }), arrayBuffer: async () => body.buffer });
    const res = mockRes();
    await handler(req({ 'sec-fetch-dest': 'image' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });
});
