import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { anonymousResponse, claimSurvey, issueReceipt, readReceipt, saveFeedback } from './_feedbackStore.js';
beforeEach(() => { vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only-secret'); vi.stubEnv('VERCEL_ENV', 'test'); });
afterEach(() => vi.unstubAllEnvs());
describe('anonymous feedback persistence', () => {
  it('claims one survey per account and campaign, even with simultaneous devices', async () => {
    const keys = new Map();
    const store = { set: vi.fn(async (key, value) => { if (keys.has(key)) return null; keys.set(key, value); return 'OK'; }) };
    const claims = await Promise.all([claimSurvey('account-a', store), claimSurvey('account-a', store), claimSurvey('account-b', store)]);
    expect(claims).toEqual([true, false, true]);
    expect([...keys.values()]).toEqual([1, 1]);
    expect([...keys.keys()].join()).not.toContain('account-a');
  });
  it('rejects modified and expired receipts', () => {
    const receipt = issueReceipt('survey');
    expect(readReceipt(receipt).kind).toBe('survey');
    expect(readReceipt(receipt.replace(/.$/, receipt.endsWith('0') ? '1' : '0'))).toBeNull();
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 8 * 86400000);
    expect(readReceipt(receipt)).toBeNull();
    vi.restoreAllMocks();
  });
  it('never copies account, email, IP, or arbitrary client fields into a stored answer', () => {
    const receipt = readReceipt(issueReceipt('purchase', { id: 'pads', name: 'Pads', variant: 'Overnight' }));
    const row = anonymousResponse(receipt, { answer: 'yes', userId: 'secret-user', email: 'private@example.test', ip: '1.1.1.1', productName: 'spoofed' });
    expect(row).toMatchObject({ kind: 'purchase', productName: 'Pads', variant: 'Overnight', answer: 'yes' });
    expect(Object.keys(row).sort()).toEqual(['answer', 'campaign', 'id', 'kind', 'productId', 'productName', 'submittedAt', 'variant'].sort());
    expect(row.submittedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('validates stars and bounded text, retaining optional blank fields', () => {
    const receipt = readReceipt(issueReceipt('survey'));
    expect(anonymousResponse(receipt, { rating: 5, feedback: '', heardAboutUs: '' }).rating).toBe(5);
    expect(() => anonymousResponse(receipt, { rating: 0 })).toThrow();
    expect(() => anonymousResponse(receipt, { rating: 5, feedback: 'x'.repeat(601), heardAboutUs: '' })).toThrow();
  });
  it('writes response and index atomically with duplicate protection and no expiration', async () => {
    const store = { eval: vi.fn() };
    await saveFeedback({ id: 'random-response', submittedAt: '2026-09-26', kind: 'survey' }, store);
    expect(store.eval.mock.calls[0][0]).toContain('HEXISTS');
    expect(store.eval.mock.calls[0][0]).toContain('ZADD');
    expect(store.eval.mock.calls[0][0]).not.toContain('EXPIRE');
  });
});
