import { describe, expect, it, vi, beforeEach } from 'vitest';

const db = { trials: new Set(), grants: {} };
function from(name) {
  const q = { _id: null };
  q.select = () => q;
  q.eq = (_k, v) => { q._id = v; return q; };
  q.maybeSingle = async () => ({ data: name === 'pro_trials' && db.trials.has(q._id) ? { user_id: q._id } : null, error: null });
  q.insert = async (row) => { if (db.trials.has(row.user_id)) return { error: { code: '23505' } }; db.trials.add(row.user_id); return { error: null }; };
  q.upsert = async (row) => { db.grants[row.user_id] = row.expires_at; return { error: null }; };
  return q;
}
vi.mock('./_usageLimit.js', () => ({ verifyUser: vi.fn(async () => ({ user: { id: 'u1', email: 'a@gmail.com' }, admin: { from } })), getServiceClient: vi.fn(), claimEcosystemBuild: vi.fn() }));
vi.mock('./_rateLimit.js', () => ({ rateLimit: () => true }));
vi.mock('./_pro.js', async (orig) => ({ ...(await orig()), proStatus: vi.fn(async () => ({ active: false, hasPurchase: false, launchAt: null, termEndsAt: null, temporaryUntil: null })), proConfig: () => ({ enabled: false }) }));

const { default: handler } = await import('./pro.js');
const res = () => ({ statusCode: 200, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, getHeader(k) { return this.headers[k]; }, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; }, end() { return this; } });
const post = async (body) => { const r = res(); await handler({ method: 'POST', headers: {}, body }, r); return r; };

describe('free week of ayna Pro (Nov 16)', () => {
  beforeEach(() => { db.trials.clear(); db.grants = {}; });
  it('starts once: 7 days of access, no charge; a second try says used', async () => {
    const first = await post({ action: 'start_trial' });
    expect(first.body.started).toBe(true);
    const days = (Date.parse(db.grants.u1) - Date.now()) / 864e5;
    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThan(7.1);
    const again = await post({ action: 'start_trial' });
    expect(again.body).toEqual({ started: false, reason: 'used' });
  });
});
