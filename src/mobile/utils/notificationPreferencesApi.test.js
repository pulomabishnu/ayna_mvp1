import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../../utils/supabaseClient.js', () => ({
  getSupabaseClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }) } }),
}));
vi.mock('../../utils/apiUrl.js', () => ({ apiUrl: (p) => p }));

const { patchNotificationPreferences, fetchNotificationPreferences } = await import('./notificationPreferencesApi.js');

afterEach(() => vi.unstubAllGlobals());

describe('notificationPreferencesApi', () => {
  it('treats a 200 HTML app shell (route not deployed) as a failure, not a save', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <'); } })));
    await expect(patchNotificationPreferences({ notifications_enabled: true })).rejects.toMatchObject({ code: 'service_unavailable' });
    await expect(fetchNotificationPreferences()).rejects.toMatchObject({ code: 'service_unavailable' });
  });

  it('returns the saved row on success', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ notificationsEnabled: true }) })));
    await expect(patchNotificationPreferences({ notifications_enabled: true })).resolves.toEqual({ notificationsEnabled: true });
  });

  it('surfaces the server error code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 400, json: async () => ({ error: 'phone_not_verified' }) })));
    await expect(patchNotificationPreferences({ delivery_channel: 'sms' })).rejects.toMatchObject({ code: 'phone_not_verified' });
  });
});
