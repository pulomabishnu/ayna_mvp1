import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { user: { id: 'u1' }, configured: true, result: { sent: 1, failed: 0, devices: 1 } };
vi.mock('./_usageLimit.js', () => ({ verifyUser: async () => (state.user ? { user: state.user } : { user: null, error: 'unauthorized' }) }));
vi.mock('./_apns.js', () => ({ apnsConfigured: () => state.configured, pushToUser: async () => state.result }));
vi.mock('./_rateLimit.js', () => ({ getClientIp: () => '1.1.1.1', rateLimit: async () => ({ ok: true }) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));

function mockRes() { const r = { statusCode: 0, body: null, headers: {} }; r.setHeader = (k, v) => { r.headers[k] = v; }; r.status = (c) => { r.statusCode = c; return r; }; r.json = (b) => { r.body = b; return r; }; return r; }

describe('/api/push-test', () => {
  beforeEach(() => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co'); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'k');
    Object.assign(state, { user: { id: 'u1' }, configured: true, result: { sent: 1, failed: 0, devices: 1 } });
  });
  const call = async (method = 'POST') => { const { default: h } = await import('./push-test.js'); const res = mockRes(); await h({ method, headers: {} }, res); return res; };

  it('sends to the signed-in user', async () => { const r = await call(); expect(r.statusCode).toBe(200); expect(r.body.ok).toBe(true); });
  it('401 when signed out', async () => { state.user = null; expect((await call()).statusCode).toBe(401); });
  it('503 when APNs is not configured', async () => { state.configured = false; expect((await call()).body.error).toBe('push_not_configured'); });
  it('404 when no device is registered', async () => { state.result = { sent: 0, failed: 0, devices: 0 }; expect((await call()).body.error).toBe('no_device_registered'); });
  it('502 when Apple rejects every device', async () => { state.result = { sent: 0, failed: 1, devices: 1 }; expect((await call()).statusCode).toBe(502); });
  it('405 for GET', async () => { expect((await call('GET')).statusCode).toBe(405); });
});
