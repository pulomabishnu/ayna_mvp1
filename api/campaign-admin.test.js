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

  it('the campaign team (CAMPAIGN_TEAM_EMAIL) can open it too', async () => {
    const { isAdminEmail } = await import('./_campaign.js');
    vi.stubEnv('ADMIN_EMAILS', 'team@aynahealth.co');
    vi.stubEnv('CAMPAIGN_TEAM_EMAIL', 'a@aynahealth.co, B@aynahealth.co');
    expect(isAdminEmail('b@aynahealth.co')).toBe(true);
    expect(isAdminEmail('team@aynahealth.co')).toBe(true);
    expect(isAdminEmail('x@aynahealth.co')).toBe(false);
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

describe('api/campaign-admin add_product', () => {
  const asAdmin = (admin) => verifyUser.mockResolvedValue({ user: { id: 'u', email: 'team@aynahealth.co' }, error: null, admin });

  it('adds a reward-only item with only https links and no catalog id', async () => {
    const admin = mockSupabase({ tableResults: { 'reward_products.insert': { data: null, error: null } } });
    asAdmin(admin);
    const res = mockRes();
    await adminHandler(mockReq({ body: { action: 'add_product', brand: ' Kieró ', name: 'Moisturizing  Barrier Cream', size: '1.76 oz (50 g)', inventoryTotal: 2, imageUrl: 'javascript:alert(1)', productUrl: 'https://example.com/p' } }), res);
    expect(res.statusCode).toBe(200);
    const insert = admin.tableCalls.find((c) => c.table === 'reward_products' && c.op === 'insert').payload;
    expect(insert).toMatchObject({ brand: 'Kieró', name: 'Moisturizing Barrier Cream', size: '1.76 oz (50 g)', inventory_total: 2, image_url: null, product_url: 'https://example.com/p' });
    expect(insert.product_id).toBeUndefined();
  });

  it('needs a brand and a name', async () => {
    asAdmin(mockSupabase());
    const res = mockRes();
    await adminHandler(mockReq({ body: { action: 'add_product', name: 'x', inventoryTotal: 1 } }), res);
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
