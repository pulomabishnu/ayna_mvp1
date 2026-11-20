/**
 * PostHog setup shared by the website and the native app (see main.jsx).
 *
 * The project key below is PostHog's public client token (phc_…): it is
 * meant to ship in client code and is already in every website bundle. It
 * is the fallback for native builds only, because those are built on a
 * laptop whose .env may not have VITE_PUBLIC_POSTHOG_KEY, which silently
 * turned app analytics off. The website keeps reading the env var.
 */
export const AYNA_POSTHOG_PUBLIC_KEY = 'phc_rkLLzEsibbNfERMPqnqzVy9kz5KxUwBbefQZndK2DYpZ';

export function resolvePosthogKey(envKey, isNative) {
  const key = typeof envKey === 'string' ? envKey.trim() : '';
  if (key) return key;
  return isNative ? AYNA_POSTHOG_PUBLIC_KEY : undefined;
}

/** 'ios_app' | 'android_app' | 'web' — registered on every event as `platform`. */
export function analyticsPlatform(isNative, capacitorPlatform) {
  if (!isNative) return 'web';
  if (capacitorPlatform === 'ios') return 'ios_app';
  if (capacitorPlatform === 'android') return 'android_app';
  return 'native_app';
}

/** 'development' for a local/dev build (npm run dev, a native build from a laptop), else 'production'. On every event as `environment`. */
export function analyticsEnvironment(isDevBuild) {
  return isDevBuild ? 'development' : 'production';
}
