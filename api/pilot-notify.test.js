import { describe, it, expect, vi } from 'vitest';
import { teamRecipients, carrierTrackingUrl, validTracking, serviceFeeCents, validItemUpdate } from './_pilot.js';
import { notifyTeam, notifyCustomerReceived, notifyCustomerUpdate, sendOrderEmails, orderLabel, customerStatusLabel } from './_pilotMail.js';

const env = { RESEND_API_KEY: 're_test', PILOT_APP_URL: 'https://preview.example.com' };
const order = { id: 'order-1', order_number: 1042, amount: 5171, currency: 'usd', subtotal_cents: 4491, service_fee_cents: 449, processing_cents: 231 };
const shipping = { name: 'Test Buyer', address: { line1: '1 Secret St', line2: 'Apt 2', city: 'New York', state: 'NY', postal_code: '10026', country: 'US' } };
const items = [
  { id: 'i1', line_no: 1, product_name: 'Always Infinity FlexFoam', variant_label: 'Size 1 Regular, 60 count', quantity: 2, retailer_url: 'https://www.amazon.com/dp/AAA', retailer_unit_cents: 1497, customer_unit_cents: 1647, customer_line_cents: 3294, item_status: 'shipped', carrier: 'UPS', tracking_number: '1Z999', tracking_url: 'https://www.ups.com/track?tracknum=1Z999', retailer_name: 'Amazon', retailer_order_number: '111-SECRET', actual_cost_cents: 2500, internal_notes: 'INTERNAL ONLY' },
  { id: 'i2', line_no: 2, product_name: 'Cora Organic Pads', variant_label: 'Regular — 32 count', quantity: 1, retailer_url: 'https://www.target.com/p/-/A-1', retailer_unit_cents: 1500, customer_unit_cents: 1650, customer_line_cents: 1650, item_status: 'processing', carrier: null, tracking_number: null, tracking_url: null, retailer_name: null, retailer_order_number: null, actual_cost_cents: null, internal_notes: null },
];

describe('team order notification', () => {
  it('lists every item with exact retailer link, quantity, expected and paid prices, and a secure fulfill link', async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    expect(await notifyTeam(order, items, shipping, 'buyer@example.com', { env, send })).toBe(true);
    const body = JSON.parse(send.mock.calls[0][1].body);
    expect(body.subject).toBe('[TEST] New ayna order #AYNA-1042 – fulfillment needed');
    expect(body.to).toEqual(teamRecipients({}));
    for (const text of [body.text, body.html]) {
      expect(text).toContain('https://www.amazon.com/dp/AAA');
      expect(text).toContain('https://www.target.com/p/-/A-1');
      expect(text).toContain('Size 1 Regular, 60 count');
      expect(text).toContain('$14.97');
      expect(text).toContain('$32.94');
      expect(text).toContain('$51.71');
      expect(text).toContain('buyer@example.com');
      expect(text).toContain('https://preview.example.com/pilot/admin?order=order-1');
    }
    expect(body.text).toContain('× 2');
    expect(body.text).toContain('1 Secret St');
    expect(body.html).toContain('Fulfill order');
  });
  it('flags an item that has no retailer link instead of hiding it', async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    await notifyTeam(order, [{ ...items[0], retailer_url: null }], shipping, null, { env, send });
    const body = JSON.parse(send.mock.calls[0][1].body);
    expect(body.text).toContain('no link saved');
    expect(body.html).toContain('No retailer link saved');
  });
  it('skips quietly without an email key and never throws on send failure', async () => {
    const send = vi.fn();
    expect(await notifyTeam(order, items, shipping, 'a@b.co', { env: { PILOT_APP_URL: env.PILOT_APP_URL }, send })).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(await notifyTeam(order, items, shipping, 'a@b.co', { env, send: vi.fn().mockRejectedValue(new Error('down')) })).toBe(false);
    expect(await notifyTeam(order, items, shipping, 'a@b.co', { env, send: vi.fn().mockResolvedValue({ ok: false, status: 500 }) })).toBe(false);
  });
  it('escapes customer-supplied text in the HTML email', async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    await notifyTeam(order, items, { name: '<img src=x>', address: { line1: '<script>x</script>' } }, 'a@b.co', { env, send });
    const html = JSON.parse(send.mock.calls[0][1].body).html;
    expect(html).not.toContain('<img src=x>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;img src=x&gt;');
  });
  it('honours PILOT_NOTIFY_EMAILS and drops invalid entries', () => {
    expect(teamRecipients({ PILOT_NOTIFY_EMAILS: 'a@b.co, nope, c@d.co' })).toEqual(['a@b.co', 'c@d.co']);
  });
});

describe('customer order confirmation', () => {
  it('confirms receipt with order number, items, quantities, totals and address, without retailer details', async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    expect(await notifyCustomerReceived(order, items, shipping, 'buyer@example.com', { env, send })).toBe(true);
    const body = JSON.parse(send.mock.calls[0][1].body);
    expect(body.to).toEqual(['buyer@example.com']);
    expect(body.subject).toContain('AYNA-1042');
    for (const text of [body.text, body.html]) {
      expect(text).toContain('Cora Organic Pads');
      expect(text).toContain('$51.71');
      expect(text).toContain('Secret St');
      expect(text).not.toContain('amazon.com');
      expect(text).not.toContain('target.com');
    }
    expect(body.text).toContain('Order received');
    expect(body.text).toContain('Hi Test,');
    expect(body.text).toContain('× 2');
    expect(body.html).toContain('$44.91'); // items
    expect(body.html).toContain('$4.49'); // ayna service fee
    expect(body.html).toContain('$2.31'); // processing
  });
  it('skips without a valid email', async () => {
    const send = vi.fn();
    expect(await notifyCustomerReceived(order, items, shipping, 'not-an-email', { env, send })).toBe(false);
    expect(await notifyCustomerReceived(order, items, shipping, null, { env, send })).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('customer fulfillment update', () => {
  it('shows per-item status and tracking, says unshipped items are still processing, and leaks nothing internal', async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    expect(await notifyCustomerUpdate(order, items, shipping, 'buyer@example.com', { env, send })).toBe(true);
    const body = JSON.parse(send.mock.calls[0][1].body);
    expect(body.subject).toBe('[TEST] Update on your ayna order AYNA-1042');
    expect(body.text).toContain('Your ayna order has been processed.');
    expect(body.text).toContain('Size 1 Regular, 60 count × 2: Shipped');
    expect(body.text).toContain('UPS · Tracking # 1Z999');
    expect(body.text).toContain('https://www.ups.com/track?tracknum=1Z999');
    expect(body.text).toContain('Cora Organic Pads — Regular — 32 count × 1: Processing');
    expect(body.text).toContain('Still being prepared');
    expect(body.html).toContain('Track this shipment');
    for (const text of [body.text, body.html]) {
      for (const secret of ['INTERNAL ONLY', '111-SECRET', 'amazon.com', 'target.com', '25.00', '2500', 'Amazon']) expect(text).not.toContain(secret);
    }
  });
  it('only says "on its way" once every item has shipped, and notes missing tracking numbers', async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    const shipped = [items[0], { ...items[1], item_status: 'shipped', carrier: null, tracking_number: null }];
    await notifyCustomerUpdate(order, shipped, shipping, 'buyer@example.com', { env, send });
    const body = JSON.parse(send.mock.calls[0][1].body);
    expect(body.subject).toContain('is on its way');
    expect(body.text).toContain('Tracking will follow in a separate update.');
  });
  it('maps internal statuses to customer-safe labels', () => {
    expect(['needs_purchase', 'purchased', 'processing', 'shipped', 'delivered', 'issue', 'refunded'].map(customerStatusLabel))
      .toEqual(['Processing', 'Processing', 'Processing', 'Shipped', 'Delivered', 'Being looked into', 'Refunded']);
  });
  it('escapes HTML in carrier and product text', async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    await notifyCustomerUpdate(order, [{ ...items[0], carrier: '<b>x</b>', product_name: '<i>p</i>' }], shipping, 'a@b.co', { env, send });
    const html = JSON.parse(send.mock.calls[0][1].body).html;
    expect(html).not.toContain('<b>x');
    expect(html).not.toContain('<i>p');
    expect(html).toContain('&lt;b&gt;x');
  });
  it('labels orders from the order number, falling back to the id', () => {
    expect(orderLabel({ order_number: 1001 })).toBe('AYNA-1001');
    expect(orderLabel({ id: 'abcdef12-3456' })).toBe('AYNA-ABCDEF12');
  });
});

describe('sendOrderEmails', () => {
  function db(rows) {
    const updates = [];
    const chain = (table) => {
      const q = { select: () => q, eq: () => q, order: () => q, single: async () => ({ data: rows[table], error: null }), maybeSingle: async () => ({ data: rows[table], error: null }), then: (r) => Promise.resolve({ data: rows[table], error: null }).then(r), update: (patch) => { updates.push({ table, patch }); return q; } };
      return q;
    };
    return { from: chain, updates };
  }
  const rows = { pilot_orders: order, pilot_order_items: items, pilot_fulfillments: { shipping, customer_email: 'buyer@example.com' } };
  it('sends both emails and records them so only failures need a retry', async () => {
    const d = db(rows); const send = vi.fn().mockResolvedValue({ ok: true });
    expect(await sendOrderEmails(d, 'order-1', null, { env, send })).toEqual({ team: true, customer: true });
    expect(send).toHaveBeenCalledTimes(2);
    expect(d.updates[0].patch).toEqual({ team_notified_at: expect.any(String), customer_confirmed_at: expect.any(String) });
  });
  it('records only what was sent and supports retrying one email', async () => {
    const d = db(rows);
    const send = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 }).mockResolvedValueOnce({ ok: true });
    expect(await sendOrderEmails(d, 'order-1', null, { env, send })).toEqual({ team: false, customer: true });
    expect(d.updates[0].patch).toEqual({ customer_confirmed_at: expect.any(String) });
    const retry = db(rows);
    expect(await sendOrderEmails(retry, 'order-1', null, { only: 'team', env, send: vi.fn().mockResolvedValue({ ok: true }) })).toEqual({ team: true });
    expect(retry.updates[0].patch).toEqual({ team_notified_at: expect.any(String) });
  });
});

describe('carrier tracking links', () => {
  it('builds links for common carriers and leaves unknown carriers blank', () => {
    expect(carrierTrackingUrl('USPS', '9400 1000')).toBe('https://tools.usps.com/go/TrackConfirmAction?tLabels=94001000');
    expect(carrierTrackingUrl('UPS', '1Z9')).toContain('ups.com');
    expect(carrierTrackingUrl('FedEx', '12')).toContain('fedex.com');
    expect(carrierTrackingUrl('Bob\'s Couriers', '12')).toBeNull();
  });
  it('fills the link automatically but keeps one the admin typed', () => {
    expect(validTracking({ carrier: 'USPS', tracking_number: '9400' }).tracking_url).toContain('usps.com');
    expect(validTracking({ carrier: 'USPS', tracking_number: '9400', tracking_url: 'https://example.com/t' }).tracking_url).toBe('https://example.com/t');
  });
});

describe('per-item fulfillment form validation', () => {
  const base = { item_status: 'shipped', carrier: 'USPS', tracking_number: '9400 1' };
  it('accepts a complete shipped item and fills the carrier link', () => {
    expect(validItemUpdate({ ...base, retailer_name: 'Amazon', retailer_order_number: '111-1', actual_cost: '$14.97', estimated_delivery: '2026-10-12', internal_notes: 'ok' }))
      .toMatchObject({ item_status: 'shipped', actual_cost_cents: 1497, estimated_delivery: '2026-10-12', tracking_url: expect.stringContaining('usps.com') });
  });
  it('allows an item with no tracking yet', () => {
    expect(validItemUpdate({ item_status: 'purchased' })).toMatchObject({ item_status: 'purchased', tracking_number: null, tracking_url: null, actual_cost_cents: null });
  });
  it('rejects unknown statuses, executable links, bad dates and bad amounts', () => {
    expect(validItemUpdate({ ...base, item_status: 'teleported' })).toBeNull();
    expect(validItemUpdate({ ...base, tracking_url: 'javascript:alert(1)' })).toBeNull();
    expect(validItemUpdate({ ...base, tracking_url: 'http://insecure.example.com' })).toBeNull();
    expect(validItemUpdate({ ...base, estimated_delivery: 'next week' })).toBeNull();
    expect(validItemUpdate({ ...base, actual_cost: 'free' })).toBeNull();
    expect(validItemUpdate({ ...base, carrier: 'x'.repeat(81) })).toBeNull();
  });
});

describe('ayna service fee', () => {
  it('defaults to 10% rounded to the cent, is configurable, and rejects bad values', () => {
    expect(serviceFeeCents(800, {})).toBe(80);
    expect(serviceFeeCents(1299, {})).toBe(130);
    expect(serviceFeeCents(800, { PILOT_SERVICE_FEE_PERCENT: '0' })).toBe(0);
    expect(serviceFeeCents(800, { PILOT_SERVICE_FEE_PERCENT: '15' })).toBe(120);
    expect(() => serviceFeeCents(800, { PILOT_SERVICE_FEE_PERCENT: '100' })).toThrow();
    expect(() => serviceFeeCents(800, { PILOT_SERVICE_FEE_PERCENT: 'ten' })).toThrow();
  });
});
