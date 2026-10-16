import { afterEach, describe, expect, it, vi } from 'vitest';
import { announcementEmail, claimedEmail, sendCampaignEmail, unlockedEmail } from './_campaignEmail.js';

afterEach(() => vi.unstubAllEnvs());

describe('campaign emails', () => {
  it('announcement says every rule plainly and links to the campaign page', () => {
    const { html, text, subject } = announcementEmail();
    expect(subject).toBe('Give us your thoughts. Get something on us.');
    expect(html).toContain('/free-product?utm_source=campaign_email&amp;utm_campaign=free-product-2026');
    expect(text).toMatch(/120\+ characters/);
    expect(text).toMatch(/sign up and verify/);
    expect(text).toMatch(/new to ayna/);
    expect(text).toMatch(/Verify your account/);
    expect(text).toMatch(/limited, first come first served/);
    expect(text).toMatch(/One free product per person/);
    expect(text).toMatch(/Your claim is final/);
    expect(html).toContain('{{{RESEND_UNSUBSCRIBE_URL}}}');
  });

  it('never uses em dashes (site copy rule)', () => {
    for (const m of [announcementEmail(), unlockedEmail(), claimedEmail({ product: { name: 'X' } })]) {
      expect(m.html).not.toContain('—');
      expect(m.text).not.toContain('—');
    }
  });

  it('escapes product data', () => {
    const { html } = claimedEmail({ product: { name: '<script>alert(1)</script>', brand: 'B&B', image: 'javascript:alert(1)' } });
    expect(html).not.toContain('<script>alert(1)');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('javascript:alert');
  });

  it('sends nothing unless CAMPAIGN_EMAILS_ENABLED=1 and a Resend key exist', async () => {
    const fetchImpl = vi.fn();
    vi.stubEnv('RESEND_API_KEY', 'k');
    expect(await sendCampaignEmail('a@b.co', unlockedEmail(), { fetchImpl })).toMatchObject({ ok: false, skipped: true });
    vi.stubEnv('CAMPAIGN_EMAILS_ENABLED', '1');
    vi.stubEnv('RESEND_API_KEY', '');
    expect(await sendCampaignEmail('a@b.co', unlockedEmail(), { fetchImpl })).toMatchObject({ ok: false, skipped: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
