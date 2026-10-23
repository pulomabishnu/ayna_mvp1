import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  refreshSession: vi.fn(),
}));

vi.mock('../../utils/supabaseClient', () => ({
  getSupabaseClient: () => ({ auth }),
}));

vi.mock('posthog-js', () => ({
  default: { capture: vi.fn() },
}));

import { CampaignRequestError, getCampaignStatus, saveFeedback } from './campaignClient';

function reply(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe('free product campaign auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  it('refreshes and retries once when the server rejects a stale token', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'old-token' } }, error: null });
    auth.refreshSession.mockResolvedValue({ data: { session: { access_token: 'fresh-token' } }, error: null });
    globalThis.fetch
      .mockResolvedValueOnce(reply(401, { error: 'auth_required' }))
      .mockResolvedValueOnce(reply(200, { campaign: { id: 'campaign-1' } }));

    await expect(getCampaignStatus()).resolves.toEqual({ campaign: { id: 'campaign-1' } });
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer old-token');
    expect(globalThis.fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer fresh-token');
  });

  it('recovers a session that is temporarily missing from getSession', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    auth.refreshSession.mockResolvedValue({ data: { session: { access_token: 'fresh-token' } }, error: null });
    globalThis.fetch.mockResolvedValueOnce(reply(200, { campaign: { id: 'campaign-1' } }));

    await expect(getCampaignStatus()).resolves.toEqual({ campaign: { id: 'campaign-1' } });
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer fresh-token');
  });

  it('keeps the same feedback body when retrying after auth refresh', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'old-token' } }, error: null });
    auth.refreshSession.mockResolvedValue({ data: { session: { access_token: 'fresh-token' } }, error: null });
    globalThis.fetch
      .mockResolvedValueOnce(reply(401, { error: 'auth_required' }))
      .mockResolvedValueOnce(reply(200, { status: { feedbackComplete: 1 } }));

    await saveFeedback('research', 'This is a long enough feedback answer for the campaign.');

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch.mock.calls[0][1].body).toBe(globalThis.fetch.mock.calls[1][1].body);
    expect(JSON.parse(globalThis.fetch.mock.calls[1][1].body)).toEqual({
      action: 'feedback',
      key: 'research',
      response: 'This is a long enough feedback answer for the campaign.',
    });
  });

  it('returns auth_required without looping when refresh cannot recover the session', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'old-token' } }, error: null });
    auth.refreshSession.mockResolvedValue({ data: { session: null }, error: new Error('invalid refresh token') });
    globalThis.fetch.mockResolvedValueOnce(reply(401, { error: 'auth_required' }));

    await expect(getCampaignStatus()).rejects.toMatchObject({
      code: 'auth_required',
      status: 401,
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('still distinguishes a real network failure from an auth failure', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'good-token' } }, error: null });
    globalThis.fetch.mockRejectedValueOnce(new Error('offline'));

    await expect(getCampaignStatus()).rejects.toEqual(expect.objectContaining({
      code: 'network',
      status: 0,
    }));
    await expect(Promise.resolve(new CampaignRequestError('network', 0))).resolves.toBeInstanceOf(CampaignRequestError);
  });
});
