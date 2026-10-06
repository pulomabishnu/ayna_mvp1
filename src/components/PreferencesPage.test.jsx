// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let session = null;
vi.mock('../utils/supabaseClient', () => ({
  getSupabaseClient: () => ({
    auth: { getSession: async () => ({ data: { session } }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { phone_number: '+15551234567', is_verified: true }, error: null }) }) }) }),
  }),
}));
vi.mock('posthog-js', () => ({ default: { has_opted_out_capturing: () => false } }));

import PreferencesPage from './PreferencesPage';

const SERVER = {
  notificationsEnabled: true,
  updatesEnabled: true,
  deliveryChannel: 'push',
  personalizeWithDataEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  textSizeIndex: 2,
  phoneVerified: false,
};

let root, host, fetchMock;
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const byText = (sel, text) => [...host.querySelectorAll(sel)].find((el) => el.textContent.trim() === text);

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  fetchMock = vi.fn(async (_url, opts) => {
    const body = opts.method === 'PATCH' ? { ...SERVER, ...JSON.parse(opts.body) } : SERVER;
    return { ok: true, status: 200, json: async () => body };
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('data-ayna-text-size');
  document.documentElement.style.removeProperty('--ayna-text-scale');
  session = null;
});

describe('PreferencesPage', () => {
  it('signed out: shows the log-in prompt and local text size only', async () => {
    const onRequestLogin = vi.fn();
    await act(async () => root.render(<PreferencesPage onRequestLogin={onRequestLogin} />));
    await flush();
    expect(host.textContent).toContain('Log in for the rest of your settings');
    expect(host.querySelector('[role="switch"]')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    const large = byText('label', 'AaLarge');
    await act(async () => large.querySelector('input').click());
    expect(document.documentElement.getAttribute('data-ayna-text-size')).toBe('large');
    expect(localStorage.getItem('ayna_text_size_v1')).toBe('2');

    await act(async () => byText('button', 'Log in').click());
    expect(onRequestLogin).toHaveBeenCalled();
  });

  it('signed in: loads prefs, applies saved text size, syncs personalize, and PATCHes toggles', async () => {
    session = { access_token: 'tok' };
    const onPersonalizeChange = vi.fn();
    await act(async () => root.render(<PreferencesPage user={{ id: 'u1' }} onPersonalizeChange={onPersonalizeChange} />));
    await flush();

    expect(host.querySelectorAll('[role="switch"]').length).toBeGreaterThanOrEqual(4);
    expect(document.documentElement.getAttribute('data-ayna-text-size')).toBe('large');
    expect(onPersonalizeChange).toHaveBeenLastCalledWith(true);

    const switches = [...host.querySelectorAll('[role="switch"]')];
    const personalizeSwitch = switches.find((s) => document.getElementById(s.getAttribute('aria-labelledby'))?.textContent === 'Personalize with my data');
    expect(personalizeSwitch).toBeTruthy();
    await act(async () => personalizeSwitch.click());
    await flush();
    expect(onPersonalizeChange).toHaveBeenLastCalledWith(false);
    const patch = fetchMock.mock.calls.find(([, o]) => o.method === 'PATCH');
    expect(JSON.parse(patch[1].body)).toEqual({ personalize_with_data_enabled: false });
  });

  it('signed in: SMS without a verified phone does not PATCH and offers phone verification', async () => {
    session = { access_token: 'tok' };
    const onOpenPhoneVerify = vi.fn();
    await act(async () => root.render(<PreferencesPage user={{ id: 'u1' }} onOpenPhoneVerify={onOpenPhoneVerify} />));
    await flush();
    const sms = host.querySelector('input[type="radio"][value="sms"]');
    await act(async () => sms.click());
    expect(fetchMock.mock.calls.some(([, o]) => o.method === 'PATCH')).toBe(false);
    await act(async () => byText('button', 'Verify phone').click());
    expect(onOpenPhoneVerify).toHaveBeenCalled();
  });

  it('clears Ask Ayna history after confirming', async () => {
    const onClear = vi.fn();
    await act(async () => root.render(<PreferencesPage askAynaMessageCount={3} onClearAskAynaHistory={onClear} />));
    await flush();
    await act(async () => byText('button', 'Clear').click());
    await act(async () => byText('button', 'Yes, clear it').click());
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
