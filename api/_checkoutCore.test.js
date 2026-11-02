import { afterEach, describe, expect, it, vi } from 'vitest';
import { availableProduct, checkoutConfig, fulfillCheckout, notifySupplier } from './_checkoutCore.js';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('direct checkout gates', () => {
  it('rejects a live Stripe key even when checkout is enabled', () => {
    vi.stubEnv('CHECKOUT_TEST_ENABLED', '1');
    vi.stubEnv('STRIPE_CHECKOUT_TEST_KEY', 'sk_live_example');
    vi.stubEnv('STRIPE_CHECKOUT_WEBHOOK_SECRET', 'whsec_example');
    vi.stubEnv('CHECKOUT_TEST_ORDER_EMAIL', 'orders@example.com');
    vi.stubEnv('RESEND_API_KEY', 're_example');
    expect(() => checkoutConfig()).toThrow('checkout_not_configured');
  });

  it('does not offer a catalog item until the product and supplier are enabled', async () => {
    const product = { id: 'one', name: 'One', product_type: 'physical', is_active: true,
      checkout_enabled: false, checkout_price_cents: 1199, checkout_sku: 'ONE',
      checkout_supplier_id: 'supplier' };
    const db = { from: table => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({
        data: table === 'product_catalog' ? product : { id: 'supplier', active: true },
        error: null,
      }) }) }),
    }) };
    expect(await availableProduct(db, 'one')).toBeNull();
    product.checkout_enabled = true;
    expect((await availableProduct(db, 'one')).product.checkout_price_cents).toBe(1199);
  });

  it('ignores an unpaid session before any order write', async () => {
    const db = { from: vi.fn(() => { throw new Error('must not write'); }) };
    const stripe = { checkout: { sessions: { retrieve: async () => ({
      metadata: { flow: 'ayna_direct_checkout_test_v1' }, livemode: false,
      mode: 'payment', payment_status: 'unpaid', status: 'complete',
    }) } } };
    await expect(fulfillCheckout(db, stripe, 'cs_test_123')).resolves.toBeUndefined();
    expect(db.from).not.toHaveBeenCalled();
  });

  it('never emails a supplier address different from the internal test mailbox', async () => {
    vi.stubEnv('CHECKOUT_TEST_ENABLED', '1');
    vi.stubEnv('STRIPE_CHECKOUT_TEST_KEY', 'sk_test_example');
    vi.stubEnv('STRIPE_CHECKOUT_WEBHOOK_SECRET', 'whsec_example');
    vi.stubEnv('CHECKOUT_TEST_ORDER_EMAIL', 'internal@example.com');
    vi.stubEnv('RESEND_API_KEY', 're_example');
    const send = vi.fn();
    vi.stubGlobal('fetch', send);
    await expect(notifySupplier({}, { id: 'order', shipping_address: {} }, [],
      { order_email: 'partner@example.com' })).rejects.toThrow('test_mailbox_mismatch');
    expect(send).not.toHaveBeenCalled();
  });
});
