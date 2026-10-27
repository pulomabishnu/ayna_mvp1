import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { anonymousResponse, claimSurvey, issueReceipt, readReceipt, saveFeedback } from './_feedbackStore.js';
beforeEach(() => { vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only-secret'); vi.stubEnv('VERCEL_ENV', 'test'); });
afterEach(() => vi.unstubAllEnvs());
describe('anonymous feedback persistence', () => {
  // A stand-in for the Lua claim script: same branches, same keys.
  const cadenceStore = (keys = new Map()) => ({ keys, eval: vi.fn(async (_script, [last, legacy], [now, interval, isNew]) => {
    if (!keys.has(last)) { keys.set(last, now); return isNew === '1' || keys.has(legacy) ? 0 : 1; }
    if (Number(now) - Number(keys.get(last)) >= Number(interval)) { keys.set(last, now); return 1; }
    return 0;
  }) });
  const DAY = 86400000;
  const T0 = Date.parse('2026-10-21T12:00:00Z');
  it('asks an established account now, then no sooner than 14 days later', async () => {
    const store = cadenceStore();
    const opts = (days) => ({ now: T0 + days * DAY, createdAt: '2026-01-01T00:00:00Z' });
    expect(await claimSurvey('account-a', store, opts(0))).toBe(true);
    expect(await claimSurvey('account-a', store, opts(0))).toBe(false);
    expect(await claimSurvey('account-a', store, opts(13.9))).toBe(false);
    expect(await claimSurvey('account-a', store, opts(14))).toBe(true);
    expect(await claimSurvey('account-a', store, opts(20))).toBe(false);
    expect(await claimSurvey('account-a', store, opts(28))).toBe(true);
    expect([...store.keys.keys()].join()).not.toContain('account-a');
  });
  it('never asks in a new account\'s first session, and waits 14 days from it', async () => {
    const store = cadenceStore();
    const createdAt = new Date(T0 - 60 * 60 * 1000).toISOString();
    expect(await claimSurvey('new-account', store, { now: T0, createdAt })).toBe(false);
    expect(await claimSurvey('new-account', store, { now: T0 + 2 * DAY, createdAt })).toBe(false);
    expect(await claimSurvey('new-account', store, { now: T0 + 14 * DAY, createdAt })).toBe(true);
  });
  it('treats the old once-only survey as a recent ask', async () => {
    // Seed the legacy marker under the real key name.
    const first = cadenceStore();
    await claimSurvey('old', first, { now: T0, createdAt: '2026-01-01T00:00:00Z' });
    const legacyKey = first.eval.mock.calls[0][1][1];
    const seeded = cadenceStore(new Map([[legacyKey, 1]]));
    expect(await claimSurvey('old', seeded, { now: T0, createdAt: '2026-01-01T00:00:00Z' })).toBe(false);
    expect(await claimSurvey('old', seeded, { now: T0 + 14 * DAY, createdAt: '2026-01-01T00:00:00Z' })).toBe(true);
  });
  it('checks and marks in one atomic script, with no response data in it', async () => {
    const store = { eval: vi.fn(async () => 1) };
    await claimSurvey('account-a', store, { now: T0 });
    const [script, keys, args] = store.eval.mock.calls[0];
    expect(script).toContain('GET');
    expect(script).toContain('SET');
    expect(keys.join()).not.toContain('account-a');
    expect(args).toEqual([String(T0), String(14 * DAY), '0']);
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
