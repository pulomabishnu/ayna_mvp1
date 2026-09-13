import { describe, expect, it } from 'vitest';
import { sanitizePosthogEvent } from './posthogPrivacy.js';

describe('sanitizePosthogEvent', () => {
  it('removes direct identifiers, health answers, messages, tokens and raw search text', () => {
    const event = sanitizePosthogEvent({
      event: 'product_opened',
      properties: {
        productId: 'p-123',
        category: 'period-care',
        email: 'person@example.com',
        phone_number: '+1 212 555 1212',
        user_id: 'supabase-user-id',
        searchQuery: 'pregnant and severe cramps',
        symptoms: ['cramps'],
        pregnancy_status: 'pregnant',
        message_body: 'very private health text',
        access_token: 'secret',
      },
    });

    expect(event.properties).toEqual({ productId: 'p-123', category: 'period-care' });
  });

  it('strips query strings and hashes from analytics URLs', () => {
    const event = sanitizePosthogEvent({
      event: '$pageview',
      properties: {
        $current_url: 'https://www.aynahealth.co/discovery?q=pcos#results',
        $referrer: 'https://www.aynahealth.co/?email=test@example.com',
      },
    });

    expect(event.properties.$current_url).toBe('https://www.aynahealth.co/discovery');
    expect(event.properties.$referrer).toBe('https://www.aynahealth.co/');
  });

  it('redacts accidental email and phone values in otherwise safe string fields', () => {
    const event = sanitizePosthogEvent({
      event: 'support_opened',
      properties: { source: 'contact person@example.com or 212-555-1212' },
    });

    expect(event.properties.source).not.toContain('person@example.com');
    expect(event.properties.source).not.toContain('212-555-1212');
  });
});
