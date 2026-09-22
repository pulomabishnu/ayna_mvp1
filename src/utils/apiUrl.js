import { Capacitor } from '@capacitor/core';

// The native iOS app has no server of its own — capacitor.config.json has
// no `server.url`, so it loads its bundled dist/ assets from a local
// capacitor:// origin. A plain relative fetch('/api/...') resolves against
// THAT origin, not the real backend, so it never reaches anything — no
// CORS error, no timeout, just an immediate failure (this is what broke the
// Early Stage tab and Ask Ayna natively; the same relative-path pattern is
// used everywhere else too, just without a visible error banner for most of
// it). The website and its /api endpoints are one Vercel deployment at this
// domain, so on native we resolve API calls against it explicitly; on web
// relative paths are kept so localhost/preview/staging still hit whatever
// origin they're actually running on.
const NATIVE_API_ORIGIN = 'https://www.aynahealth.co';

export function apiUrl(path) {
  return Capacitor.isNativePlatform() ? `${NATIVE_API_ORIGIN}${path}` : path;
}
