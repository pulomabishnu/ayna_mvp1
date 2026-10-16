import { describe, expect, it, vi } from 'vitest';
import { createAuthorization, captureAuthorization, cancelAuthorization, getAuthorization } from './stripeAuthorization.js';
import { buildZincOrder, mapZincError } from './zinc.js';
import { buildShoppableCheckout, mapShoppableResponse, shoppableHoldAmountCents, shoppableCheckoutConfigured } from './shoppable.js';
import { creatorsApiStatus } from './creatorsApi.js';
import { recordProviderEventOnce } from './providerEvents.js';

const env = { STRIPE_SECRET_KEY: 'sk_test_only' };
const partnerOffer = { provider: 'brand_direct', agreement: { type: 'dropship', reference: 'contract-7', approvedAt: '2026-10-01' } };
const zincOffer = { ...partnerOffer, agreement: { ...partnerOffer.agreement, allowsPurchasingProvider: true } };

function fakeStripe(responses) {
  const calls = [];
  const fetchImpl = vi.fn(async (url, init) => {
    calls.push({ url, init });
    const next = responses.shift();
    return { ok: next.ok !== false, status: next.status || 200, json: async () => next.body };
  });
  return { fetchImpl, calls };
}

describe('Stripe authorize then capture', () => {
  it('authorizes with manual capture, an idempotency key and opaque metadata only', async () => {
    const { fetchImpl, calls } = fakeStripe([{ body: { id: 'pi_1', status: 'requires_payment_method' } }]);
    await createAuthorization({ orderId: 'ord_abc123', amountCents: 3500, offers: [partnerOffer] }, { env, fetchImpl });
    expect(calls[0].url).toBe('https://api.stripe.com/v1/payment_intents');
    expect(calls[0].init.headers['Idempotency-Key']).toBe('ayna-auth-ord_abc123');
    const body = decodeURIComponent(calls[0].init.body);
    expect(body).toContain('capture_method=manual');
    expect(body).toContain('metadata[ayna_order_id]=ord_abc123');
    expect(body).not.toMatch(/product|name|health/i);
  });

  it('refuses to take payment for an Amazon item', async () => {
    const { fetchImpl } = fakeStripe([]);
    await expect(createAuthorization({ orderId: 'ord_abc123', amountCents: 3500, offers: [{ provider: 'amazon_associates' }] }, { env, fetchImpl })).rejects.toThrow(/Amazon/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('refuses redirect-only offers (ShopMy, unknown)', async () => {
    const { fetchImpl } = fakeStripe([]);
    await expect(createAuthorization({ orderId: 'ord_abc123', amountCents: 3500, offers: [{ provider: 'shopmy' }] }, { env, fetchImpl })).rejects.toThrow();
  });

  it('reads the real hold deadline from the charge', async () => {
    const { fetchImpl, calls } = fakeStripe([{ body: { id: 'pi_1', status: 'requires_capture', amount_capturable: 3500, latest_charge: { payment_method_details: { card: { capture_before: 1792800000 } } } } }]);
    const r = await getAuthorization('pi_1', { env, fetchImpl });
    expect(r.captureBefore).toBe(1792800000);
    expect(calls[0].url).toContain('expand[]=latest_charge');
  });

  it('captures less than authorized but never more', async () => {
    const held = { body: { id: 'pi_1', status: 'requires_capture', amount_capturable: 3500, latest_charge: {} } };
    const ok = fakeStripe([held, { body: { id: 'pi_1', status: 'succeeded' } }]);
    await captureAuthorization({ paymentIntentId: 'pi_1', amountToCaptureCents: 3100, orderId: 'ord_abc123' }, { env, fetchImpl: ok.fetchImpl });
    expect(decodeURIComponent(ok.calls[1].init.body)).toBe('amount_to_capture=3100');
    const over = fakeStripe([held]);
    await expect(captureAuthorization({ paymentIntentId: 'pi_1', amountToCaptureCents: 3600 }, { env, fetchImpl: over.fetchImpl })).rejects.toMatchObject({ code: 'PRICE_CHANGE_REQUIRES_ACTION' });
    expect(over.calls).toHaveLength(1); // no capture call was made
  });

  it('cancels (releases) a hold', async () => {
    const { fetchImpl, calls } = fakeStripe([{ body: { id: 'pi_1', status: 'canceled' } }]);
    await cancelAuthorization({ paymentIntentId: 'pi_1' }, { env, fetchImpl });
    expect(calls[0].url).toBe('https://api.stripe.com/v1/payment_intents/pi_1/cancel');
  });
});

describe('Zinc', () => {
  const base = { offer: zincOffer, lines: [{ url: 'https://brand.com/products/x?variant=1', quantity: 1 }], shippingAddress: { zip_code: '10026' }, maxPriceCents: 3500, idempotencyKey: 'ord_abc123-1' };

  it('builds an order with a whole-order max_price and idempotency key', () => {
    expect(buildZincOrder(base)).toMatchObject({ max_price: 3500, idempotency_key: 'ord_abc123-1' });
  });

  it('refuses Amazon, missing max_price/idempotency, mixed retailers, and merchants without consent', () => {
    expect(() => buildZincOrder({ ...base, lines: [{ url: 'https://www.amazon.com/dp/B0TEST0001', quantity: 1 }] })).toThrow(/Amazon/);
    expect(() => buildZincOrder({ ...base, offer: { provider: 'amazon_associates' } })).toThrow(/Amazon/);
    expect(() => buildZincOrder({ ...base, maxPriceCents: null })).toThrow(/max_price/);
    expect(() => buildZincOrder({ ...base, idempotencyKey: '' })).toThrow(/idempotency/);
    expect(() => buildZincOrder({ ...base, lines: [...base.lines, { url: 'https://other.com/p', quantity: 1 }] })).toThrow(/one retailer/);
    expect(() => buildZincOrder({ ...base, offer: partnerOffer })).toThrow(/purchasing provider/);
  });

  it('maps failures to states that stop the order', () => {
    expect(mapZincError('max_price_exceeded')).toBe('price_change_requires_action');
    expect(mapZincError('product_out_of_stock')).toBe('out_of_stock_requires_action');
    expect(mapZincError('anything_else')).toBe('merchant_order_failed');
  });
});

describe('Shoppable', () => {
  it('always declines substitutions', () => {
    const body = buildShoppableCheckout({ email: 'a@b.co', lines: [{ id: 'x', price: 10, quantity: 1 }], shipping: {}, billing: {}, paymentToken: 'tok' });
    expect(body.cartDetails.substitutionOptIn).toBe(false);
    expect(body.cartDetails.marketingOptIn).toBe(false);
  });

  it('surfaces price increases and stock-outs instead of continuing', () => {
    expect(mapShoppableResponse(404, { itemsWithPriceChange: ['x'] })).toMatchObject({ ok: false, state: 'PRICE_CHANGED', items: ['x'] });
    expect(mapShoppableResponse(404, { outOfStockItems: ['y'] }).state).toBe('OUT_OF_STOCK');
    expect(mapShoppableResponse(200, { orderNumber: 'R1' }).state).toBe('PLACED');
  });

  it('holds items + shipping + 15% for tax, and is off until access is confirmed', () => {
    expect(shoppableHoldAmountCents(10000, 500)).toBe(12000);
    expect(shoppableCheckoutConfigured({})).toBe(false);
  });
});

describe('Creators API status', () => {
  it('reports both blockers until credentials and Amazon confirmation exist', () => {
    expect(creatorsApiStatus({})).toEqual({ live: false, blockers: ['NEEDS_CREATORS_API_CREDENTIALS', 'NEEDS_AMAZON_WRITTEN_CONFIRMATION'] });
  });
});

describe('provider events', () => {
  it('treats a redelivered webhook as a duplicate', async () => {
    const seen = new Set();
    const db = { from: () => ({ insert: async (row) => {
      const key = `${row.provider}:${row.event_id}`;
      if (seen.has(key)) return { error: { code: '23505', message: 'duplicate' } };
      seen.add(key);
      return { error: null };
    } }) };
    expect(await recordProviderEventOnce(db, { provider: 'stripe', eventId: 'evt_1', eventType: 'payment_intent.succeeded' })).toEqual({ duplicate: false });
    expect(await recordProviderEventOnce(db, { provider: 'stripe', eventId: 'evt_1', eventType: 'payment_intent.succeeded' })).toEqual({ duplicate: true });
  });
});
