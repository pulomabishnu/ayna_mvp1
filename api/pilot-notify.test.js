import { describe, it, expect, vi } from 'vitest';
import { notifyTeam, teamRecipients } from './_pilot.js';

const order = { product_name: 'Always Infinity FlexFoam', amount: 800, currency: 'usd' };
const session = { livemode: false, collected_information: { shipping_details: { name: 'Test Buyer', address: { line1: '1 Secret St', city: 'New York', state: 'NY' } } } };
const env = { RESEND_API_KEY: 're_test', PILOT_APP_URL: 'https://preview.example.com' };

describe('manual-fulfillment team notification', () => {
  it('emails the team with the inbox link but not the street address', async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    expect(await notifyTeam(order, session, { env, send })).toBe(true);
    const body = JSON.parse(send.mock.calls[0][1].body);
    expect(body.subject).toContain('[TEST]');
    expect(body.subject).toContain('$8.00');
    expect(body.text).toContain('https://preview.example.com/pilot/admin');
    expect(body.text).toContain('New York, NY');
    expect(body.text + body.html).not.toContain('Secret St');
    expect(body.to).toEqual(teamRecipients({}));
  });
  it('skips quietly without an email key and never throws on send failure', async () => {
    const send = vi.fn();
    expect(await notifyTeam(order, session, { env: { PILOT_APP_URL: env.PILOT_APP_URL }, send })).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(await notifyTeam(order, session, { env, send: vi.fn().mockRejectedValue(new Error('down')) })).toBe(false);
  });
  it('escapes customer-supplied names in the HTML email', async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    await notifyTeam(order, { ...session, collected_information: { shipping_details: { name: '<img src=x>' } } }, { env, send });
    expect(JSON.parse(send.mock.calls[0][1].body).html).not.toContain('<img');
  });
  it('honours PILOT_NOTIFY_EMAILS and drops invalid entries', () => {
    expect(teamRecipients({ PILOT_NOTIFY_EMAILS: 'a@b.co, nope, c@d.co' })).toEqual(['a@b.co', 'c@d.co']);
  });
});

import { notifyCustomerShipped } from './_pilot.js';
describe('customer shipped email', () => {
  const env = { RESEND_API_KEY: 're_test', PILOT_APP_URL: 'https://preview.example.com', STRIPE_SECRET_KEY: 'sk_test_x' };
  const tracking = { carrier: 'USPS', tracking_number: '9400 1', tracking_url: 'https://tools.usps.com/x' };
  it('emails the customer with carrier, tracking and order link', async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    expect(await notifyCustomerShipped({ product_name: 'Always Infinity FlexFoam' }, tracking, 'buyer@example.com', { env, send })).toBe(true);
    const body = JSON.parse(send.mock.calls[0][1].body);
    expect(body.to).toEqual(['buyer@example.com']);
    expect(body.subject).toContain('[TEST]');
    expect(body.text).toContain('9400 1');
    expect(body.text).toContain('https://tools.usps.com/x');
    expect(body.text).toContain('https://preview.example.com/pilot/orders');
  });
  it('skips without a valid customer email or key, and escapes HTML', async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    expect(await notifyCustomerShipped({ product_name: 'x' }, tracking, 'not-an-email', { env, send })).toBe(false);
    expect(await notifyCustomerShipped({ product_name: 'x' }, tracking, 'a@b.co', { env: { PILOT_APP_URL: env.PILOT_APP_URL }, send })).toBe(false);
    expect(send).not.toHaveBeenCalled();
    await notifyCustomerShipped({ product_name: 'x' }, { ...tracking, carrier: '<b>x</b>' }, 'a@b.co', { env, send });
    expect(JSON.parse(send.mock.calls[0][1].body).html).not.toContain('<b>x');
  });
});
