import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockReq, mockRes } from './_test-helpers.js';
import { createFakeDb } from './_healthFakeDb.test-helper.js';
const ctx = vi.hoisted(() => ({ enabled: true, active: false, db: null }));
vi.mock('./_proFeatures.js', () => ({ proFeatureRules: async () => ({ enabled: ctx.enabled }) }));
vi.mock('./_entitlement.js', () => ({ hasPremiumAccess: async () => ctx.active }));
vi.mock('./_usageLimit.js', () => ({ verifyUser: async () => ({ user: { id: 'u1' }, admin: ctx.db }), getServiceClient: () => ctx.db }));
vi.mock('./_rateLimit.js', () => ({ rateLimit: async () => ({ ok: true }) }));
import handler from './health-data.js';
import { hasHealthAccess } from './_healthAccess.js';
const call = async (body, method = 'POST') => { const res = mockRes(); await handler(mockReq({ body, method }), res); return res; };
beforeEach(() => {
  ctx.enabled = true; ctx.active = false;
  ctx.db = createFakeDb({ health_connections: [], health_daily_metrics: [], health_data_events: [], health_imports: [], health_source_requests: [], health_oauth_tokens: [] });
});
describe('health Pro boundary', () => {
  it('locks nonmembers and unlocks active paid or granted access', async () => {
    expect(await hasHealthAccess({ id: 'u1' }, ctx.db)).toBe(false);
    ctx.active = true;
    expect(await hasHealthAccess({ id: 'u1' }, ctx.db)).toBe(true);
    ctx.active = false; // paid term has ended
    expect(await hasHealthAccess({ id: 'u1' }, ctx.db)).toBe(false);
  });
  it('preserves the administrator rollout switch', async () => {
    ctx.enabled = false;
    expect(await hasHealthAccess({ id: 'u1' }, ctx.db)).toBe(true);
  });
  it.each(['connect', 'sync', 'resume'])('blocks %s before creating or changing a connection', async action => {
    const res = await call({ action, source: 'apple_health', categories: ['sleep'], platform: 'ios' });
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('pro_required');
    expect(ctx.db.tables.health_connections).toHaveLength(0);
  });
  it('withholds dashboard metrics but retains connection management and stored data', async () => {
    ctx.db.tables.health_daily_metrics.push({ user_id: 'u1', source: 'apple_health', metric: 'steps', day: '2026-10-27', value: 100 });
    const res = await call({}, 'GET');
    expect(res.statusCode).toBe(200);
    expect(res.body.rows).toEqual([]);
    expect(ctx.db.tables.health_daily_metrics).toHaveLength(1);
  });
});
