import { afterEach, describe, expect, it, vi } from 'vitest';

let session = { access_token: 'tok' };
vi.mock('./supabaseClient.js', () => ({
  getSupabaseClient: () => ({ auth: { getSession: async () => ({ data: { session } }) } }),
}));

import {
  NotSignedInError,
  fetchNotificationPreferences,
  friendlyPreferencesError,
  patchNotificationPreferences,
} from './notificationPreferencesApi';

afterEach(() => { vi.unstubAllGlobals(); session = { access_token: 'tok' }; });

describe('notification preferences client', () => {
  it('GETs with the bearer token', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ deliveryChannel: 'push' }) }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchNotificationPreferences()).resolves.toEqual({ deliveryChannel: 'push' });
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/notification-preferences');
    expect(opts.method).toBe('GET');
    expect(opts.headers.Authorization).toBe('Bearer tok');
  });

  it('PATCHes snake_case fields and surfaces API error codes', async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 400, json: async () => ({ error: 'phone_not_verified' }) }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(patchNotificationPreferences({ delivery_channel: 'sms' })).rejects.toMatchObject({ code: 'phone_not_verified' });
    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.method).toBe('PATCH');
    expect(JSON.parse(opts.body)).toEqual({ delivery_channel: 'sms' });
  });

  it('throws NotSignedInError with no session or a 401', async () => {
    session = null;
    vi.stubGlobal('fetch', vi.fn());
    await expect(fetchNotificationPreferences()).rejects.toBeInstanceOf(NotSignedInError);
    session = { access_token: 'tok' };
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: 'invalid_token' }) })));
    await expect(fetchNotificationPreferences()).rejects.toBeInstanceOf(NotSignedInError);
  });

  it('maps error codes to friendly copy with a fallback', () => {
    expect(friendlyPreferencesError('phone_not_verified')).toMatch(/verify your phone/i);
    expect(friendlyPreferencesError('something_else')).toBe("That didn't save. Try again.");
  });
});
