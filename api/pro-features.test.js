/* global process */
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { mockSupabase, withEnv } from './_test-helpers.js';
import { consumeProChat, proFeatureRules } from './_proFeatures.js';
let restore;
beforeEach(() => { restore = withEnv({ PRO_FEATURE_GATES_ENABLED: '1' }); });
afterEach(() => { restore(); vi.useRealTimers(); });
const rules = { enabled: true, freeAskPerDay: 5, proAskPerDay: 50, freePlaylists: 1, freeQuizRetakesPerWeek: 1 };
describe('Pro feature usage', () => {
  it('retains existing behavior until explicitly enabled', async () => {
    process.env.PRO_FEATURE_GATES_ENABLED = '';
    expect((await proFeatureRules(null)).enabled).toBe(false);
  });
  it('uses an authoritative configuration and the shared editorial Read list', async () => {
    const admin = mockSupabase({ rpcResults: { pro_feature_config: { data: rules } } });
    expect(await proFeatureRules(admin)).toMatchObject({ ...rules, premiumReadIds: [] });
  });
  it.each([[false, 5], [true, 50]])('shares one daily chat counter for premium=%s with limit %s', async (premium, limit) => {
    vi.useFakeTimers(); vi.setSystemTime('2026-11-01T23:59:59Z');
    const admin = mockSupabase({ rpcResults: { consume_ai_usage: { data: [{ allowed: true, used: 1 }] } } });
    const first = await consumeProChat(admin, 'u', premium, rules);
    expect(first).toMatchObject({ period: 'day:2026-11-01', limit, used: 1 });
    expect(admin.rpcCalls[0].args).toMatchObject({ p_action: 'chat', p_user_id: 'u', p_limit: limit });
    vi.setSystemTime('2026-11-02T00:00:01Z');
    expect((await consumeProChat(admin, 'u', premium, rules)).period).toBe('day:2026-11-02');
  });
  it('does not invent extra quota when the database fails', async () => {
    const admin = mockSupabase(); await expect(consumeProChat(admin, 'u', true, rules)).rejects.toThrow();
  });
});
