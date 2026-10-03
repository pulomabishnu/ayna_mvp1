import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Readable } from 'node:stream';
import Stripe from 'stripe';
import { pilotConfig, stripeClient, validTracking, settleSession, parsePriceInput, cleanRetailerUrl, serviceFeeCents, purchasableProduct, selectedPilotVariant } from './_pilot.js';
import webhook from './pilot-webhook.js';

function response() {
  const res = { code: 200, body: null, setHeader() {}, status(n) { this.code = n; return this; }, json(b) { this.body = b; return this; }, end() { return this; } };
  return res;
}
beforeEach(() => { vi.unstubAllEnvs(); });
describe('pilot guardrails', () => {
  it('sets the $14.97 test price and removes affiliate tags from a retailer link', () => {
    expect(parsePriceInput('$14.97')).toBe(1497);
    expect(serviceFeeCents(1497)).toBe(150);
    expect(parsePriceInput('14.979')).toBeNull();
    expect(cleanRetailerUrl('https://www.amazon.com/dp/TEST?tag=aynahealth-20&x=1')).toBe('https://www.amazon.com/dp/TEST?x=1');
  });
  it('only accepts shippable physical products and a real selected option', () => {
    const product = { product_type: 'physical', category: 'pad', is_active: true, requires_prescription: false, extra: { variants: [{ id: 'size-1', label: 'Size 1' }] } };
    expect(purchasableProduct(product)).toBe(true);
    expect(selectedPilotVariant(product, '')).toBeNull();
    expect(selectedPilotVariant(product, 'size-1')).toEqual({ id: 'size-1', label: 'Size 1' });
    expect(purchasableProduct({ ...product, product_type: 'digital' })).toBe(false);
    expect(purchasableProduct({ ...product, requires_prescription: true })).toBe(false);
    expect(purchasableProduct({ ...product, source: 'discovered', review_status: 'approved' })).toBe(false);
  });
  it('uses the verified size list shown by the website when the database has no variants', () => {
    const product = { id: 'p-cora-organic-pads', extra: {} };
    expect(selectedPilotVariant(product, '')).toBeNull();
    expect(selectedPilotVariant(product, 'target-76155164')).toEqual({ id: 'target-76155164', label: 'Regular — 32 count' });
    expect(selectedPilotVariant(product, 'made-up')).toBeNull();
  });
  it('defaults off and targets the actual Always catalog id', () => {
    expect(pilotConfig({}).enabled).toBe(false);
    expect(pilotConfig({}).productId).toBe('p-always-infinity');
  });
  it('refuses live Stripe credentials', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_example');
    expect(stripeClient).toThrow('test key');
  });
  it('rejects executable tracking links and incomplete tracking', () => {
    expect(validTracking({ carrier: 'UPS', tracking_number: '123', tracking_url: 'javascript:alert(1)' })).toBeNull();
    expect(validTracking({ carrier: 'UPS' })).toBeNull();
    expect(validTracking({ carrier: 'UPS', tracking_number: '123', tracking_url: 'https://ups.com/track' }).status).toBe('shipped');
  });
  it('does not record unpaid or live sessions', async () => {
    const db = { rpc: vi.fn() };
    await expect(settleSession(db, { livemode: false, payment_status: 'unpaid', mode: 'payment' })).rejects.toThrow();
    await expect(settleSession(db, { livemode: true, payment_status: 'paid', mode: 'payment' })).rejects.toThrow();
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it('records verified payment and shipping atomically; propagates DB failures for retry', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const session = { id: 'cs_test_123', livemode: false, payment_status: 'paid', mode: 'payment', amount_total: 800, currency: 'usd', client_reference_id: 'user', metadata: { ayna_order_id: 'order' }, collected_information: { shipping_details: { name: 'Test' } } };
    await settleSession({ rpc }, session);
    expect(rpc).toHaveBeenCalledWith('pilot_record_payment', expect.objectContaining({ p_order_id: 'order', p_shipping: { name: 'Test' } }));
    rpc.mockResolvedValue({ error: { message: 'offline' } });
    await expect(settleSession({ rpc }, session)).rejects.toThrow();
  });
  it('rejects forged webhooks before accessing the database', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_example'); vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_example');
    const req = Readable.from(['{}']); req.method = 'POST'; req.headers = { 'stripe-signature': 'forged' };
    const res = response(); await webhook(req, res); expect(res.code).toBe(400);
  });
  it('accepts a signed unrelated test event without creating an order', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_example'); vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_example');
    const payload = JSON.stringify({ type: 'payment_intent.created', livemode: false, data: { object: {} } });
    const stripe = new Stripe('sk_test_example');
    const req = Readable.from([payload]); req.method = 'POST'; req.headers = { 'stripe-signature': stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_example' }) };
    const res = response(); await webhook(req, res); expect(res.code).toBe(200);
  });
});
