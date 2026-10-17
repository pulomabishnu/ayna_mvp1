import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase anonymous sign-ins (Community guests) must never count as accounts
// on the server: anyone can mint one, so each would be a fresh AI/SMS quota.
const getUser = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { getUser } }),
}));

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
  process.env.SUPABASE_ANON_KEY = 'anon';
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'anon';
  getUser.mockReset();
});

const req = { headers: { authorization: 'Bearer tok' } };

describe('anonymous (guest) sessions are rejected server-side', () => {
  it('verifyUser rejects is_anonymous users', async () => {
    const { verifyUser } = await import('./_usageLimit.js');
    getUser.mockResolvedValue({ data: { user: { id: 'g', is_anonymous: true } }, error: null });
    expect((await verifyUser(req)).user).toBeNull();
    getUser.mockResolvedValue({ data: { user: { id: 'u', is_anonymous: false } }, error: null });
    expect((await verifyUser(req)).user?.id).toBe('u');
  });

  it('user-scoped client rejects is_anonymous users', async () => {
    const mod = await import('./_userScopedSupabase.js');
    const fn = Object.values(mod).find((f) => typeof f === 'function');
    getUser.mockResolvedValue({ data: { user: { id: 'g', is_anonymous: true } }, error: null });
    expect((await fn(req)).user).toBeNull();
  });
});
