import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { configured: true, tokens: [], off: [], deleted: [], results: null };
const sendPush = vi.fn(async (tokens) => state.results || tokens.map((t) => ({ deviceToken: t, ok: true, status: 200, reason: '' })));
vi.mock('./_apns.js', () => ({ apnsConfigured: () => state.configured, sendPush: (...a) => sendPush(...a), DEAD_TOKEN_REASONS: new Set(['BadDeviceToken', 'Unregistered']) }));
vi.mock('./_rateLimit.js', () => ({ getClientIp: () => '1.1.1.1', rateLimit: async () => ({ ok: true }) }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table) => ({
      select: () => ({ eq: async () => ({ data: table === 'device_tokens' ? state.tokens : state.off, error: null }) }),
      delete: () => ({ in: async (_c, ids) => { state.deleted.push(...ids); return { error: null }; } }),
    }),
  }),
}));

function mockRes() { const r = { statusCode: 0, body: '', headers: {} }; r.setHeader = (k, v) => { r.headers[k] = v; }; r.status = (c) => { r.statusCode = c; return r; }; r.send = (b) => { r.body = b; return r; }; return r; }
const call = async (method, body) => { const { default: h } = await import('./push-broadcast.js'); const res = mockRes(); await h({ method, headers: {}, body }, res); return res; };

describe('/api/push-broadcast', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_PUSH_SECRET', 's3cret'); vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co'); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'k');
    Object.assign(state, { configured: true, tokens: [{ device_token: 'a', user_id: 'u1' }, { device_token: 'b', user_id: 'u2' }, { device_token: 'c', user_id: 'u3' }], off: [{ user_id: 'u3' }], deleted: [], results: null });
    sendPush.mockClear();
  });

  it('GET shows the form', async () => { const r = await call('GET'); expect(r.statusCode).toBe(200); expect(r.body).toContain('Send a notification'); });
  it('rejects a wrong password without sending', async () => {
    const r = await call('POST', { title: 'Hi', body: 'There', password: 'nope', action: 'send' });
    expect(r.statusCode).toBe(401); expect(sendPush).not.toHaveBeenCalled();
  });
  it('preview counts phones and skips people who turned notifications off', async () => {
    const r = await call('POST', 'title=Hi&body=There&password=s3cret&action=preview');
    expect(r.body).toContain('2 phones'); expect(sendPush).not.toHaveBeenCalled();
  });
  it('send pushes to opted-in phones only and escapes input', async () => {
    const r = await call('POST', { title: '<b>New</b>', body: 'Brands added', password: 's3cret', action: 'send' });
    expect(sendPush).toHaveBeenCalledTimes(1);
    expect(sendPush.mock.calls[0][0].sort()).toEqual(['a', 'b']);
    expect(sendPush.mock.calls[0][1]).toMatchObject({ title: '<b>New</b>', body: 'Brands added' });
    expect(r.body).toContain('Sent to 2 phones');
  });
  it('removes dead device tokens', async () => {
    state.results = [{ deviceToken: 'a', ok: true, status: 200, reason: '' }, { deviceToken: 'b', ok: false, status: 410, reason: 'Unregistered' }];
    const r = await call('POST', { title: 'Hi', body: 'There', password: 's3cret', action: 'send' });
    expect(state.deleted).toEqual(['b']); expect(r.body).toContain('1 couldn&#39;t be reached');
  });
  it('explains when push is not configured', async () => {
    state.configured = false;
    const r = await call('POST', { title: 'Hi', body: 'There', password: 's3cret', action: 'send' });
    expect(r.statusCode).toBe(503); expect(r.body).toContain('APNS_KEY_P8');
  });
  it('explains when the admin password is not set', async () => {
    vi.stubEnv('ADMIN_PUSH_SECRET', '');
    const r = await call('POST', { title: 'Hi', body: 'There', password: 'x', action: 'send' });
    expect(r.body).toContain('ADMIN_PUSH_SECRET');
  });
});

describe('/api/push-broadcast failure reasons', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_PUSH_SECRET', 's3cret'); vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co'); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'k');
    Object.assign(state, { configured: true, tokens: [{ device_token: 'a', user_id: 'u1' }], off: [], deleted: [] });
  });
  it('shows Apple\'s reason and a fix', async () => {
    state.results = [{ deviceToken: 'a', ok: false, status: 403, reason: 'InvalidProviderToken' }];
    const r = await call('POST', { title: 'Hi', body: 'There', password: 's3cret', action: 'send' });
    expect(r.body).toContain('InvalidProviderToken'); expect(r.body).toContain('APNS_KEY_ID');
  });
});
