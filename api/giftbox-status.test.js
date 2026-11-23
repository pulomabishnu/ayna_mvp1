import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockReq, mockRes, mockSupabase } from './_test-helpers.js';

vi.mock('./_usageLimit.js', () => ({ verifyUser: vi.fn() }));
vi.mock('./_campaign.js', async (orig) => ({ ...(await orig()), getServiceClient: vi.fn() }));
vi.mock('./_giftboxSheet.js', async (orig) => ({ ...(await orig()), syncFromSheet: vi.fn(async () => ({ ok: true })) }));
const { verifyUser } = await import('./_usageLimit.js');
const { default: adminHandler } = await import('./giftbox-admin.js');
const { cleanTracking, giftboxCcRecipients, orderStatusEmail, trackingUrl } = await import('./_giftbox.js');

const P1 = '11111111-1111-4111-8111-111111111111';
const ADMIN = { id: 'a', email: 'team@aynahealth.co', email_confirmed_at: '2026-10-01T00:00:00Z' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('ADMIN_EMAILS', 'team@aynahealth.co');
  vi.stubEnv('CAMPAIGN_TEAM_EMAIL', '');
});

describe('gift box order status emails', () => {
  const ORDER = { id: P1, status: 'new', ship_name: 'Maya Lee', ship_email: 'maya@example.com', items: [{ id: P1, brand: 'B', name: 'Serum', qty: 1, priceCents: 4000 }], tracking_number: null, carrier: null };
  let fetchMock;
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    vi.stubEnv('CAMPAIGN_EMAILS_ENABLED', '1');
    vi.stubEnv('CAMPAIGN_POSTAL_ADDRESS', '1 Test St, Ithaca NY');
    vi.stubEnv('GIFTBOX_CC_EMAILS', undefined);
    fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
  });
  const sent = () => JSON.parse(fetchMock.mock.calls[0][1].body);
  const run = async (body, before = ORDER, after = { ...before, ...body.patch }) => {
    const db = mockSupabase({ tableResults: { 'giftbox_orders.select': { data: before, error: null }, 'giftbox_orders.update': { data: after, error: null } } });
    db.from.mockImplementation((table) => {
      const rec = { table, op: null };
      const api = {
        select() { if (!rec.op) rec.op = 'select'; return api; }, update(p) { rec.op = 'update'; rec.payload = p; return api; },
        eq() { return api; }, maybeSingle() { return api; },
        then(resolve) { db.tableCalls.push(rec); return Promise.resolve(rec.op === 'select' ? { data: before, error: null } : { data: after, error: null }).then(resolve); },
      };
      return api;
    });
    verifyUser.mockResolvedValue({ user: ADMIN, error: null, admin: db });
    const res = mockRes();
    const rest = { ...body }; delete rest.patch;
    await adminHandler(mockReq({ body: rest }), res);
    return { res, db };
  };

  it('tracking helpers', () => {
    expect(cleanTracking(' 9400 1000-0000 ')).toBe('940010000000');
    expect(cleanTracking('<script>')).toBeNull();
    expect(trackingUrl('usps', '9400')).toContain('tools.usps.com');
    expect(trackingUrl('other', '9400')).toBeNull();
    expect(giftboxCcRecipients()).toEqual(['ameera@aynahealth.co', 'puloma@aynahealth.co', 'eliz@aynahealth.co']);
  });

  it('shipped email has the tracking link and escapes names', () => {
    const m = orderStatusEmail({ status: 'shipped', name: '<b>Maya</b>', items: ORDER.items, carrier: 'ups', trackingNumber: '1Z999' });
    expect(m.subject).toMatch(/shipped/);
    expect(m.html).toContain('https://www.ups.com/track?tracknum=1Z999');
    expect(m.html).not.toContain('<b>Maya</b>');
    expect(m.text).toContain('UPS 1Z999');
    expect(orderStatusEmail({ status: 'new' })).toBeNull();
  });

  it('marking shipped emails the customer with the founders cc\'d and saves tracking', async () => {
    const { res, db } = await run({ action: 'order_status', id: P1, status: 'shipped', trackingNumber: '1Z 999', carrier: 'ups', patch: { status: 'shipped', tracking_number: '1Z999', carrier: 'ups' } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, emailed: true });
    const msg = sent();
    expect(msg.to).toEqual(['maya@example.com']);
    expect(msg.cc).toEqual(['ameera@aynahealth.co', 'puloma@aynahealth.co', 'eliz@aynahealth.co']);
    expect(msg.html).toContain('1Z999');
    const upd = db.tableCalls.find((c) => c.op === 'update');
    expect(upd.payload).toMatchObject({ status: 'shipped', tracking_number: '1Z999', carrier: 'ups' });
  });

  it('no email when notify is off, the status did not change, or it went back to new', async () => {
    await run({ action: 'order_status', id: P1, status: 'shipped', notify: false, patch: { status: 'shipped' } });
    await run({ action: 'order_status', id: P1, status: 'preparing', patch: {} }, { ...ORDER, status: 'preparing' });
    await run({ action: 'order_status', id: P1, status: 'new', patch: {} }, { ...ORDER, status: 'preparing' }, { ...ORDER, status: 'new' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('adding tracking to a shipped order emails it once', async () => {
    const shipped = { ...ORDER, status: 'shipped' };
    const { res } = await run({ action: 'order_tracking', id: P1, trackingNumber: '9400111', carrier: 'usps', patch: { tracking_number: '9400111', carrier: 'usps' } }, shipped);
    expect(res.body.emailed).toBe(true);
    expect(sent().html).toContain('tools.usps.com');
    fetchMock.mockClear();
    await run({ action: 'order_tracking', id: P1, trackingNumber: '9400111', carrier: 'usps', patch: {} }, { ...shipped, tracking_number: '9400111', carrier: 'usps' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('a failed email never fails the status change', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const { res } = await run({ action: 'order_status', id: P1, status: 'preparing', patch: { status: 'preparing' } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, emailed: false, emailError: 'resend_500' });
  });

  it('rejects a junk tracking number or carrier', async () => {
    expect((await run({ action: 'order_tracking', id: P1, trackingNumber: '<x>', carrier: 'usps' })).res.statusCode).toBe(400);
    expect((await run({ action: 'order_tracking', id: P1, trackingNumber: '9400', carrier: 'pigeon' })).res.statusCode).toBe(400);
  });
});
