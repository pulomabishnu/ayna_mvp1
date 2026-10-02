import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('./_feedbackStore.js', () => ({ listFeedback: vi.fn(async () => ({ results: [], nextCursor: null })) }));
vi.mock('./_usageLimit.js', () => ({ verifyUser: vi.fn() }));
import { listFeedback } from './_feedbackStore.js';
import { verifyUser } from './_usageLimit.js';
import handler from './reviews-admin.js';

const listUsers = vi.fn();
function response() {
  return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
function reviewer(id, date, feedback = '') {
  return { id, email: `${id}@example.test`, user_metadata: { satisfaction_rating: 4, satisfaction_feedback: feedback, satisfaction_survey_completed_at: date, heard_about_us: 'Instagram', private_unrelated: 'do not expose' } };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('ADMIN_EMAILS', 'ADMIN@example.test');
  verifyUser.mockResolvedValue({ user: { email: 'admin@example.test' }, admin: { auth: { admin: { listUsers } } } });
});
afterEach(() => vi.unstubAllEnvs());
describe('popup review administration', () => {
  it('returns completed popup responses newest first, including rating-only responses', async () => {
    listUsers.mockResolvedValue({ data: { users: [reviewer('older', '2026-09-19'), { id: 'dismissed', user_metadata: { satisfaction_survey_shown_at: '2026-09-20' } }, reviewer('newer', '2026-09-20', 'Useful!')] } });
    const res = response();
    await handler({ method: 'GET' }, res);
    expect(res.code).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('example.test');
    expect(JSON.stringify(res.body)).not.toContain('userId');
    expect(res.body.results[0]).toEqual({ id: 'legacy-1', kind: 'survey', campaign: 'legacy', rating: 4, feedback: 'Useful!', heardAboutUs: 'Instagram', submittedAt: '2026-09-20' });
    expect(res.body.results[1].feedback).toBe('');
    expect(res.headers['Cache-Control']).toContain('no-store');
  });
  it('includes anonymous purchases and paginates without reading account metadata again', async () => {
    const row = { id: 'random-response-id', kind: 'purchase', productId: 'pads', productName: 'Pads', variant: 'Overnight', answer: 'yes', submittedAt: '2026-09-26' };
    listFeedback.mockResolvedValueOnce({ results: [row], nextCursor: 200 });
    const res = response();
    await handler({ method: 'GET', query: { cursor: '100' } }, res);
    expect(res.code).toBe(200);
    expect(res.body.results).toEqual([row]);
    expect(res.body.nextCursor).toBe(200);
    expect(listUsers).not.toHaveBeenCalled();
    expect(JSON.stringify(res.body)).not.toMatch(/email|userId|phone/);
  });
  it('loads responses beyond the first user page', async () => {
    listUsers.mockResolvedValueOnce({ data: { users: Array.from({ length: 1000 }, (_, i) => ({ id: `${i}` })) } }).mockResolvedValueOnce({ data: { users: [reviewer('last', '2026-09-20')] } });
    const res = response();
    await handler({ method: 'GET' }, res);
    expect(listUsers).toHaveBeenLastCalledWith({ page: 2, perPage: 1000 });
    expect(res.body.count).toBe(1);
  });
  it('leaves team/test accounts out of results and counts, ignoring case and whitespace', async () => {
    const team = (email, date) => ({ ...reviewer('team', date, 'internal'), email });
    listUsers.mockResolvedValue({ data: { users: [
      team('  AO369@Cornell.EDU ', '2026-09-21'),
      team('Puloma@AynaHealth.co', '2026-09-22'),
      team('eliz@aynahealth.co', '2026-09-23'),
      reviewer('real', '2026-09-20', 'Real user'),
    ] } });
    const res = response();
    await handler({ method: 'GET' }, res);
    expect(res.code).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.results.map(r => r.feedback)).toEqual(['Real user']);
  });
  it('rejects non-admins before loading private feedback', async () => {
    vi.stubEnv('ADMIN_EMAILS', 'someoneelse@example.test');
    const res = response();
    await handler({ method: 'GET' }, res);
    expect(res.code).toBe(403);
    expect(listUsers).not.toHaveBeenCalled();
  });
  it('requires authentication', async () => {
    verifyUser.mockResolvedValue({ error: 'auth_required' });
    const res = response();
    await handler({ method: 'GET' }, res);
    expect(res.code).toBe(401);
    expect(listUsers).not.toHaveBeenCalled();
  });
  it('reports upstream failure instead of an empty success', async () => {
    listUsers.mockResolvedValue({ error: new Error('unavailable') });
    const res = response();
    await handler({ method: 'GET' }, res);
    expect(res.code).toBe(500);
  });
});
