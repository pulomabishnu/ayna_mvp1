// Dev preview gate for the sample fixtures (?fixture=today, ?healthdemo=1).
// True on `vite` dev, and on a local production build served over plain
// http://localhost:<port> (so design QA can grade the real build). Never on a
// real host, and never inside the native app: Capacitor serves from
// capacitor://localhost (iOS) or https://localhost (Android) with no port.
export function devPreviewOn() {
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined' || !window.location) return false;
  const { hostname, protocol, port } = window.location;
  if (window.Capacitor?.isNativePlatform?.()) return false;
  return hostname === 'localhost' && protocol === 'http:' && Boolean(port);
}
