import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockReq, mockRes, mockSupabase } from './_test-helpers.js';

vi.mock('./_usageLimit.js', () => ({ verifyUser: vi.fn() }));
const { verifyUser } = await import('./_usageLimit.js');
const { default: adminHandler } = await import('./campaign-admin.js');
const { default: notifyHandler } = await import('./campaign-notify.js');

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('ADMIN_EMAILS', 'team@aynahealth.co');
  vi.stubEnv('CRON_SECRET', 'cron-secret');
  vi.stubEnv('CAMPAIGN_EMAILS_ENABLED', '');
});

describe('api/campaign-admin', () => {
  it('403 for a signed-in non-admin', async () => {
    verifyUser.mockResolvedValue({ user: { id: 'u', email: 'someone@example.com' }, error: null, admin: mockSupabase() });
    const res = mockRes();
    await adminHandler(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(403);
  });

  it('403 for everyone when ADMIN_EMAILS is not set', async () => {
    vi.stubEnv('ADMIN_EMAILS', '');
    verifyUser.mockResolvedValue({ user: { id: 'u', email: 'team@aynahealth.co' }, error: null, admin: mockSupabase() });
    const res = mockRes();
    await adminHandler(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(403);
  });

  it('returns the overview for an admin', async () => {
    const admin = mockSupabase({ rpcResults: { campaign_admin_overview: { data: { campaign: { id: 'free-product-2026' }, people: [], inventory: [] }, error: null } } });
    verifyUser.mockResolvedValue({ user: { id: 'u', email: 'Team@aynahealth.co' }, error: null, admin });
    const res = mockRes();
    await adminHandler(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.campaign.id).toBe('free-product-2026');
  });

  it('rejects an unknown fulfillment status', async () => {
    verifyUser.mockResolvedValue({ user: { id: 'u', email: 'team@aynahealth.co' }, error: null, admin: mockSupabase() });
    const res = mockRes();
    await adminHandler(mockReq({ body: { action: 'fulfillment', claimId: '11111111-2222-4333-8444-555555555555', status: 'lost' } }), res);
    expect(res.statusCode).toBe(400);
  });
});

describe('api/campaign-notify (cron)', () => {
  it('401 without the cron secret', async () => {
    const res = mockRes();
    await notifyHandler({ headers: {} }, res);
    expect(res.statusCode).toBe(401);
  });
});
