import { describe, it, expect } from 'vitest';
import { proBillingEventPayload } from './pro-webhook.js';

describe('proBillingEventPayload', () => {
  it('is anonymous, deduped by Stripe event id, and keyed on the subscription', () => {
    const a = proBillingEventPayload('subscription_renewed', { seed: 'sub_123', plan: 'month', amount: 899, currency: 'usd', eventId: 'evt_1', at: '2027-03-01T00:00:00Z' });
    const b = proBillingEventPayload('subscription_renewed', { seed: 'sub_123', plan: 'month', amount: 899, currency: 'usd', eventId: 'evt_2', at: '2027-04-01T00:00:00Z' });
    expect(a.properties.distinct_id).toMatch(/^pro_checkout_[0-9a-f]{24}$/);
    expect(a.properties.distinct_id).toBe(b.properties.distinct_id);
    expect(a.properties.distinct_id).not.toContain('sub_123');
    expect(a.properties.$insert_id).toBe('subscription_renewed:evt_1');
    expect(a.properties.$process_person_profile).toBe(false);
    expect(a.properties.amount).toBe(8.99);
    expect(a.properties.currency).toBe('USD');
  });
});
