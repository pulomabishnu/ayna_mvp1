import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFakeDb } from './_healthFakeDb.test-helper.js';
import { mockRes, mockReq } from './_test-helpers.js';

const ctx = { db: null, user: { id: 'u1' } };
vi.mock('./_usageLimit.js', () => ({
  verifyUser: async () => (ctx.user ? { user: ctx.user, admin: ctx.db, error: null } : { user: null, admin: ctx.db, error: 'auth_required' }),
  getServiceClient: () => ctx.db,
}));
vi.mock('./_rateLimit.js', () => ({ rateLimit: async () => ({ ok: true }) }));

const KEY = 'a'.repeat(64);
const call = async (body, method = 'POST') => {
  const { default: handler } = await import('./health-data.js');
  const res = mockRes();
  await handler(mockReq({ method, body }), res);
  return res;
};
const day = (n) => new Date(Date.UTC(2026, 9, 1 + n)).toISOString().slice(0, 10);

describe('/api/health-data', () => {
  beforeEach(() => {
    ctx.db = createFakeDb({ health_connections: [], health_daily_metrics: [], health_data_events: [], health_imports: [], health_source_requests: [], health_oauth_tokens: [] });
    ctx.user = { id: 'u1' };
    vi.stubEnv('HEALTH_TOKEN_ENCRYPTION_KEY', KEY);
  });

  it('401 signed out, never touching data', async () => {
    ctx.user = null;
    expect((await call({ action: 'delete_all', confirm: 'DELETE' })).statusCode).toBe(401);
  });

  it('nothing is collected before she connects (consent defaults off)', async () => {
    const r = await call({ action: 'sync', source: 'apple_health', rows: [{ metric: 'sleep_minutes', day: day(1), value: 400 }] });
    expect(r.statusCode).toBe(200);
    expect(r.body.saved).toBe(0);
    expect(ctx.db.tables.health_daily_metrics).toHaveLength(0);
  });

  it('refuses a connect with no categories turned on', async () => {
    expect((await call({ action: 'connect', source: 'apple_health', categories: [], platform: 'ios' })).body.error).toBe('no_categories');
  });

  it('refuses Apple Health from the wrong platform (unsupported platform)', async () => {
    expect((await call({ action: 'connect', source: 'apple_health', categories: ['sleep'], platform: 'android' })).body.error).toBe('wrong_platform');
    expect((await call({ action: 'connect', source: 'apple_health', categories: ['sleep'] })).body.error).toBe('wrong_platform');
  });

  it('partial permissions: only consented categories are saved', async () => {
    await call({ action: 'connect', source: 'apple_health', categories: ['sleep'], platform: 'ios' });
    const r = await call({ action: 'sync', source: 'apple_health', rows: [
      { metric: 'sleep_minutes', day: day(1), value: 400 },
      { metric: 'menstrual_flow', day: day(1), value: 3 },
      { metric: 'steps', day: day(1), value: 5000 },
    ] });
    expect(r.body.saved).toBe(1);
    expect(r.body.rejected).toEqual({ category_not_consented: 2 });
    expect(ctx.db.tables.health_daily_metrics.map((m) => m.metric)).toEqual(['sleep_minutes']);
    const events = ctx.db.tables.health_data_events;
    expect(events[0]).toMatchObject({ action: 'consent_granted', categories: ['sleep'], source: 'apple_health' });
    expect(events[0].notice_version).toBeTruthy();
  });

  it('turning a category off deletes what was collected for it', async () => {
    await call({ action: 'connect', source: 'apple_health', categories: ['sleep', 'activity'], platform: 'ios' });
    await call({ action: 'sync', source: 'apple_health', rows: [{ metric: 'sleep_minutes', day: day(1), value: 400 }, { metric: 'steps', day: day(1), value: 9000 }] });
    await call({ action: 'update', source: 'apple_health', categories: ['sleep'] });
    expect(ctx.db.tables.health_daily_metrics.map((m) => m.metric)).toEqual(['sleep_minutes']);
  });

  it('paused sources save nothing', async () => {
    await call({ action: 'connect', source: 'apple_health', categories: ['sleep'], platform: 'ios' });
    await call({ action: 'pause', source: 'apple_health' });
    const r = await call({ action: 'sync', source: 'apple_health', rows: [{ metric: 'sleep_minutes', day: day(1), value: 400 }] });
    expect(r.body.saved).toBe(0);
  });

  it('disconnect only keeps data; disconnect + delete removes it', async () => {
    await call({ action: 'connect', source: 'apple_health', categories: ['sleep'], platform: 'ios' });
    await call({ action: 'sync', source: 'apple_health', rows: [{ metric: 'sleep_minutes', day: day(1), value: 400 }] });
    const only = await call({ action: 'disconnect', source: 'apple_health', deleteData: false });
    expect(only.body).toMatchObject({ ok: true, deleted: 0, systemSettingsReminder: true });
    expect(ctx.db.tables.health_daily_metrics).toHaveLength(1);
    expect(ctx.db.tables.health_connections[0]).toMatchObject({ status: 'disconnected', categories: [] });
    // After disconnecting, syncing is refused.
    expect((await call({ action: 'sync', source: 'apple_health', rows: [{ metric: 'sleep_minutes', day: day(2), value: 400 }] })).body.saved).toBe(0);
    const del = await call({ action: 'disconnect', source: 'apple_health', deleteData: true });
    expect(del.body.deleted).toBe(1);
    expect(ctx.db.tables.health_daily_metrics).toHaveLength(0);
    expect(ctx.db.tables.health_data_events.map((e) => e.action)).toContain('data_deleted');
  });

  it('delete all removes every source, revokes OAuth tokens, needs confirmation', async () => {
    await call({ action: 'connect', source: 'apple_health', categories: ['sleep'], platform: 'ios' });
    await call({ action: 'sync', source: 'apple_health', rows: [{ metric: 'sleep_minutes', day: day(1), value: 400 }] });
    ctx.db.tables.health_oauth_tokens.push({ user_id: 'u1', provider: 'oura', encrypted_access_token: 'x', encryption_iv: 'y', encryption_tag: 'z' });
    ctx.db.tables.health_connections.push({ user_id: 'u1', source: 'oura', status: 'connected', categories: ['sleep'], sync_enabled: true });
    expect((await call({ action: 'delete_all' })).body.error).toBe('confirmation_required');
    const r = await call({ action: 'delete_all', confirm: 'DELETE' });
    expect(r.body).toMatchObject({ ok: true, deleted: 1 });
    expect(ctx.db.tables.health_daily_metrics).toHaveLength(0);
    expect(ctx.db.tables.health_connections).toHaveLength(0);
    expect(ctx.db.tables.health_oauth_tokens).toHaveLength(0);
  });

  it('manual import saves only confirmed, consented, valid rows and never the file', async () => {
    const r = await call({ action: 'import', declaredApp: 'Flo', fileKind: 'json', categories: ['cycle'], rows: [
      { metric: 'menstrual_flow', day: day(1), value: 1, origin: 'flo' },
      { metric: 'sleep_minutes', day: day(1), value: 400, origin: 'flo' },
      { metric: 'menstrual_flow', day: 'not-a-day', value: 1 },
    ] });
    expect(r.body).toMatchObject({ ok: true, saved: 1 });
    expect(r.body.rejected).toEqual({ category_not_consented: 1, bad_day: 1 });
    const saved = ctx.db.tables.health_daily_metrics[0];
    expect(saved).toMatchObject({ source: 'manual_import', origin: 'flo', method: 'user_entered' });
    expect(ctx.db.tables.health_imports[0]).toMatchObject({ declared_app: 'Flo', file_kind: 'json', rows_saved: 1 });
    expect(JSON.stringify(ctx.db.tables)).not.toMatch(/base64|data:image/);
  });

  it('a malformed import is refused', async () => {
    expect((await call({ action: 'import', categories: ['cycle'], rows: 'oops' })).body.error).toBe('bad_rows');
    expect((await call({ action: 'import', categories: [], rows: [{}] })).body.error).toBe('no_categories');
  });

  it('source requests store a name and short note only', async () => {
    expect((await call({ action: 'request_source', name: '  WHOOP ', note: 'pls' })).body.ok).toBe(true);
    expect(ctx.db.tables.health_source_requests[0]).toMatchObject({ user_id: 'u1', source_name: 'WHOOP', note: 'pls' });
    expect((await call({ action: 'request_source', name: '' })).body.error).toBe('name_required');
  });

  it('GET returns only her rows', async () => {
    ctx.db.tables.health_daily_metrics.push({ user_id: 'someone-else', source: 'oura', origin: 'oura', metric: 'sleep_minutes', day: new Date().toISOString().slice(0, 10), value: 1, unit: 'min' });
    const r = await call(undefined, 'GET');
    expect(r.statusCode).toBe(200);
    expect(r.body.rows).toHaveLength(0);
  });

  it('errors never echo health values', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    ctx.db.from = () => { throw new Error('db exploded with value 412 minutes'); };
    const r = await call({ action: 'sync', source: 'apple_health', rows: [{ metric: 'sleep_minutes', day: day(1), value: 412 }] });
    expect(r.statusCode).toBe(500);
    expect(JSON.stringify(r.body)).not.toMatch(/412/);
    spy.mockRestore();
  });
});

describe('Apple Health Records consent log', () => {
  beforeEach(() => {
    ctx.db = createFakeDb({ health_connections: [], health_daily_metrics: [], health_data_events: [], health_imports: [], health_source_requests: [], health_oauth_tokens: [] });
    ctx.user = { id: 'u1' };
  });
  it('logs types and a count only, never record content', async () => {
    const { default: h } = await import('./health-data.js');
    const res = mockRes();
    await h(mockReq({ body: { action: 'records_saved', types: ['allergy', 'labs', 'allergy'], count: 3, names: ['Latex'] } }), res);
    expect(res.statusCode).toBe(200);
    const ev = ctx.db.tables.health_data_events.at(-1);
    expect(ev).toMatchObject({ source: 'apple_health_records', action: 'records_saved', categories: ['allergy'], rows_affected: 3 });
    expect(JSON.stringify(ctx.db.tables)).not.toMatch(/Latex/);
  });
  it('saving with no valid types is refused', async () => {
    const { default: h } = await import('./health-data.js');
    const res = mockRes();
    await h(mockReq({ body: { action: 'records_saved', types: ['labs'], count: 1 } }), res);
    expect(res.statusCode).toBe(400);
  });
});
