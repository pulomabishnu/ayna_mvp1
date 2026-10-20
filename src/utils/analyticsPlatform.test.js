import { describe, it, expect } from 'vitest';
import { resolvePosthogKey, analyticsPlatform, AYNA_POSTHOG_PUBLIC_KEY } from './analyticsPlatform';

describe('resolvePosthogKey', () => {
  it('uses the env key when set', () => {
    expect(resolvePosthogKey('phc_env', true)).toBe('phc_env');
    expect(resolvePosthogKey('phc_env', false)).toBe('phc_env');
  });
  it('falls back to the public key only for native builds', () => {
    expect(resolvePosthogKey('', true)).toBe(AYNA_POSTHOG_PUBLIC_KEY);
    expect(resolvePosthogKey(undefined, true)).toBe(AYNA_POSTHOG_PUBLIC_KEY);
    expect(resolvePosthogKey(undefined, false)).toBeUndefined();
  });
  it('the fallback is a public client token, never a personal API key', () => {
    expect(AYNA_POSTHOG_PUBLIC_KEY).toMatch(/^phc_/);
  });
});

describe('analyticsPlatform', () => {
  it('names each platform', () => {
    expect(analyticsPlatform(false, 'web')).toBe('web');
    expect(analyticsPlatform(true, 'ios')).toBe('ios_app');
    expect(analyticsPlatform(true, 'android')).toBe('android_app');
  });
});
