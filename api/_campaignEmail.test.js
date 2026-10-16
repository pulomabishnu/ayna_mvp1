/* global Buffer */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { announcementEmail, claimedEmail, readUnsubscribeToken, unlockedEmail, unsubscribeToken } from './_campaignEmail.js';

beforeEach(() => { vi.stubEnv('EMAIL_UNSUBSCRIBE_SECRET', 'test-secret'); vi.stubEnv('EMAIL_POSTAL_ADDRESS', '123 Test St, New York, NY 10001'); });
afterEach(() => vi.unstubAllEnvs());

describe('unsubscribe tokens', () => {
  it('round-trips and rejects tampering', () => {
    const t = unsubscribeToken('Her@Example.com');
    expect(readUnsubscribeToken(t)).toBe('her@example.com');
    const [payload, sig] = t.split('.');
    const other = Buffer.from('someone@else.com').toString('base64url');
    expect(readUnsubscribeToken(`${other}.${sig}`)).toBeNull();
    expect(readUnsubscribeToken(`${payload}.${sig.slice(0, -2)}xx`)).toBeNull();
    expect(readUnsubscribeToken('garbage')).toBeNull();
  });
});

describe('templates', () => {
  it('announcement says the rules plainly, no false guarantees, has footer', () => {
    const { html, text, subject } = announcementEmail({ email: 'a@b.co', firstName: 'Maya' });
    expect(subject).toBe('give us your thoughts. get something on us.');
    for (const s of [html, text]) {
      expect(s).toMatch(/start earning your free product/);
      expect(s).toMatch(/limited/i);
      expect(s).toMatch(/verif/i);
      expect(s).not.toMatch(/guarantee/i);
      expect(s).not.toMatch(/—/); // no em dashes
    }
    expect(html).toMatch(/Unsubscribe/);
    expect(html).toContain('123 Test St');
    expect(html).toContain('/free-product');
  });
  it('escapes user-controlled values', () => {
    const { html } = claimedEmail({ email: 'a@b.co', productName: '<script>x</script>', productBrand: 'B&B' });
    expect(html).not.toContain('<script>x');
    expect(html).toContain('B&amp;B');
    expect(announcementEmail({ firstName: '<img>' }).html).not.toContain('<img>');
  });
  it('transactional emails exist and stay short', () => {
    expect(unlockedEmail({ email: 'a@b.co' }).text.length).toBeLessThan(600);
  });
});
