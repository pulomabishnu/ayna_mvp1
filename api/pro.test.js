/* global process, Buffer */
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import Stripe from 'stripe';
import { mockReq, mockRes, mockSupabase, withEnv } from './_test-helpers.js';

const edge = vi.hoisted(() => ({ user: null, admin: null, create: vi.fn(), retrieve: vi.fn(), price: vi.fn(), charge: vi.fn(), subscription: vi.fn(), cancel: vi.fn(), update: vi.fn(), payments: vi.fn(), intent: vi.fn(), invoice: vi.fn(), lines: vi.fn() }));
vi.mock('./_usageLimit.js', () => ({
  verifyUser: async () => ({ user: edge.user, admin: edge.admin, error: edge.user ? null : 'auth_required' }),
  getServiceClient: () => edge.admin,
}));
vi.mock('./_rateLimit.js', () => ({ rateLimit: async () => ({ ok: true }) }));
vi.mock('stripe', async importOriginal => {
  const { default: RealStripe } = await importOriginal();
  return { default: class extends RealStripe {
    constructor(...args) {
      super(...args);
      this.checkout.sessions = { create: edge.create, retrieve: edge.retrieve };
      this.prices = { retrieve: edge.price };
      this.charges = { retrieve: edge.charge };
      this.subscriptions = { retrieve: edge.subscription, cancel: edge.cancel, update: edge.update };
      this.invoicePayments = { list: edge.payments };
      this.paymentIntents = { retrieve: edge.intent };
      this.invoices = { retrieve: edge.invoice, listLineItems: edge.lines };
    }
  } };
});
import handler from './pro.js';
import webhook from './pro-webhook.js';
import { fulfillProSession, fulfillProInvoice, proStripe, proStatus, renewalDate } from './_pro.js';
import { hasPremiumAccess } from './_entitlement.js';

const userId = '00000000-0000-4000-8000-000000000001';
const requestId = '00000000-0000-4000-8000-000000000002';
const launchAt = '2027-01-01T05:00:00.000Z';
const renewAt = Date.parse('2027-02-01T05:00:00Z') / 1000;
const recurringPrice = { id: 'price_month_renewal', product: 'prod_pro', type: 'recurring', unit_amount: 899, currency: 'usd', active: true, livemode: false, recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' } };
function subscription() { return { id: 'sub_pro', customer: 'cus_pro', livemode: false, status: 'trialing', cancel_at_period_end: false, trial_end: renewAt, metadata: { flow: 'ayna_pro_early_access_v1', user_id: userId, plan: 'month' } }; }
const paidAt = '2026-11-01T00:00:00.000Z';
const price = { id: 'price_month', product: 'prod_pro', type: 'one_time', unit_amount: 499, currency: 'usd', active: true, livemode: false };
function paidSession(overrides = {}) {
  return {
    id: 'cs_paid', mode: 'subscription', invoice: 'in_initial', subscription: 'sub_pro', status: 'complete', payment_status: 'paid', livemode: false,
    client_reference_id: userId, metadata: { flow: 'ayna_pro_early_access_v1', user_id: userId, plan: 'month', launch_at: launchAt, renew_at: String(renewAt) },
    currency: 'usd', amount_subtotal: 499, amount_total: 499, total_details: { amount_discount: 0 },
    line_items: { has_more: false, data: [{ quantity: 1, price }, { quantity: 1, price: recurringPrice }] },
    payment_intent: { id: 'pi_paid', status: 'succeeded', latest_charge: { id: 'ch_paid', status: 'succeeded', refunded: false, disputed: false } },
    ...overrides,
  };
}
let restore;
beforeEach(() => {
  restore = withEnv({ PRO_BILLING_ENABLED: '1', PRO_CHECKOUT_ENABLED: '1', STRIPE_RESTRICTED_KEY: 'rk_test_example', STRIPE_PRO_LIVEMODE: 'false',
    STRIPE_PRO_WEBHOOK_SECRET: 'whsec_test', STRIPE_PRO_PRODUCT_ID: 'prod_pro', STRIPE_PRO_MONTH_PRICE_ID: 'price_month', STRIPE_PRO_YEAR_PRICE_ID: 'price_year', STRIPE_PRO_MONTH_RENEWAL_PRICE_ID: 'price_month_renewal', STRIPE_PRO_YEAR_RENEWAL_PRICE_ID: 'price_year_renewal', SITE_URL: 'https://www.aynahealth.co' });
  edge.user = { id: userId, app_metadata: {}, user_metadata: {} };
  edge.admin = mockSupabase({ rpcResults: { pro_access_status: { data: { active: false, launchAt }, error: null } } });
  edge.admin.auth.admin.getUserById = vi.fn(async () => ({ data: { user: edge.user }, error: null }));
  edge.create.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.com/c/pay' });
  edge.retrieve.mockReset().mockResolvedValue(paidSession());
  edge.price.mockReset().mockImplementation(async id => id === 'price_month' ? price : recurringPrice);
  edge.subscription.mockReset().mockResolvedValue(subscription());
  edge.cancel.mockReset().mockResolvedValue({ ...subscription(), status: 'canceled' });
  edge.update.mockReset().mockResolvedValue(subscription());
  edge.payments.mockReset().mockResolvedValue({ data: [{ payment: { type: 'payment_intent', payment_intent: 'pi_paid' } }] });
  edge.intent.mockReset().mockResolvedValue(paidSession().payment_intent);
  edge.invoice.mockReset(); edge.lines.mockReset();
  edge.charge.mockReset().mockResolvedValue({ payment_intent: 'pi_paid' });
});
afterEach(() => { restore(); vi.restoreAllMocks(); });
const call = async (body = { plan: 'month', requestId }, method = 'POST') => {
  const res = mockRes(); await handler(mockReq({ body, method }), res); return res;
};

describe('authenticated one-time checkout', () => {
  it('ties the purchase to the authenticated user, not a submitted user/price/amount', async () => {
    expect((await call({ plan: 'month', requestId, userId: 'attacker', price: 'cheap', amount: 1 })).statusCode).toBe(200);
    const params = edge.create.mock.calls[0][0];
    expect(params).toMatchObject({ mode: 'subscription', client_reference_id: userId, line_items: [{ price: 'price_month', quantity: 1 }, { price: 'price_month_renewal', quantity: 1 }], metadata: { user_id: userId, plan: 'month' } });
    expect(params.subscription_data).toMatchObject({ trial_end: renewAt });
    expect(params).not.toHaveProperty('payment_method_types');
    expect(params.success_url).toBe('https://www.aynahealth.co/you/pro?checkout=success');
    expect(edge.admin.tableCalls).toEqual([]); // creating Checkout grants nothing
  });
  it('retries with exactly the same parameters and idempotency key', async () => {
    await call(); await call();
    expect(edge.create.mock.calls[0]).toEqual(edge.create.mock.calls[1]);
    expect(edge.create.mock.calls[0][0].integration_identifier).toMatch(/^ayna_pro_[a-z]{8}$/);
  });
  it('rejects signed-out callers', async () => { edge.user = null; expect((await call()).statusCode).toBe(401); expect(edge.create).not.toHaveBeenCalled(); });
  it.each(['bogus', '__proto__', 'constructor'])('rejects invalid plan %s', async plan => { expect((await call({ plan, requestId })).statusCode).toBe(400); });
  it('rejects client-writable premium flags as an upgrade', async () => {
    edge.user.user_metadata.is_premium = true;
    expect((await call({}, 'GET')).body.active).toBe(false);
  });
  it('blocks checkout for existing Pro members', async () => {
    edge.admin.rpc.mockResolvedValue({ data: { active: true, hasPurchase: true, launchAt } });
    expect((await call()).body.error).toBe('already_pro');
    expect(edge.create).not.toHaveBeenCalled();
  });
  it('closes sales at launch but preserves purchased access', async () => {
    edge.admin.rpc.mockResolvedValue({ data: { active: true, launchAt: '2020-01-01T00:00:00Z' } });
    expect((await call({}, 'GET')).body).toMatchObject({ active: true, offerOpen: false });
    expect((await call()).body.error).toBe('early_access_closed');
  });
  it('allows disabling checkout without taking away existing Pro', async () => {
    process.env.PRO_CHECKOUT_ENABLED = '0';
    edge.admin.rpc.mockResolvedValue({ data: { active: true, hasPurchase: true, launchAt } });
    expect((await call({}, 'GET')).body).toMatchObject({ active: true, offerOpen: false });
    expect(await hasPremiumAccess(edge.user, edge.admin)).toBe(true);
  });
  it.each([{ ...price, livemode: true }, { ...price, product: 'other' }, { ...price, unit_amount: 1 }, { ...price, type: 'recurring' }])('fails closed for the wrong configured price', async wrong => {
    edge.price.mockResolvedValue(wrong);
    expect((await call()).statusCode).toBe(503); expect(edge.create).not.toHaveBeenCalled();
  });
  it('returns an error instead of treating an unavailable ledger as free', async () => {
    edge.admin.rpc.mockResolvedValue({ data: null, error: { message: 'missing migration' } });
    expect((await call({}, 'GET')).statusCode).toBe(503);
    await expect(hasPremiumAccess(edge.user, edge.admin)).rejects.toThrow();
  });
});

describe('fulfillment validation', () => {
  it('writes an immutable session-keyed grant with a renewal date', async () => {
    await fulfillProSession(proStripe(), edge.admin, 'cs_paid', paidAt);
    expect(edge.admin.tableCalls.find(c => c.table === 'pro_purchases')).toMatchObject({ table: 'pro_purchases', payload: { user_id: userId, plan: 'month', paid_at: paidAt }, options: { onConflict: 'session_id', ignoreDuplicates: true } });
  });
  it.each(['unpaid', 'no_payment_required'])('never grants access for %s', async payment_status => {
    edge.retrieve.mockResolvedValue(paidSession({ payment_status }));
    await fulfillProSession(proStripe(), edge.admin, 'cs_paid', paidAt);
    expect(edge.admin.tableCalls).toEqual([]);
  });
  it('ignores unrelated checkouts', async () => {
    edge.retrieve.mockResolvedValue(paidSession({ metadata: {} }));
    await fulfillProSession(proStripe(), edge.admin, 'cs_paid', paidAt);
    expect(edge.admin.tableCalls).toEqual([]);
  });
  it('rejects a different product even if the amount matches', async () => {
    edge.retrieve.mockResolvedValue(paidSession({ line_items: { data: [{ quantity: 1, price: { ...price, product: 'other' } }] } }));
    await expect(fulfillProSession(proStripe(), edge.admin, 'cs_paid', paidAt)).rejects.toThrow();
    expect(edge.admin.tableCalls).toEqual([]);
  });
  it('never associates payment by email or a conflicting owner', async () => {
    edge.retrieve.mockResolvedValue(paidSession({ client_reference_id: '00000000-0000-4000-8000-000000000099' }));
    await expect(fulfillProSession(proStripe(), edge.admin, 'cs_paid', paidAt)).rejects.toThrow();
  });
  it('saves a revocation when a completed session is already refunded', async () => {
    const intent = paidSession().payment_intent; intent.latest_charge.refunded = true; edge.intent.mockResolvedValue(intent);
    await fulfillProSession(proStripe(), edge.admin, 'cs_paid', paidAt);
    expect(edge.admin.tableCalls.some(c => c.table === 'pro_payment_revocations' && c.op === 'upsert')).toBe(true);
    expect(edge.cancel).toHaveBeenCalledWith('sub_pro');
  });
  it('does not recreate a deleted account', async () => {
    edge.admin.auth.admin.getUserById.mockResolvedValue({ error: { status: 404 } });
    await fulfillProSession(proStripe(), edge.admin, 'cs_paid', paidAt);
    expect(edge.admin.tableCalls).toEqual([]);
  });
  it('returns an error when grant persistence fails so Stripe can retry', async () => {
    edge.admin.from = () => ({ upsert: async () => ({ error: { message: 'db down' } }) });
    await expect(fulfillProSession(proStripe(), edge.admin, 'cs_paid', paidAt)).rejects.toThrow();
  });
});

function signedEvent(type, object, overrides = {}) {
  const body = JSON.stringify({ id: 'evt_test', type, created: Math.floor(Date.now() / 1000), livemode: false, data: { object }, ...overrides });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload: body, secret: 'whsec_test' });
  return { method: 'POST', headers: { 'stripe-signature': signature }, rawBody: Buffer.from(body) };
}
async function send(req) { const res = mockRes(); await webhook(req, res); return res; }
describe('signed webhook', () => {
  it.each(['checkout.session.completed', 'checkout.session.async_payment_succeeded'])('fulfills %s', async type => {
    expect((await send(signedEvent(type, { id: 'cs_paid' }))).statusCode).toBe(200);
    expect(edge.admin.tableCalls.some(c => c.table === 'pro_purchases')).toBe(true);
  });
  it('verifies the raw body before any writes', async () => {
    const req = signedEvent('checkout.session.completed', { id: 'cs_paid' }); req.rawBody = Buffer.from('{}');
    expect((await send(req)).statusCode).toBe(400); expect(edge.retrieve).not.toHaveBeenCalled();
  });
  it('rejects a real signature from the wrong mode', async () => {
    expect((await send(signedEvent('checkout.session.completed', { id: 'cs_paid' }, { livemode: true }))).statusCode).toBe(400);
    expect(edge.retrieve).not.toHaveBeenCalled();
  });
  it('persists full refunds even if they arrive before completion', async () => {
    expect((await send(signedEvent('charge.refunded', { refunded: true, payment_intent: 'pi_paid' }))).statusCode).toBe(200);
    expect(edge.admin.tableCalls.find(c => c.table === 'pro_payment_revocations')).toMatchObject({ table: 'pro_payment_revocations', payload: { payment_intent_id: 'pi_paid', reason: 'refund' } });
  });
  it('keeps access for partial refunds', async () => {
    await send(signedEvent('charge.refunded', { refunded: false, payment_intent: 'pi_paid' }));
    expect(edge.admin.tableCalls).toEqual([]);
  });
  it('revokes disputed payments', async () => {
    await send(signedEvent('charge.dispute.created', { charge: 'ch_paid' }));
    expect(edge.admin.tableCalls.find(c => c.table === 'pro_payment_revocations').payload.reason).toBe('dispute');
  });
  it('acknowledges async failure without granting access', async () => {
    expect((await send(signedEvent('checkout.session.async_payment_failed', { id: 'cs_paid' }))).statusCode).toBe(200);
    expect(edge.admin.tableCalls.some(c => c.table === 'pro_purchases')).toBe(false);
  });
  it('cancels a failed asynchronous payment without a Pro grant', async () => {
    edge.retrieve.mockResolvedValue(paidSession({ payment_status: 'unpaid' }));
    await send(signedEvent('checkout.session.async_payment_failed', { id: 'cs_paid' }));
    expect(edge.cancel).toHaveBeenCalledWith('sub_pro');
    expect(edge.admin.tableCalls.some(c => c.table === 'pro_purchases')).toBe(false);
  });
  it('does not cancel a paid subscription on a stale failure event', async () => {
    await send(signedEvent('checkout.session.async_payment_failed', { id: 'cs_paid' }));
    expect(edge.cancel).not.toHaveBeenCalled();
  });
  it('requires the expected status response', async () => {
    edge.admin.rpc.mockResolvedValue({ data: {} }); await expect(proStatus(edge.admin, userId)).rejects.toThrow();
  });
});

describe('renewal lifecycle and temporary grants', () => {
  it('grants a paid renewal only through the invoice period end', async () => {
    edge.invoice.mockResolvedValue({ id: 'in_renew', billing_reason: 'subscription_cycle', status: 'paid', livemode: false, currency: 'usd', parent: { subscription_details: { subscription: 'sub_pro' } } });
    edge.lines.mockResolvedValue({ data: [{ quantity: 1, amount: 899, pricing: { price_details: { price: 'price_month_renewal' } }, parent: { subscription_item_details: { proration: false } }, period: { start: renewAt, end: renewAt + 28 * 86400 } }] });
    await fulfillProInvoice(proStripe(), edge.admin, 'in_renew', paidAt);
    expect(edge.admin.tableCalls.find(c => c.table === 'pro_purchases').payload).toMatchObject({ session_id: 'in_renew', subscription_id: 'sub_pro', term_starts_at: '2027-02-01T05:00:00.000Z', term_ends_at: '2027-03-01T05:00:00.000Z' });
  });
  it.each(['open', 'uncollectible', 'void'])('does not extend access for an invoice that is %s', async status => {
    edge.invoice.mockResolvedValue({ billing_reason: 'subscription_cycle', status, livemode: false });
    await fulfillProInvoice(proStripe(), edge.admin, 'in_failed', paidAt);
    expect(edge.admin.tableCalls).toEqual([]);
  });
  it('cancels only subscriptions looked up by the authenticated user', async () => {
    edge.admin.from = vi.fn(() => ({ select: () => ({ eq: vi.fn(async (key, id) => {
      expect(key).toBe('user_id'); expect(id).toBe(userId); return { data: [{ subscription_id: 'sub_pro' }] };
    }) }), upsert: async () => ({ error: null }) }));
    const res = await call({ action: 'cancel_renewal', userId: 'other' });
    expect(res.statusCode).toBe(200); expect(edge.update).toHaveBeenCalledWith('sub_pro', { cancel_at_period_end: true });
  });
  it('blocks non-admin focus-group grants', async () => {
    expect((await call({ action: 'focus_grant', userId, minutes: 60 })).statusCode).toBe(403);
    expect(edge.admin.tableCalls).toEqual([]);
  });
  it('requires a confirmed admin and limits temporary access to four hours', async () => {
    process.env.ADMIN_EMAILS = 'admin@example.com';
    edge.user.email = 'admin@example.com';
    expect((await call({ action: 'focus_grant', userId, minutes: 999999 })).statusCode).toBe(403);
    edge.user.email_confirmed_at = paidAt;
    const before = Date.now();
    expect((await call({ action: 'focus_grant', userId, minutes: 999999 })).statusCode).toBe(200);
    const grant = edge.admin.tableCalls.find(c => c.table === 'pro_focus_grants');
    expect(Date.parse(grant.payload.expires_at) - before).toBeLessThanOrEqual(4 * 3600000 + 100);
    delete process.env.ADMIN_EMAILS;
  });
  it('uses a calendar month/year for first renewal', () => {
    expect(new Date(renewalDate('2027-01-31T05:00:00Z', 'month') * 1000).toISOString()).toBe('2027-02-28T05:00:00.000Z');
    expect(new Date(renewalDate(launchAt, 'year') * 1000).toISOString()).toBe('2028-01-01T05:00:00.000Z');
  });
});
