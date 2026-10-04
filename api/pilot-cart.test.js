import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Readable } from 'node:stream';
import Stripe from 'stripe';

const mocks = vi.hoisted(() => ({
  db: null, user: null, stripe: {}, sendOrderEmails: null, notifyCustomerUpdate: null,
  config: { enabled: true, productId: 'p-always-infinity', vendor: 'TEST ONLY', admins: ['admin'], origin: 'https://test.example.com', paymentMode: 'test', taxIncluded: false, serviceFeePercent: 10 },
}));
vi.mock('./_pilot.js', async () => ({ ...(await vi.importActual('./_pilot.js')), database: () => mocks.db, signedIn: async () => mocks.user, pilotConfig: () => mocks.config, stripeClient: () => mocks.stripe }));
vi.mock('./_pilotMail.js', async () => ({
  ...(await vi.importActual('./_pilotMail.js')),
  sendOrderEmails: (...args) => mocks.sendOrderEmails(...args),
  notifyCustomerUpdate: (...args) => mocks.notifyCustomerUpdate(...args),
}));
vi.mock('./_rateLimit.js', () => ({ rateLimit: async () => ({ ok: true }) }));

import checkout from './pilot-checkout.js';
import orders from './pilot-orders.js';
import webhook from './pilot-webhook.js';
import { checkoutTotalCents } from './_pilot.js';
import { normalizeCartItems, cartKey, cartTotals, orderItemsPayload, orderSummaryName, stripeLineItems, MAX_QTY } from './_pilotCart.js';

// ---- helpers -------------------------------------------------------------
function res() { return { code: 200, headers: {}, setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, end() { return this; } }; }
// Minimal in-memory Supabase stand-in: tables are arrays of shared row objects.
function fakeDb(tables, rpcs = {}) {
  const calls = { rpc: [] };
  const from = (name) => {
    const state = { rows: tables[name] ?? (tables[name] = []), op: 'select', patch: null };
    const settle = (kind) => {
      if (state.op === 'update') for (const row of state.rows) Object.assign(row, state.patch);
      // Like the real client, results are copies: later writes never change an earlier read.
      if (kind === 'many') return { data: state.rows.map(r => ({ ...r })), error: null };
      if (!state.rows.length) return kind === 'single' ? { data: null, error: { message: 'no rows' } } : { data: null, error: null };
      return { data: { ...state.rows[0] }, error: null };
    };
    const q = {
      select: () => q, order: () => q, limit: () => q,
      eq: (column, value) => { state.rows = state.rows.filter(r => r[column] === value); return q; },
      in: (column, values) => { state.rows = state.rows.filter(r => values.includes(r[column])); return q; },
      update: (patch) => { state.op = 'update'; state.patch = patch; return q; },
      maybeSingle: async () => settle('maybe'), single: async () => settle('single'),
      then: (resolve, reject) => Promise.resolve(settle('many')).then(resolve, reject),
    };
    return q;
  };
  return { tables, calls, from, rpc: async (fn, args) => { calls.rpc.push({ fn, args }); return rpcs[fn](args); } };
}
const ALWAYS_S1 = 'target-94912100', ALWAYS_S2 = 'target-15055449', ALWAYS_S3 = 'target-51693821';
const catalog = () => [
  { id: 'p-always-infinity', name: 'Always Infinity FlexFoam', price: '$14.97', url: 'https://www.target.com/x', product_type: 'physical', category: 'pad', is_active: true, requires_prescription: false, extra: {} },
  { id: 'p-single', name: 'Single Option Thing', price: '$12', url: 'https://www.amazon.com/dp/SINGLE?tag=aynahealth-20', product_type: 'physical', category: 'pad', is_active: true, requires_prescription: false, extra: {} },
  { id: 'p-pad', name: 'Pad', price: '$10 - $20', url: 'https://example.com/pad', product_type: 'physical', category: 'pad', is_active: true, requires_prescription: false, extra: { variants: [{ id: 'size-1', label: 'Size 1' }] } },
  { id: 'p-digital', name: 'App', product_type: 'digital', category: 'app', is_active: true, requires_prescription: false, extra: {} },
];
const prices = () => [
  { product_id: 'p-always-infinity', variant_id: ALWAYS_S1, amount: 1497, currency: 'usd', retailer_url: 'https://www.amazon.com/dp/ALWAYS1' },
  { product_id: 'p-always-infinity', variant_id: ALWAYS_S2, amount: 1999, currency: 'usd', retailer_url: 'https://www.amazon.com/dp/ALWAYS2' },
];
// pilot_create_order stand-in: stores the order + items the way the SQL function does.
function createOrderRpc(tables) {
  return async (a) => {
    const existing = tables.pilot_orders.find(o => o.user_id === a.p_user_id && o.attempt_id === a.p_attempt_id);
    if (existing) return existing.cart_key === a.p_cart_key ? { data: existing.id, error: null } : { data: null, error: { message: 'cart mismatch' } };
    const id = `order-${tables.pilot_orders.length + 1}`;
    tables.pilot_orders.push({ id, order_number: 1000 + tables.pilot_orders.length + 1, user_id: a.p_user_id, attempt_id: a.p_attempt_id, product_name: a.p_name, cart_key: a.p_cart_key, status: 'pending', created_at: new Date().toISOString(), stripe_session_id: null, amount: a.p_amount, currency: a.p_currency, subtotal_cents: a.p_subtotal, service_fee_cents: a.p_fee, processing_cents: a.p_processing });
    a.p_items.forEach(i => tables.pilot_order_items.push({ ...i, id: `${id}-item-${i.line_no}`, order_id: id, variant_id: i.variant_id || '' }));
    return { data: id, error: null };
  };
}
const ATTEMPT = '00000000-0000-4000-8000-000000000001';
let tables; let create; let retrieve;
beforeEach(() => {
  vi.unstubAllEnvs(); vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test');
  Object.assign(mocks.config, { enabled: true, paymentMode: 'test', taxIncluded: false });
  mocks.user = { id: 'customer', email: 'customer@example.com' };
  tables = { product_catalog: catalog(), pilot_product_prices: prices(), pilot_orders: [], pilot_order_items: [], pilot_fulfillments: [] };
  mocks.db = fakeDb(tables, { pilot_create_order: createOrderRpc(tables) });
  create = vi.fn(async () => ({ id: 'cs_test_new', status: 'open', livemode: false, url: 'https://checkout.stripe.com/test' }));
  retrieve = vi.fn(async () => ({ id: 'cs_test_new', status: 'open', livemode: false, url: 'https://checkout.stripe.com/test' }));
  mocks.stripe = { checkout: { sessions: { create, retrieve } } };
  mocks.sendOrderEmails = vi.fn(async () => ({ team: true, customer: true }));
  mocks.notifyCustomerUpdate = vi.fn(async () => true);
});

// ---- pure cart rules --------------------------------------------------------
describe('cart items', () => {
  it('merges repeats of the same option but keeps different options as separate lines', () => {
    expect(normalizeCartItems([
      { productId: 'p-always-infinity', variantId: ALWAYS_S1, quantity: 2 },
      { productId: 'p-always-infinity', variantId: ALWAYS_S3, quantity: 1 },
      { productId: 'p-always-infinity', variantId: ALWAYS_S1, quantity: 1 },
    ])).toEqual([
      { productId: 'p-always-infinity', variantId: ALWAYS_S1, quantity: 3 },
      { productId: 'p-always-infinity', variantId: ALWAYS_S3, quantity: 1 },
    ]);
  });
  it('defaults quantity to 1 and rejects bad quantities, ids and sizes of cart', () => {
    expect(normalizeCartItems([{ productId: 'p-single' }])).toEqual([{ productId: 'p-single', variantId: '', quantity: 1 }]);
    for (const quantity of [0, -1, 1.5, '2', MAX_QTY + 1, null]) expect(normalizeCartItems([{ productId: 'p-single', quantity }]), String(quantity)).toBeNull();
    expect(normalizeCartItems([{ productId: 'p-single', quantity: 6 }, { productId: 'p-single', quantity: 5 }])).toBeNull();
    expect(normalizeCartItems([{ productId: '../etc', quantity: 1 }])).toBeNull();
    expect(normalizeCartItems([{ productId: 'p-single', variantId: 'x'.repeat(101) }])).toBeNull();
    expect(normalizeCartItems([])).toBeNull();
    expect(normalizeCartItems('nope')).toBeNull();
    expect(normalizeCartItems(Array.from({ length: 21 }, (_, i) => ({ productId: `p-item-${i}`, quantity: 1 })))).toBeNull();
  });
  it('fingerprints a cart regardless of line order, and distinguishes options and quantities', () => {
    const a = cartKey([{ productId: 'p-a', variantId: '', quantity: 1 }, { productId: 'p-b', variantId: 'x', quantity: 2 }]);
    expect(cartKey([{ productId: 'p-b', variantId: 'x', quantity: 2 }, { productId: 'p-a', variantId: '', quantity: 1 }])).toBe(a);
    expect(cartKey([{ productId: 'p-a', variantId: '', quantity: 2 }, { productId: 'p-b', variantId: 'x', quantity: 2 }])).not.toBe(a);
    expect(cartKey([{ productId: 'p-a', variantId: '', quantity: 1 }, { productId: 'p-b', variantId: 'y', quantity: 2 }])).not.toBe(a);
  });
});

describe('cart totals', () => {
  it('matches the single-item product-page total at quantity 1', () => {
    for (const unit of [500, 1497, 1899, 5999, 50000]) {
      const t = cartTotals([{ unit, quantity: 1 }], {});
      expect(t.total, String(unit)).toBe(checkoutTotalCents(unit, {}));
      expect(t.merchandise + t.fee + t.processing).toBe(t.total);
    }
    expect(cartTotals([{ unit: 1497, quantity: 1 }], {})).toEqual({ merchandise: 1497, fee: 150, processing: 80, total: 1727 });
  });
  it('multiplies by quantity, prices each option on its own, and charges one 30c processing amount per payment', () => {
    const two = cartTotals([{ unit: 1497, quantity: 2 }], {});
    expect(two.merchandise).toBe(2994);
    expect(two.fee).toBe(300);
    const mixed = cartTotals([{ unit: 1497, quantity: 2 }, { unit: 1999, quantity: 1 }, { unit: 1200, quantity: 3 }], {});
    expect(mixed.merchandise).toBe(2994 + 1999 + 3600);
    expect(mixed.fee).toBe(150 * 2 + 200 + 120 * 3);
    // Two separate payments would pay the fixed 30c twice; one combined cart pays it once.
    const separate = cartTotals([{ unit: 1497, quantity: 1 }], {}).total + cartTotals([{ unit: 1999, quantity: 1 }], {}).total;
    expect(cartTotals([{ unit: 1497, quantity: 1 }, { unit: 1999, quantity: 1 }], {}).total).toBeLessThan(separate);
  });
  it('always leaves the item price plus ayna fee after Stripe takes 2.9% + 30c, at the smallest such total', () => {
    for (const lines of [[{ unit: 1497, quantity: 3 }], [{ unit: 799, quantity: 7 }, { unit: 4999, quantity: 2 }], [{ unit: 50, quantity: 1 }]]) {
      const { merchandise, fee, total } = cartTotals(lines, {});
      const kept = t => t - Math.round(t * 0.029) - 30;
      expect(kept(total)).toBeGreaterThanOrEqual(merchandise + fee);
      expect(kept(total - 1)).toBeLessThan(merchandise + fee);
    }
  });
  it('honours the configured fee percent and refuses a bad one', () => {
    expect(cartTotals([{ unit: 1000, quantity: 1 }], { PILOT_SERVICE_FEE_PERCENT: '0' }).fee).toBe(0);
    expect(() => cartTotals([{ unit: 1000, quantity: 1 }], { PILOT_SERVICE_FEE_PERCENT: '99' })).toThrow();
  });
  it('snapshots each line with its own customer unit price and line total', () => {
    const lines = [{ productId: 'p-a', variantId: 's1', name: 'A', variantLabel: 'S1', quantity: 2, unit: 1497, retailerUrl: 'https://x.com/a' }, { productId: 'p-b', variantId: '', name: 'B', variantLabel: null, quantity: 1, unit: 1000, retailerUrl: null }];
    expect(orderItemsPayload(lines, {})).toEqual([
      { line_no: 1, product_id: 'p-a', product_name: 'A', variant_id: 's1', variant_label: 'S1', quantity: 2, retailer_url: 'https://x.com/a', retailer_unit_cents: 1497, customer_unit_cents: 1647, customer_line_cents: 3294 },
      { line_no: 2, product_id: 'p-b', product_name: 'B', variant_id: '', variant_label: null, quantity: 1, retailer_url: null, retailer_unit_cents: 1000, customer_unit_cents: 1100, customer_line_cents: 1100 },
    ]);
    expect(orderSummaryName(lines)).toBe('A — S1 ×2 + 1 more item');
    expect(orderSummaryName([lines[1]])).toBe('B');
  });
  it('builds Stripe lines that keep quantity and IDs, and refuses a mismatched total', () => {
    const order = { currency: 'usd', amount: 3294 + 1100 + 12 + 5, service_fee_cents: 12, processing_cents: 5 };
    const rows = [{ id: 'i1', product_id: 'p-a', variant_id: 's1', product_name: 'A', variant_label: 'S1', quantity: 2, retailer_unit_cents: 1647 }, { id: 'i2', product_id: 'p-b', variant_id: '', product_name: 'B', variant_label: null, quantity: 1, retailer_unit_cents: 1100 }];
    const lines = stripeLineItems(order, rows, { taxIncluded: true });
    expect(lines.map(l => [l.quantity, l.price_data.unit_amount])).toEqual([[2, 1647], [1, 1100], [1, 12], [1, 5]]);
    expect(lines[0].price_data.product_data.metadata).toEqual({ ayna_item_id: 'i1', product_id: 'p-a', variant_id: 's1' });
    expect(lines.every(l => l.price_data.tax_behavior === 'inclusive')).toBe(true);
    expect(() => stripeLineItems({ ...order, amount: order.amount + 1 }, rows)).toThrow('does not match');
  });
});

// ---- checkout API --------------------------------------------------------------
describe('cart quote', () => {
  it('prices each size on its own, multiplies by quantity, and never exposes the retailer link', async () => {
    mocks.user = null;
    const r = res();
    await checkout({ method: 'POST', headers: {}, body: { action: 'quote', items: [{ productId: 'p-always-infinity', variantId: ALWAYS_S1, quantity: 2 }, { productId: 'p-always-infinity', variantId: ALWAYS_S2, quantity: 1 }] } }, r);
    expect(r.code).toBe(200);
    expect(r.body.ready).toBe(true);
    expect(r.body.lines.map(l => [l.variantId, l.quantity, l.unitCents, l.lineCents])).toEqual([[ALWAYS_S1, 2, 1497, 2994], [ALWAYS_S2, 1, 1999, 1999]]);
    expect(r.body.totals).toEqual(cartTotals([{ unit: 1497, quantity: 2 }, { unit: 1999, quantity: 1 }], {}));
    expect(JSON.stringify(r.body)).not.toMatch(/amazon|retailer|target\.com/i);
  });
  it('does not borrow another size\'s price: an unpriced size blocks the whole cart', async () => {
    const r = res();
    await checkout({ method: 'POST', headers: {}, body: { action: 'quote', items: [{ productId: 'p-always-infinity', variantId: ALWAYS_S1, quantity: 1 }, { productId: 'p-always-infinity', variantId: ALWAYS_S3, quantity: 1 }] } }, r);
    expect(r.body.ready).toBe(false);
    expect(r.body.totals).toBeNull();
    expect(r.body.lines.map(l => [l.variantId, l.available, l.reason])).toEqual([[ALWAYS_S1, true, null], [ALWAYS_S3, false, 'price_needed']]);
  });
  it('rejects unknown options, digital products and invalid carts', async () => {
    const quote = async items => { const r = res(); await checkout({ method: 'POST', headers: {}, body: { action: 'quote', items } }, r); return r; };
    expect((await quote([{ productId: 'p-always-infinity', variantId: 'made-up', quantity: 1 }])).body.lines[0].reason).toBe('unavailable');
    expect((await quote([{ productId: 'p-always-infinity', quantity: 1 }])).body.lines[0].reason).toBe('unavailable');
    expect((await quote([{ productId: 'p-digital', quantity: 1 }])).body.lines[0].reason).toBe('unavailable');
    expect((await quote([{ productId: 'missing-product', quantity: 1 }])).body.lines[0].reason).toBe('unavailable');
    expect((await quote([{ productId: 'p-single', quantity: 0 }])).code).toBe(400);
  });
  it('uses an exact catalog price only in test mode for a product without options; live needs a confirmed price', async () => {
    const items = [{ productId: 'p-single', quantity: 1 }];
    let r = res(); await checkout({ method: 'POST', headers: {}, body: { action: 'quote', items } }, r);
    expect(r.body.lines[0]).toMatchObject({ available: true, unitCents: 1200 });
    mocks.config.paymentMode = 'live';
    r = res(); await checkout({ method: 'POST', headers: {}, body: { action: 'quote', items } }, r);
    expect(r.body.lines[0]).toMatchObject({ available: false, reason: 'price_needed' });
    // A range is never a price, in any mode.
    mocks.config.paymentMode = 'test';
    r = res(); await checkout({ method: 'POST', headers: {}, body: { action: 'quote', items: [{ productId: 'p-pad', variantId: 'size-1', quantity: 1 }] } }, r);
    expect(r.body.lines[0].reason).toBe('price_needed');
  });
  it('product page price follows the chosen size and quantity', async () => {
    const get = async (variantId, quantity) => { const r = res(); await checkout({ method: 'GET', query: { productId: 'p-always-infinity', variantId, quantity: String(quantity) } }, r); return r.body; };
    const s1 = await get(ALWAYS_S1, 1), s1x3 = await get(ALWAYS_S1, 3), s2 = await get(ALWAYS_S2, 1), s3 = await get(ALWAYS_S3, 1);
    expect(s1).toMatchObject({ enabled: true, unitCents: 1497, total: 1727, quantity: 1 });
    expect(s1x3.total).toBe(cartTotals([{ unit: 1497, quantity: 3 }], {}).total);
    expect(s2).toMatchObject({ enabled: true, unitCents: 1999 });
    expect(s2.total).not.toBe(s1.total);
    expect(s3).toMatchObject({ enabled: false, requestable: true, total: null });
    expect((await get(ALWAYS_S1, 11)).enabled).toBe(false);
  });
});

describe('creating a checkout', () => {
  const cartBody = (over = {}) => ({ attemptId: ATTEMPT, source: 'cart', items: [{ productId: 'p-always-infinity', variantId: ALWAYS_S1, quantity: 2 }, { productId: 'p-always-infinity', variantId: ALWAYS_S2, quantity: 1 }, { productId: 'p-single', quantity: 3 }], ...over });
  it('charges one payment for the whole cart, with exact options, quantities and fee lines', async () => {
    const r = res();
    // The browser also tries to dictate a price; it must be ignored.
    await checkout({ method: 'POST', headers: {}, body: cartBody({ amount: 1, price: 1, total: 1, items: cartBody().items.map(i => ({ ...i, unitCents: 1, price: 1 })) }) }, r);
    expect(r.code).toBe(200);
    expect(r.body.url).toBe('https://checkout.stripe.com/test');
    const expected = cartTotals([{ unit: 1497, quantity: 2 }, { unit: 1999, quantity: 1 }, { unit: 1200, quantity: 3 }], {});
    const rpc = mocks.db.calls.rpc[0].args;
    expect(rpc).toMatchObject({ p_amount: expected.total, p_subtotal: expected.merchandise, p_fee: expected.fee, p_processing: expected.processing, p_currency: 'usd' });
    expect(rpc.p_items.map(i => [i.product_id, i.variant_id, i.quantity, i.retailer_unit_cents, i.retailer_url])).toEqual([
      ['p-always-infinity', ALWAYS_S1, 2, 1497, 'https://www.amazon.com/dp/ALWAYS1'],
      ['p-always-infinity', ALWAYS_S2, 1, 1999, 'https://www.amazon.com/dp/ALWAYS2'],
      ['p-single', '', 3, 1200, 'https://www.amazon.com/dp/SINGLE'],
    ]);
    const session = create.mock.calls[0][0];
    expect(session.line_items.map(l => [l.quantity, l.price_data.unit_amount])).toEqual([[2, 1497], [1, 1999], [3, 1200], [1, expected.fee], [1, expected.processing]]);
    expect(session.line_items.reduce((sum, l) => sum + l.quantity * l.price_data.unit_amount, 0)).toBe(expected.total);
    expect(session.line_items[0].price_data.product_data.metadata).toMatchObject({ product_id: 'p-always-infinity', variant_id: ALWAYS_S1 });
    expect(session.line_items[1].price_data.product_data.metadata).toMatchObject({ variant_id: ALWAYS_S2 });
    expect(session.line_items[0].price_data.product_data.name).toContain('Size 1');
    expect(session.metadata).toMatchObject({ ayna_order_id: 'order-1' });
    expect(session.cancel_url).toBe('https://test.example.com/pilot/cart?pilot_cancelled=1');
    expect(session.success_url).toContain('/pilot/orders?paid=1&order=order-1');
    expect(session.shipping_address_collection).toEqual({ allowed_countries: ['US'] });
    expect(tables.pilot_orders[0]).toMatchObject({ stripe_session_id: 'cs_test_new', amount: expected.total });
    expect(tables.pilot_order_items).toHaveLength(3);
  });
  it('Buy now goes through the same pricing with a quantity', async () => {
    const r = res();
    await checkout({ method: 'POST', headers: {}, body: { attemptId: ATTEMPT, productId: 'p-always-infinity', variantId: ALWAYS_S2, quantity: 3 } }, r);
    expect(r.code).toBe(200);
    expect(mocks.db.calls.rpc[0].args.p_items).toHaveLength(1);
    expect(mocks.db.calls.rpc[0].args).toMatchObject({ p_subtotal: 5997, p_amount: cartTotals([{ unit: 1999, quantity: 3 }], {}).total });
    expect(create.mock.calls[0][0].line_items[0]).toMatchObject({ quantity: 3 });
    expect(create.mock.calls[0][0].cancel_url).toContain('/pilot/orders?pilot_cancelled=1');
  });
  it('keeps Stripe Tax inside the fixed total when enabled', async () => {
    mocks.config.taxIncluded = true;
    await checkout({ method: 'POST', headers: {}, body: cartBody() }, res());
    const session = create.mock.calls[0][0];
    expect(session.automatic_tax).toEqual({ enabled: true });
    expect(session.line_items.every(l => l.price_data.tax_behavior === 'inclusive')).toBe(true);
  });
  it('refuses to charge when any item has no confirmed price, and creates nothing', async () => {
    const r = res();
    await checkout({ method: 'POST', headers: {}, body: cartBody({ items: [{ productId: 'p-always-infinity', variantId: ALWAYS_S1, quantity: 1 }, { productId: 'p-always-infinity', variantId: ALWAYS_S3, quantity: 1 }] }) }, r);
    expect(r.code).toBe(409);
    expect(r.body.error).toMatch(/price/i);
    expect(r.body.lines.find(l => l.variantId === ALWAYS_S3).reason).toBe('price_needed');
    expect(mocks.db.calls.rpc).toHaveLength(0);
    expect(create).not.toHaveBeenCalled();
    expect(tables.pilot_orders).toHaveLength(0);
  });
  it('says the cart database update is missing, instead of a vague error, when pilot_create_order does not exist', async () => {
    mocks.db = fakeDb(tables, { pilot_create_order: async () => ({ data: null, error: { code: 'PGRST202', message: 'Could not find the function public.pilot_create_order in the schema cache' } }) });
    const r = res(); await checkout({ method: 'POST', headers: {}, body: cartBody() }, r);
    expect(r.code).toBe(503);
    expect(r.body.error).toMatch(/pilot_cart\.sql/);
    expect(create).not.toHaveBeenCalled();
    // Any other database failure keeps the generic message and leaks nothing.
    mocks.db = fakeDb(tables, { pilot_create_order: async () => ({ data: null, error: { code: '23505', message: 'secret internal detail' } }) });
    const generic = res(); await checkout({ method: 'POST', headers: {}, body: cartBody() }, generic);
    expect(generic.code).toBe(503);
    expect(JSON.stringify(generic.body)).not.toContain('secret internal detail');
  });
  it('refuses unavailable items and bad requests', async () => {
    let r = res(); await checkout({ method: 'POST', headers: {}, body: cartBody({ items: [{ productId: 'p-digital', quantity: 1 }] }) }, r);
    expect(r.code).toBe(409);
    for (const items of [[{ productId: 'p-single', quantity: 0 }], [{ productId: 'p-single', quantity: 11 }], [], undefined]) {
      r = res(); await checkout({ method: 'POST', headers: {}, body: { attemptId: ATTEMPT, items } }, r);
      expect(r.code).toBe(400);
    }
    r = res(); await checkout({ method: 'POST', headers: {}, body: cartBody({ attemptId: 'not-a-uuid' }) }, r);
    expect(r.code).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
  it('requires sign-in', async () => {
    mocks.user = null;
    const r = res(); await checkout({ method: 'POST', headers: {}, body: cartBody() }, r);
    expect(r.code).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });
  it('a retried attempt reuses the same order and Stripe session', async () => {
    const first = res(); await checkout({ method: 'POST', headers: {}, body: cartBody() }, first);
    const again = res(); await checkout({ method: 'POST', headers: {}, body: cartBody({ items: [...cartBody().items].reverse() }) }, again);
    expect(again.code).toBe(200);
    expect(again.body.url).toBe(first.body.url);
    expect(mocks.db.calls.rpc).toHaveLength(1);
    expect(tables.pilot_orders).toHaveLength(1);
    expect(create).toHaveBeenCalledTimes(1);
    expect(retrieve).toHaveBeenCalledWith('cs_test_new');
  });
  it('a changed cart cannot reuse an earlier attempt (and a price change cannot alter an open checkout)', async () => {
    await checkout({ method: 'POST', headers: {}, body: cartBody() }, res());
    const r = res();
    await checkout({ method: 'POST', headers: {}, body: cartBody({ items: [{ productId: 'p-single', quantity: 1 }] }) }, r);
    expect(r.code).toBe(409);
    expect(r.body.restart).toBe(true);
    // The admin changes a price after checkout started; the saved order is unchanged.
    tables.pilot_product_prices[0].amount = 9999;
    const total = tables.pilot_orders[0].amount;
    await checkout({ method: 'POST', headers: {}, body: cartBody() }, res());
    expect(tables.pilot_orders[0].amount).toBe(total);
  });
  it('does not start a second charge for an order that is already paid', async () => {
    await checkout({ method: 'POST', headers: {}, body: cartBody() }, res());
    tables.pilot_orders[0].status = 'paid';
    const r = res(); await checkout({ method: 'POST', headers: {}, body: cartBody() }, r);
    expect(r.body).toMatchObject({ restart: true, url: 'https://test.example.com/pilot/orders?order=order-1' });
    expect(create).toHaveBeenCalledTimes(1);
  });
  it('refuses to open a checkout whose Stripe mode does not match', async () => {
    create.mockResolvedValueOnce({ id: 'cs_live_x', status: 'open', livemode: true, url: 'https://checkout.stripe.com/live' });
    const r = res(); await checkout({ method: 'POST', headers: {}, body: cartBody() }, r);
    expect(r.code).toBe(503);
  });
  it('refuses a stored order whose lines do not add up to its total', async () => {
    await checkout({ method: 'POST', headers: {}, body: cartBody() }, res());
    tables.pilot_orders[0].stripe_session_id = null;
    tables.pilot_orders[0].amount += 1;
    create.mockClear();
    const r = res(); await checkout({ method: 'POST', headers: {}, body: cartBody() }, r);
    expect(r.code).toBe(503);
    expect(create).not.toHaveBeenCalled();
  });
});

// ---- webhook ---------------------------------------------------------------------
describe('payment webhook', () => {
  const stripe = new Stripe('sk_test_example');
  function event(type = 'checkout.session.completed', over = {}) {
    const payload = JSON.stringify({ id: 'evt_1', type, livemode: false, data: { object: { id: 'cs_test_1', payment_status: 'paid', mode: 'payment', livemode: false, amount_total: 4544, currency: 'usd', client_reference_id: 'u1', metadata: { ayna_order_id: 'order-1' }, customer_details: { email: 'buyer@example.com' }, collected_information: { shipping_details: { name: 'Buyer' } }, ...over } } });
    const req = Readable.from([payload]); req.method = 'POST';
    req.headers = { 'stripe-signature': stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_test' }) };
    return req;
  }
  let wtables; let recorded;
  beforeEach(() => {
    mocks.stripe = stripe; recorded = [];
    wtables = { pilot_orders: [{ id: 'order-1', status: 'pending' }] };
    mocks.db = fakeDb(wtables, { pilot_record_payment: async (a) => { recorded.push(a); wtables.pilot_orders[0].status = 'paid'; return { data: null, error: null }; } });
  });
  it('records a verified payment once and emails the team and customer on the first delivery only', async () => {
    let r = res(); await webhook(event(), r);
    expect(r.code).toBe(200);
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({ p_order_id: 'order-1', p_session_id: 'cs_test_1', p_amount: 4544, p_currency: 'usd', p_user_id: 'u1', p_email: 'buyer@example.com' });
    expect(mocks.sendOrderEmails).toHaveBeenCalledTimes(1);
    expect(mocks.sendOrderEmails.mock.calls[0][1]).toBe('order-1');
    r = res(); await webhook(event(), r); // Stripe replays the same event
    expect(r.code).toBe(200);
    expect(mocks.sendOrderEmails).toHaveBeenCalledTimes(1);
  });
  it('still reports success when the notification step fails, because the order is already saved', async () => {
    mocks.sendOrderEmails = vi.fn(async () => { throw new Error('resend down'); });
    const r = res(); await webhook(event(), r);
    expect(r.code).toBe(200);
    expect(wtables.pilot_orders[0].status).toBe('paid');
  });
  it('returns an error so Stripe retries when the payment cannot be recorded, and sends no email', async () => {
    mocks.db = fakeDb(wtables, { pilot_record_payment: async () => ({ data: null, error: { message: 'payment mismatch' } }) });
    const r = res(); await webhook(event(), r);
    expect(r.code).toBe(500);
    expect(mocks.sendOrderEmails).not.toHaveBeenCalled();
  });
  it('ignores unpaid sessions and unrelated events', async () => {
    let r = res(); await webhook(event('checkout.session.completed', { payment_status: 'unpaid' }), r);
    expect(r.code).toBe(200);
    r = res(); await webhook(event('payment_intent.created'), r);
    expect(r.code).toBe(200);
    expect(recorded).toHaveLength(0);
    expect(mocks.sendOrderEmails).not.toHaveBeenCalled();
  });
  it('rejects a forged signature before touching the database', async () => {
    const req = Readable.from(['{}']); req.method = 'POST'; req.headers = { 'stripe-signature': 'forged' };
    const r = res(); await webhook(req, r);
    expect(r.code).toBe(400);
    expect(recorded).toHaveLength(0);
  });
});

// ---- orders API -------------------------------------------------------------------
describe('orders API', () => {
  const OID = '00000000-0000-4000-8000-0000000000aa';
  const itemRow = (n, over = {}) => ({ id: `i${n}`, order_id: OID, line_no: n, product_id: `p-${n}`, product_name: `Product ${n}`, variant_id: '', variant_label: n === 1 ? 'Size 1' : null, quantity: n, retailer_url: `https://www.amazon.com/dp/R${n}`, retailer_unit_cents: 1000, customer_unit_cents: 1100, customer_line_cents: 1100 * n, item_status: 'needs_purchase', retailer_name: null, retailer_order_number: null, actual_cost_cents: null, carrier: null, tracking_number: null, tracking_url: null, estimated_delivery: null, shipped_at: null, purchased_at: null, internal_notes: 'INTERNAL', ...over });
  let otables;
  beforeEach(() => {
    // One row object serves as both the table row and the embedded relation, like the real database.
    const fulfillment = { order_id: OID, status: 'awaiting_fulfillment', shipping: { name: 'Buyer' }, customer_email: 'buyer@example.com', shipped_at: null, customer_notified_at: null, team_notified_at: 'x', customer_confirmed_at: 'y' };
    const items = [itemRow(1), itemRow(2)];
    otables = {
      pilot_orders: [{ id: OID, order_number: 1001, user_id: 'customer', product_name: 'Product 1 + 1 more item', amount: 3600, currency: 'usd', status: 'paid', created_at: '2026-10-04T12:00:00Z', subtotal_cents: 3000, service_fee_cents: 300, processing_cents: 300, pilot_fulfillments: [fulfillment], pilot_order_items: items }],
      pilot_order_items: items,
      pilot_fulfillments: [fulfillment],
    };
    mocks.db = fakeDb(otables);
  });
  it('shows a customer only customer-safe fields', async () => {
    mocks.user = { id: 'customer' };
    const r = res(); await orders({ method: 'GET', query: {} }, r);
    expect(r.code).toBe(200);
    const text = JSON.stringify(r.body);
    for (const secret of ['amazon.com', 'INTERNAL', 'retailer_unit_cents', 'retailer_url', 'actual_cost', 'retailer_order_number', 'team_notified_at', 'customer_email']) expect(text, secret).not.toContain(secret);
    expect(r.body.orders[0].items.map(i => [i.product_name, i.variant_label, i.quantity, i.customer_line_cents])).toEqual([['Product 1', 'Size 1', 1, 1100], ['Product 2', null, 2, 2200]]);
    expect(r.body.orders[0]).toMatchObject({ order_number: 1001, subtotal_cents: 3000, amount: 3600 });
  });
  it('shows admins the retailer link, expected cost and email status', async () => {
    mocks.user = { id: 'admin' };
    const r = res(); await orders({ method: 'GET', query: { admin: '1' } }, r);
    expect(r.body.orders[0].items[0]).toMatchObject({ retailer_url: 'https://www.amazon.com/dp/R1', retailer_unit_cents: 1000, internal_notes: 'INTERNAL' });
    expect(r.body.orders[0].fulfillment).toMatchObject({ customer_email: 'buyer@example.com', team_notified_at: 'x' });
  });
  it('lets only admins change items, resend emails, or read the inbox', async () => {
    mocks.user = { id: 'customer' };
    for (const req of [{ method: 'PATCH', body: { orderId: OID, items: [] } }, { method: 'GET', query: { admin: '1' } }]) { const r = res(); await orders(req, r); expect(r.code).toBe(403); }
  });
  const patch = (body) => ({ method: 'PATCH', query: {}, body: { orderId: OID, ...body } });
  it('saves each item separately: one shipped with its own tracking while another is still processing', async () => {
    mocks.user = { id: 'admin' };
    const r = res();
    await orders(patch({ items: [
      { id: 'i1', item_status: 'shipped', retailer_name: 'Amazon', retailer_order_number: '111-1', actual_cost: '10.99', carrier: 'UPS', tracking_number: '1Z-ONE' },
      { id: 'i2', item_status: 'processing', retailer_name: 'Target', internal_notes: 'backordered' },
    ] }), r);
    expect(r.code).toBe(200);
    expect(r.body).toMatchObject({ saved: true, emailed: false, notified: false });
    const [one, two] = otables.pilot_order_items;
    expect(one).toMatchObject({ item_status: 'shipped', carrier: 'UPS', tracking_number: '1Z-ONE', actual_cost_cents: 1099, retailer_order_number: '111-1', updated_by: 'admin' });
    expect(one.tracking_url).toContain('ups.com');
    expect(one.shipped_at).toEqual(expect.any(String));
    expect(two).toMatchObject({ item_status: 'processing', tracking_number: null, shipped_at: null, purchased_at: expect.any(String) });
    expect(otables.pilot_fulfillments[0].status).toBe('awaiting_fulfillment');
    expect(mocks.notifyCustomerUpdate).not.toHaveBeenCalled();
  });
  it('marks the order shipped only once every item has shipped, with separate tracking numbers', async () => {
    mocks.user = { id: 'admin' };
    await orders(patch({ items: [{ id: 'i1', item_status: 'shipped', carrier: 'UPS', tracking_number: 'A1' }, { id: 'i2', item_status: 'shipped', carrier: 'USPS', tracking_number: 'B2' }] }), res());
    expect(otables.pilot_order_items.map(i => i.tracking_number)).toEqual(['A1', 'B2']);
    expect(otables.pilot_fulfillments[0].status).toBe('shipped');
  });
  it('sends the customer update only when asked, with the saved items, and not twice in a row', async () => {
    mocks.user = { id: 'admin' };
    let r = res();
    await orders(patch({ notify: true, items: [{ id: 'i1', item_status: 'shipped', carrier: 'UPS', tracking_number: 'A1' }] }), r);
    expect(r.body).toMatchObject({ saved: true, emailed: true, duplicate: false });
    expect(mocks.notifyCustomerUpdate).toHaveBeenCalledTimes(1);
    const [order, items, shipping, email] = mocks.notifyCustomerUpdate.mock.calls[0];
    expect(order.order_number).toBe(1001);
    expect(items.map(i => [i.id, i.item_status])).toEqual([['i1', 'shipped'], ['i2', 'needs_purchase']]);
    expect([shipping.name, email]).toEqual(['Buyer', 'buyer@example.com']);
    expect(otables.pilot_fulfillments[0].customer_notified_at).toEqual(expect.any(String));
    r = res(); await orders(patch({ notify: true, items: [{ id: 'i1', item_status: 'shipped', carrier: 'UPS', tracking_number: 'A1' }] }), r);
    expect(r.body).toMatchObject({ saved: true, emailed: false, duplicate: true });
    expect(mocks.notifyCustomerUpdate).toHaveBeenCalledTimes(1);
  });
  it('keeps the work saved and says so when the customer email fails', async () => {
    mocks.user = { id: 'admin' }; mocks.notifyCustomerUpdate = vi.fn(async () => false);
    const r = res(); await orders(patch({ notify: true, items: [{ id: 'i1', item_status: 'shipped', carrier: 'UPS', tracking_number: 'A1' }] }), r);
    expect(r.body).toMatchObject({ saved: true, emailed: false });
    expect(otables.pilot_order_items[0].tracking_number).toBe('A1');
    expect(otables.pilot_fulfillments[0].customer_notified_at).toBeNull();
  });
  it('rejects bad item details and items from another order without saving anything', async () => {
    mocks.user = { id: 'admin' };
    for (const items of [[{ id: 'i1', item_status: 'shipped', tracking_url: 'javascript:alert(1)' }], [{ id: 'not-in-this-order', item_status: 'shipped' }], [{ id: 'i1', item_status: 'delivered-ish' }]]) {
      const r = res(); await orders(patch({ items }), r);
      expect(r.code).toBe(400);
    }
    expect(otables.pilot_order_items.every(i => i.item_status === 'needs_purchase')).toBe(true);
  });
  it('does not touch unpaid orders', async () => {
    mocks.user = { id: 'admin' }; otables.pilot_orders[0].status = 'pending';
    const r = res(); await orders(patch({ items: [{ id: 'i1', item_status: 'shipped' }] }), r);
    expect(r.code).toBe(404);
  });
  it('lets an admin retry the emails that failed', async () => {
    mocks.user = { id: 'admin' };
    let r = res(); await orders(patch({ action: 'resend_team' }), r);
    expect(r.body).toMatchObject({ saved: true, emailed: true });
    expect(mocks.sendOrderEmails).toHaveBeenCalledWith(expect.anything(), OID, null, { only: 'team' });
    r = res(); await orders(patch({ action: 'resend_customer' }), r);
    expect(mocks.sendOrderEmails).toHaveBeenLastCalledWith(expect.anything(), OID, null, { only: 'customer' });
  });
});
