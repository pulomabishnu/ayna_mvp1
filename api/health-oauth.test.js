import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFakeDb } from './_healthFakeDb.test-helper.js';
import { mockRes, mockReq } from './_test-helpers.js';
import { ouraRows, ouraSleepRows } from '../src/health/providers/oura.js';

const ctx = { db: null, user: { id: 'u1' } };
vi.mock('./_usageLimit.js', () => ({
  verifyUser: async () => (ctx.user ? { user: ctx.user, admin: ctx.db, error: null } : { user: null, admin: ctx.db, error: 'auth_required' }),
  getServiceClient: () => ctx.db,
}));
vi.mock('./_rateLimit.js', () => ({ rateLimit: async () => ({ ok: true }) }));

const KEY = 'b'.repeat(64);
const start = async (body) => { const { default: h } = await import('./health-oauth.js'); const res = mockRes(); await h(mockReq({ body: { action: 'start', provider: 'oura', categories: ['sleep'], ...body } }), res); return res; };
const callback = async (query) => { const { default: h } = await import('./health-oauth-callback.js'); const res = mockRes(); await h({ method: 'GET', query, headers: {} }, res); return res; };

function okJson(body, status = 200) { return { ok: status < 400, status, json: async () => body }; }

describe('health OAuth (Oura)', () => {
  let fetchMock;
  beforeEach(() => {
    ctx.db = createFakeDb({ health_connections: [], health_daily_metrics: [], health_data_events: [], health_oauth_tokens: [], health_oauth_states: [] });
    ctx.user = { id: 'u1' };
    vi.stubEnv('HEALTH_TOKEN_ENCRYPTION_KEY', KEY);
    vi.stubEnv('OURA_CLIENT_ID', 'cid');
    vi.stubEnv('OURA_CLIENT_SECRET', 'secret');
    fetchMock = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('/oauth/token')) return okJson({ access_token: 'AT', refresh_token: 'RT', expires_in: 86400, scope: 'daily workout' });
      if (u.includes('/oauth/revoke')) return okJson({});
      if (u.includes('/v2/usercollection/sleep')) return okJson({ data: [{ day: '2026-10-10', type: 'long_sleep', total_sleep_duration: 25200, deep_sleep_duration: 3600, rem_sleep_duration: 5400, lowest_heart_rate: 52, average_hrv: 48 }] });
      if (u.includes('/v2/usercollection/daily_readiness')) return okJson({ data: [{ day: '2026-10-10', score: 80, temperature_deviation: 0.2 }] });
      return okJson({ data: [] });
    });
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('missing credentials: refuses to start instead of faking a connection', async () => {
    vi.stubEnv('OURA_CLIENT_ID', '');
    const r = await start();
    expect(r.statusCode).toBe(503);
    expect(r.body.error).toBe('provider_not_configured');
    expect(ctx.db.tables.health_oauth_states).toHaveLength(0);
  });

  it('start asks only for the scopes ayna uses and stores a one-time state', async () => {
    const r = await start({ categories: ['sleep', 'cycle', 'location'] });
    const url = new URL(r.body.url);
    expect(url.searchParams.get('scope')).toBe('daily workout');
    expect(url.searchParams.get('scope')).not.toMatch(/email|personal|heartrate|spo2|tag/);
    const state = ctx.db.tables.health_oauth_states[0];
    expect(url.searchParams.get('state')).toBe(state.nonce);
    expect(state.nonce.length).toBeGreaterThanOrEqual(40);
    expect(state.categories).toEqual(['sleep']); // cycle isn't an Oura category; junk dropped
  });

  it('refuses an open redirect in the return path', async () => {
    await start({ returnPath: '//evil.example/x' });
    expect(ctx.db.tables.health_oauth_states[0].return_path).toBe('/');
  });

  it('CSRF: an unknown state is refused and nothing is exchanged', async () => {
    const r = await callback({ state: 'x'.repeat(43), code: 'c' });
    expect(r.headers.location).toMatch(/status=invalid_state/);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(ctx.db.tables.health_connections).toHaveLength(0);
  });

  it('a valid callback exchanges the code, records consent, syncs, and the state cannot be reused', async () => {
    const { body } = await start({ returnPath: '/mobile-preview' });
    const nonce = new URL(body.url).searchParams.get('state');
    const r = await callback({ state: nonce, code: 'good' });
    expect(r.statusCode).toBe(302);
    expect(r.headers.location).toBe('/mobile-preview?health_source=oura&status=connected'.replace('status', 'health_status'));
    const tok = ctx.db.tables.health_oauth_tokens[0];
    expect(tok.encrypted_access_token).not.toContain('AT');
    expect(JSON.stringify(tok)).not.toMatch(/"AT"|"RT"/);
    expect(ctx.db.tables.health_connections[0]).toMatchObject({ source: 'oura', categories: ['sleep'] });
    expect(ctx.db.tables.health_data_events[0].action).toBe('consent_granted');
    // Only sleep was consented: readiness and temperature from Oura are dropped.
    const metrics = ctx.db.tables.health_daily_metrics.map((m) => m.metric).sort();
    expect(metrics).toEqual(['sleep_deep_minutes', 'sleep_minutes', 'sleep_rem_minutes']);
    const replay = await callback({ state: nonce, code: 'good' });
    expect(replay.headers.location).toMatch(/status=invalid_state/);
  });

  it('an expired state is refused', async () => {
    const { body } = await start();
    const nonce = new URL(body.url).searchParams.get('state');
    ctx.db.tables.health_oauth_states[0].expires_at = new Date(Date.now() - 1000).toISOString();
    expect((await callback({ state: nonce, code: 'c' })).headers.location).toMatch(/status=expired/);
  });

  it('she declined at Oura: nothing connected', async () => {
    const { body } = await start();
    const nonce = new URL(body.url).searchParams.get('state');
    const r = await callback({ state: nonce, error: 'access_denied' });
    expect(r.headers.location).toMatch(/status=declined/);
    expect(ctx.db.tables.health_connections).toHaveLength(0);
  });

  it('app returns go to the app URL scheme', async () => {
    const { body } = await start({ returnTo: 'app' });
    const nonce = new URL(body.url).searchParams.get('state');
    expect((await callback({ state: nonce, code: 'c' })).headers.location).toBe('co.aynahealth.app://health-connected?source=oura&status=connected');
  });

  it('expired/revoked tokens mark the connection as needing reconnection', async () => {
    const { body } = await start();
    await callback({ state: new URL(body.url).searchParams.get('state'), code: 'c' });
    fetchMock.mockImplementation(async (url) => (String(url).includes('/v2/usercollection/') ? okJson({}, 401) : okJson({})));
    const { default: h } = await import('./health-oauth.js');
    const res = mockRes();
    await h(mockReq({ body: { action: 'sync', provider: 'oura' } }), res);
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('needs_reauth');
    expect(ctx.db.tables.health_connections[0].status).toBe('needs_reauth');
  });

  it('a failed sync is recorded as a code, not a provider message', async () => {
    const { body } = await start();
    await callback({ state: new URL(body.url).searchParams.get('state'), code: 'c' });
    fetchMock.mockImplementation(async () => okJson({ detail: 'server on fire with 412 bpm' }, 500));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { default: h } = await import('./health-oauth.js');
    const res = mockRes();
    await h(mockReq({ body: { action: 'sync', provider: 'oura' } }), res);
    expect(res.statusCode).toBe(502);
    expect(ctx.db.tables.health_connections[0]).toMatchObject({ status: 'error', last_error_code: 'sync_failed' });
    expect(spy.mock.calls.flat().join(' ')).not.toMatch(/412/);
    spy.mockRestore();
  });

  it('disconnect revokes at Oura and deletes the tokens', async () => {
    const { body } = await start();
    await callback({ state: new URL(body.url).searchParams.get('state'), code: 'c' });
    const { default: h } = await import('./health-data.js');
    const res = mockRes();
    await h(mockReq({ body: { action: 'disconnect', source: 'oura', deleteData: true } }), res);
    expect(res.body).toMatchObject({ ok: true, revoked: true });
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('/oauth/revoke'))).toBe(true);
    expect(ctx.db.tables.health_oauth_tokens).toHaveLength(0);
    expect(ctx.db.tables.health_daily_metrics).toHaveLength(0);
  });
});

describe('Oura normalization', () => {
  it('uses the main sleep for resting HR and HRV, sums sleep, ignores naps', () => {
    const rows = ouraSleepRows([
      { day: '2026-10-10', type: 'long_sleep', total_sleep_duration: 21600, lowest_heart_rate: 50, average_hrv: 40 },
      { day: '2026-10-10', type: 'late_nap', total_sleep_duration: 1800, lowest_heart_rate: 70 },
    ]);
    expect(rows.find((r) => r.metric === 'sleep_minutes').value).toBe(360);
    expect(rows.find((r) => r.metric === 'resting_hr_bpm').value).toBe(50);
    expect(rows.every((r) => r.origin === 'oura')).toBe(true);
  });
  it('handles empty and malformed payloads', () => {
    expect(ouraRows({})).toEqual([]);
    expect(ouraRows({ sleep: [null, { type: 'long_sleep' }], workout: [{ day: '2026-10-10', start_datetime: 'x', end_datetime: 'y' }] })).toEqual([
      { metric: 'workout_minutes', day: '2026-10-10', value: 0, origin: 'oura', method: 'observed' },
      { metric: 'workout_count', day: '2026-10-10', value: 1, origin: 'oura', method: 'observed' },
    ]);
  });
});

const whoopSleep = { id: 's1', nap: false, score_state: 'SCORED', end: '2026-10-11T12:30:00.000Z', timezone_offset: '-05:00', score: { stage_summary: { total_light_sleep_time_milli: 14400000, total_slow_wave_sleep_time_milli: 5400000, total_rem_sleep_time_milli: 5400000 } } };
const whoopRecovery = { sleep_id: 's1', score_state: 'SCORED', created_at: '2026-10-11T13:00:00.000Z', score: { user_calibrating: false, recovery_score: 66, resting_heart_rate: 54, hrv_rmssd_milli: 41.7, skin_temp_celsius: 33.4 } };

describe('health OAuth (WHOOP, live only)', () => {
  let fetchMock;
  beforeEach(() => {
    ctx.db = createFakeDb({ health_connections: [], health_daily_metrics: [], health_data_events: [], health_oauth_tokens: [], health_oauth_states: [] });
    ctx.user = { id: 'u1' };
    vi.stubEnv('HEALTH_TOKEN_ENCRYPTION_KEY', KEY);
    vi.stubEnv('WHOOP_CLIENT_ID', 'wid');
    vi.stubEnv('WHOOP_CLIENT_SECRET', 'wsecret');
    fetchMock = vi.fn(async (url, init = {}) => {
      const u = String(url);
      if (u.includes('/oauth/oauth2/token')) return okJson({ access_token: 'WAT', refresh_token: 'WRT', expires_in: 3600, scope: 'read:sleep read:recovery read:workout offline' });
      if (u.includes('/v2/user/access') && init.method === 'DELETE') return { ok: true, status: 204, json: async () => ({}) };
      if (u.includes('/v2/activity/sleep')) return okJson({ records: [whoopSleep], next_token: null });
      if (u.includes('/v2/recovery')) return okJson({ records: [whoopRecovery] });
      return okJson({ records: [] });
    });
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  const connectWhoop = async (categories = ['sleep', 'heart']) => {
    const r = await start({ provider: 'whoop', categories });
    const url = new URL(r.body.url);
    const back = await callback({ state: url.searchParams.get('state'), code: 'good' });
    return { url, back };
  };

  it('start uses an 8-character state and only the scopes ayna reads', async () => {
    const r = await start({ provider: 'whoop', categories: ['sleep'] });
    const url = new URL(r.body.url);
    expect(url.origin + url.pathname).toBe('https://api.prod.whoop.com/oauth/oauth2/auth');
    expect(url.searchParams.get('state')).toHaveLength(8);
    expect(url.searchParams.get('scope')).toBe('read:sleep read:recovery read:workout offline');
    expect(url.searchParams.get('scope')).not.toMatch(/profile|body_measurement|cycles/);
  });

  it('connecting stores tokens and consent but never WHOOP data', async () => {
    const { back } = await connectWhoop();
    expect(back.headers.location).toMatch(/health_source=whoop&health_status=connected/);
    expect(ctx.db.tables.health_connections[0]).toMatchObject({ source: 'whoop', categories: ['sleep', 'heart'] });
    expect(ctx.db.tables.health_oauth_tokens).toHaveLength(1);
    expect(ctx.db.tables.health_daily_metrics).toHaveLength(0);
  });

  it('live returns consented rows and saves nothing', async () => {
    await connectWhoop(['sleep']);
    const { default: h } = await import('./health-oauth.js');
    const res = mockRes();
    await h(mockReq({ body: { action: 'live', provider: 'whoop' } }), res);
    expect(res.statusCode).toBe(200);
    const metrics = res.body.rows.map((r) => r.metric).sort();
    expect(metrics).toEqual(['sleep_deep_minutes', 'sleep_minutes', 'sleep_rem_minutes']); // heart not consented
    expect(res.body.rows.find((r) => r.metric === 'sleep_minutes')).toMatchObject({ day: '2026-10-11', value: 420, source: 'whoop' });
    expect(ctx.db.tables.health_daily_metrics).toHaveLength(0);
    expect(ctx.db.tables.health_connections[0].last_synced_at).toBeTruthy();
  });

  it('sync on WHOOP does not store either', async () => {
    await connectWhoop();
    const { default: h } = await import('./health-oauth.js');
    const res = mockRes();
    await h(mockReq({ body: { action: 'sync', provider: 'whoop' } }), res);
    expect(res.body).toMatchObject({ ok: true, saved: 0 });
    expect(ctx.db.tables.health_daily_metrics).toHaveLength(0);
  });

  it('live is refused for providers whose data is stored', async () => {
    vi.stubEnv('OURA_CLIENT_ID', 'cid');
    vi.stubEnv('OURA_CLIENT_SECRET', 'secret');
    const { default: h } = await import('./health-oauth.js');
    const res = mockRes();
    await h(mockReq({ body: { action: 'live', provider: 'oura' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('disconnect revokes access at WHOOP and deletes the tokens', async () => {
    await connectWhoop();
    const { default: h } = await import('./health-data.js');
    const res = mockRes();
    await h(mockReq({ body: { action: 'disconnect', source: 'whoop', deleteData: true } }), res);
    expect(res.body).toMatchObject({ ok: true, revoked: true });
    expect(fetchMock.mock.calls.some(([u, i]) => String(u).endsWith('/developer/v2/user/access') && i?.method === 'DELETE')).toBe(true);
    expect(ctx.db.tables.health_oauth_tokens).toHaveLength(0);
  });
});
