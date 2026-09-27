import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./_usageLimit.js', () => ({ verifyUser: vi.fn() }));
vi.mock('./_rateLimit.js', () => ({ rateLimit: vi.fn(async () => ({ ok: true })), getClientIp: () => 'test' }));
vi.mock('./_catalogGrounding.js', () => ({ loadGroundingCatalog: async () => [{ id: 'pads', name: 'Pads', variants: [{ id: 'overnight', label: 'Overnight' }] }] }));
vi.mock('./_feedbackStore.js', async importOriginal => ({ ...(await importOriginal()), feedbackStore: vi.fn(() => ({ ping: async () => 'PONG' })), claimSurvey: vi.fn(), saveFeedback: vi.fn() }));
import { verifyUser } from './_usageLimit.js';
import { feedbackStore, claimSurvey, saveFeedback } from './_feedbackStore.js';
import handler from './feedback.js';
const res = () => ({ setHeader: vi.fn(), status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const call = async body => { const response = res(); await handler({ method: 'POST', headers: {}, body }, response); return response; };
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-secret'); feedbackStore.mockReturnValue({ ping: async () => 'PONG' }); });
describe('feedback API', () => {
  it('requires an account for the once-per-account survey', async () => {
    verifyUser.mockResolvedValue({ error: 'auth_required' });
    expect((await call({ action: 'claim-survey' })).code).toBe(401);
    expect(claimSurvey).not.toHaveBeenCalled();
  });
  it('allows previously reviewed account holders into this new campaign only once', async () => {
    verifyUser.mockResolvedValue({ user: { id: 'one', user_metadata: { satisfaction_survey_completed_at: '2025-01-01' } } });
    claimSurvey.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const first = await call({ action: 'claim-survey' });
    expect(first.body.claimed).toBe(true);
    expect((await call({ action: 'claim-survey' })).body).toEqual({ claimed: false });
    expect(first.body.receipt).not.toContain('one');
  });
  it('records yes and no for verified products without requiring or storing an account', async () => {
    for (const answer of ['yes', 'no']) {
      const start = await call({ action: 'begin-purchase', productId: 'pads', variantId: 'overnight' });
      expect(start.code).toBe(200);
      const end = await call({ action: 'submit', receipt: start.body.receipt, answer, userId: 'injected' });
      expect(end.body).toEqual({ ok: true });
      expect(saveFeedback.mock.lastCall[0]).toMatchObject({ productName: 'Pads', variant: 'Overnight', answer });
      expect(saveFeedback.mock.lastCall[0]).not.toHaveProperty('userId');
    }
  });
  it('rejects invented products and variants and does not report success during storage failures', async () => {
    expect((await call({ action: 'begin-purchase', productId: 'invented' })).code).toBe(400);
    expect((await call({ action: 'begin-purchase', productId: 'pads', variantId: 'invented' })).code).toBe(400);
    feedbackStore.mockImplementation(() => { throw new Error('offline'); });
    expect((await call({ action: 'claim-survey' })).code).toBe(503);
  });
});
