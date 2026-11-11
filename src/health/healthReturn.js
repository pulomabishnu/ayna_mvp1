/**
 * Where to put her back after a health provider's sign-in page reloads the web app.
 * The app screen she was on (window.__aynaScreen, set by MobileApp) is kept for 15 minutes.
 */
const KEY = 'ayna_health_return_v1';

export function rememberHealthReturn(screen = (typeof window !== 'undefined' && window.__aynaScreen) || '') {
  try { sessionStorage.setItem(KEY, JSON.stringify({ screen: String(screen || ''), at: Date.now() })); } catch { /* private mode */ }
}

/** @returns {{ screen: string } | null} once, then clears it */
export function takeHealthReturn(now = Date.now()) {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const v = JSON.parse(raw);
    if (!v || now - Number(v.at) > 15 * 60 * 1000) return null;
    return { screen: String(v.screen || '') };
  } catch { return null; }
}
