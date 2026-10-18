import { describe, it, expect } from 'vitest';
import { buildSuggestionRow, cleanLink } from './suggestions.js';

describe('buildSuggestionRow', () => {
  it('keeps only suggestion text, never identity fields', () => {
    const { row } = buildSuggestionRow({ kind: 'product', productName: ' Thinx ', link: 'thinx.com', reason: 'comfy', context: 'shop', userId: 'abc', email: 'a@b.co', name: 'Maya' });
    expect(row).toEqual({ kind: 'product', product_name: 'Thinx', link: 'https://thinx.com/', reason: 'comfy', topic: null, context: 'shop', platform: 'web' });
  });
  it('validates reads and unknown contexts', () => {
    expect(buildSuggestionRow({ kind: 'read', topic: 'Cycle changes after 35', context: 'evil', platform: 'app' }).row).toMatchObject({ kind: 'read', topic: 'Cycle changes after 35', context: null, platform: 'app' });
    expect(buildSuggestionRow({ kind: 'read', topic: 'x' }).error).toBeTruthy();
    expect(buildSuggestionRow({ kind: 'nope' }).error).toBeTruthy();
    expect(buildSuggestionRow({ kind: 'product', productName: '' }).error).toBeTruthy();
  });
  it('rejects non-http links', () => {
    expect(cleanLink('javascript:alert(1)')).toBe(null);
    expect(cleanLink('')).toBe('');
  });
});

import { suggestionEmail, TEAM_EMAILS } from './suggestions.js';
describe('suggestion email to the founders', () => {
  it('goes to Ameera, Eliz and Puloma with only what was typed', () => {
    const e = suggestionEmail({ kind: 'product', product_name: 'Bad <b>cramp</b> patch', link: null, reason: 'helps', topic: null, context: 'shop', platform: 'web' });
    expect(TEAM_EMAILS()).toEqual(['ameera@aynahealth.co', 'eliz@aynahealth.co', 'puloma@aynahealth.co']);
    expect(e.to).toEqual(TEAM_EMAILS());
    expect(e.subject).toMatch(/Bad <b>cramp<\/b> patch/);
    expect(e.html).not.toMatch(/<b>cramp/);
    expect(e.text).toMatch(/Why: helps/);
  });
});

describe('sendSuggestionEmail', () => {
  it('sends one message through Resend and reports success', async () => {
    const prev = process.env.RESEND_API_KEY; process.env.RESEND_API_KEY = 'test-key';
    const { sendSuggestionEmail, suggestionEmail: build } = await import('./suggestions.js');
    let call = null;
    const ok = await sendSuggestionEmail(build({ kind: 'read', topic: 'PCOS and sleep', context: 'library', platform: 'app' }), async (url, init) => { call = { url, init }; return { ok: true }; });
    expect(ok).toBe(true);
    expect(call.url).toBe('https://api.resend.com/emails');
    const body = JSON.parse(call.init.body);
    expect(body.to).toEqual(['ameera@aynahealth.co', 'eliz@aynahealth.co', 'puloma@aynahealth.co']);
    expect(body.subject).toContain('New read suggestion');
    if (prev === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = prev;
  });
  it('returns false (and does not throw) when Resend rejects it', async () => {
    const prev = process.env.RESEND_API_KEY; process.env.RESEND_API_KEY = 'test-key';
    const { sendSuggestionEmail } = await import('./suggestions.js');
    const ok = await sendSuggestionEmail({ to: [] }, async () => ({ ok: false, status: 403, text: async () => 'domain not verified' }));
    expect(ok).toBe(false);
    if (prev === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = prev;
  });
});
