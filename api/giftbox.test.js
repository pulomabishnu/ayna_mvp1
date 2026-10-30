import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockReq, mockRes, mockSupabase } from './_test-helpers.js';

vi.mock('./_usageLimit.js', () => ({ verifyUser: vi.fn() }));
vi.mock('./_campaign.js', async (orig) => ({ ...(await orig()), getServiceClient: vi.fn() }));
const { verifyUser } = await import('./_usageLimit.js');
const { getServiceClient } = await import('./_campaign.js');
const { default: shop } = await import('./giftbox.js');
const { default: adminHandler, newToken } = await import('./giftbox-admin.js');
const { parseCart, parseShipping, safeUrl, teamOrderEmail, winnerConfirmationEmail } = await import('./_giftbox.js');

const TOKEN = 'AbCdEfGhIjKlMnOpQrStUvWx';
const P1 = '11111111-1111-4111-8111-111111111111';
const ADMIN = { id: 'a', email: 'team@aynahealth.co', email_confirmed_at: '2026-10-01T00:00:00Z' };
const SHIP = { name: 'Maya Lee', email: 'maya@example.com', line1: '1 Main St', city: 'Ithaca', state: 'NY', postal: '14850' };
const PRODUCT = { id: P1, brand: 'B', name: 'Serum', notes: '', price_cents: 4000, image_url: null, product_url: null, max_per_order: 1, is_active: true };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('ADMIN_EMAILS', 'team@aynahealth.co');
  vi.stubEnv('CAMPAIGN_TEAM_EMAIL', '');
  vi.stubEnv('RESEND_API_KEY', '');
});

describe('_giftbox helpers', () => {
  it('parseCart merges repeats and rejects junk', () => {
    expect(parseCart([{ id: P1, qty: 1 }, { id: P1, qty: 2 }])).toEqual([{ id: P1, qty: 3 }]);
    expect(parseCart([{ id: 'nope', qty: 1 }])).toBeNull();
    expect(parseCart([{ id: P1, qty: 0 }])).toBeNull();
    expect(parseCart([])).toBeNull();
    expect(parseCart('x')).toBeNull();
  });
  it('parseShipping needs the address and a real email', () => {
    expect(parseShipping(SHIP).ship.email).toBe('maya@example.com');
    expect(parseShipping({ ...SHIP, email: 'nope' }).error).toBe('email');
    expect(parseShipping({ ...SHIP, line1: ' ' }).error).toBe('line1');
  });
  it('safeUrl only allows http(s) and site paths', () => {
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    expect(safeUrl('//evil.com/x')).toBeNull();
    expect(safeUrl('/giftbox/a.jpg')).toBe('/giftbox/a.jpg');
    expect(safeUrl('https://brand.com/p')).toBe('https://brand.com/p');
  });
  it('emails escape what people typed', () => {
    const items = [{ id: P1, brand: 'B', name: '<b>x</b>', qty: 1, priceCents: 100 }];
    expect(teamOrderEmail({ kind: 'winner', placedBy: 'M', items, totalCents: 100, budgetCents: 25000, ship: { ...SHIP, note: '<script>' } }).html).not.toContain('<script>');
    expect(winnerConfirmationEmail({ name: 'M', items, totalCents: 100 }).html).not.toContain('<b>x</b>');
  });
  it('tokens are long and URL safe', () => {
    expect(newToken()).toMatch(/^[A-Za-z0-9_-]{24}$/);
  });
});

describe('api/giftbox GET', () => {
  it('a winner link returns products and the limit, no account needed', async () => {
    getServiceClient.mockReturnValue(mockSupabase({ tableResults: {
      'giftbox_invites.select': { data: { id: 'i', winner_name: 'Maya Lee', budget_cents: 25000, status: 'open', expires_at: null }, error: null },
      'giftbox_products.select': { data: [PRODUCT], error: null },
    } }));
    const res = mockRes();
    await shop(mockReq({ method: 'GET', query: { token: TOKEN }, headers: { authorization: '' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ mode: 'winner', firstName: 'Maya', budgetCents: 25000 });
    expect(res.body.products[0]).toMatchObject({ id: P1, priceCents: 4000 });
    expect(verifyUser).not.toHaveBeenCalled();
  });

  it('a used link says so', async () => {
    getServiceClient.mockReturnValue(mockSupabase({ tableResults: { 'giftbox_invites.select': { data: { winner_name: 'Maya', status: 'redeemed' }, error: null } } }));
    const res = mockRes();
    await shop(mockReq({ method: 'GET', query: { token: TOKEN } }), res);
    expect(res.statusCode).toBe(410);
    expect(res.body.error).toBe('already_used');
  });

  it('an unknown or revoked link is a 404', async () => {
    getServiceClient.mockReturnValue(mockSupabase({ tableResults: { 'giftbox_invites.select': { data: { status: 'revoked' }, error: null } } }));
    const res = mockRes();
    await shop(mockReq({ method: 'GET', query: { token: TOKEN } }), res);
    expect(res.statusCode).toBe(404);
  });

  it('without a link, only an admin gets in', async () => {
    getServiceClient.mockReturnValue(mockSupabase({ tableResults: { 'giftbox_products.select': { data: [PRODUCT], error: null } } }));
    verifyUser.mockResolvedValue({ user: { id: 'u', email: 'someone@example.com', email_confirmed_at: 'x' }, error: null });
    let res = mockRes();
    await shop(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(403);
    verifyUser.mockResolvedValue({ user: ADMIN, error: null });
    res = mockRes();
    await shop(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.mode).toBe('admin');
  });
});

describe('api/giftbox checkout', () => {
  it('passes the cleaned cart to the database and returns the order', async () => {
    const db = mockSupabase({
      rpcResults: { giftbox_checkout: { data: { ok: true, orderId: 'o1', totalCents: 4000, items: [{ id: P1, name: 'Serum', qty: 1, priceCents: 4000 }] }, error: null } },
      tableResults: { 'giftbox_invites.select': { data: { winner_name: 'Maya Lee', budget_cents: 25000 }, error: null } },
    });
    getServiceClient.mockReturnValue(db);
    const res = mockRes();
    await shop(mockReq({ body: { token: TOKEN, items: [{ id: P1, qty: 1, priceCents: 1 }], shipping: SHIP } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.orderId).toBe('o1');
    const call = db.rpcCalls[0];
    expect(call.name).toBe('giftbox_checkout');
    expect(call.args).toMatchObject({ p_token: TOKEN, p_admin: null, p_items: [{ id: P1, qty: 1 }] });
    expect(call.args.p_items[0].priceCents).toBeUndefined();
  });

  it('over the limit is refused (the database decides)', async () => {
    getServiceClient.mockReturnValue(mockSupabase({ rpcResults: { giftbox_checkout: { data: { ok: false, error: 'over_budget' }, error: null } } }));
    const res = mockRes();
    await shop(mockReq({ body: { token: TOKEN, items: [{ id: P1, qty: 1 }], shipping: SHIP } }), res);
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('over_budget');
  });

  it('a second order on the same link is refused', async () => {
    getServiceClient.mockReturnValue(mockSupabase({ rpcResults: { giftbox_checkout: { data: { ok: false, error: 'already_used' }, error: null } } }));
    const res = mockRes();
    await shop(mockReq({ body: { token: TOKEN, items: [{ id: P1, qty: 1 }], shipping: SHIP } }), res);
    expect(res.statusCode).toBe(410);
  });

  it('a missing address never reaches the database', async () => {
    const db = mockSupabase();
    getServiceClient.mockReturnValue(db);
    const res = mockRes();
    await shop(mockReq({ body: { token: TOKEN, items: [{ id: P1, qty: 1 }], shipping: { ...SHIP, city: '' } } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.field).toBe('city');
    expect(db.rpcCalls).toHaveLength(0);
  });

  it('no link and not an admin: refused', async () => {
    const db = mockSupabase();
    getServiceClient.mockReturnValue(db);
    verifyUser.mockResolvedValue({ user: null, error: 'auth_required' });
    const res = mockRes();
    await shop(mockReq({ body: { items: [{ id: P1, qty: 1 }], shipping: SHIP } }), res);
    expect(res.statusCode).toBe(401);
    expect(db.rpcCalls).toHaveLength(0);
  });

  it('an admin checks out with no link and their email on the order', async () => {
    const db = mockSupabase({ rpcResults: { giftbox_checkout: { data: { ok: true, orderId: 'o2', totalCents: 90000, items: [] }, error: null } } });
    getServiceClient.mockReturnValue(db);
    verifyUser.mockResolvedValue({ user: ADMIN, error: null });
    const res = mockRes();
    await shop(mockReq({ body: { items: [{ id: P1, qty: 1 }], shipping: SHIP } }), res);
    expect(res.statusCode).toBe(200);
    expect(db.rpcCalls[0].args).toMatchObject({ p_token: null, p_admin: 'team@aynahealth.co' });
  });
});

describe('api/giftbox-admin', () => {
  it('403 for a non-admin', async () => {
    verifyUser.mockResolvedValue({ user: { id: 'u', email: 'x@example.com', email_confirmed_at: 'x' }, error: null, admin: mockSupabase() });
    const res = mockRes();
    await adminHandler(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(403);
  });

  it('makes a winner link with a fresh token and the limit', async () => {
    const admin = mockSupabase({ tableResults: { 'giftbox_invites.select': { data: { id: 'i', token: 'x' }, error: null } } });
    verifyUser.mockResolvedValue({ user: ADMIN, error: null, admin });
    const res = mockRes();
    await adminHandler(mockReq({ body: { action: 'create_link', winnerName: 'Maya Lee', budgetCents: 25000, expiresInDays: 30 } }), res);
    expect(res.statusCode).toBe(200);
    const row = admin.tableCalls.find((c) => c.payload?.token).payload;
    expect(row).toMatchObject({ winner_name: 'Maya Lee', budget_cents: 25000, created_by: 'team@aynahealth.co' });
    expect(row.token).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(new Date(row.expires_at) > new Date()).toBe(true);
  });

  it('refuses a product image that is not a web link', async () => {
    verifyUser.mockResolvedValue({ user: ADMIN, error: null, admin: mockSupabase() });
    const res = mockRes();
    await adminHandler(mockReq({ body: { action: 'save_product', name: 'X', priceCents: 100, imageUrl: 'javascript:alert(1)' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects an unknown order status', async () => {
    verifyUser.mockResolvedValue({ user: ADMIN, error: null, admin: mockSupabase() });
    const res = mockRes();
    await adminHandler(mockReq({ body: { action: 'order_status', id: P1, status: 'lost' } }), res);
    expect(res.statusCode).toBe(400);
  });
});
