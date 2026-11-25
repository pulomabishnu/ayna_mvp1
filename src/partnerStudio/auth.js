/** Supabase keeps the session in localStorage on this origin (the main site's sign-in). */
export function accessTokenFromBrowser() {
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (!key || !/auth-token/i.test(key)) continue;
        let parsed;
        try { parsed = JSON.parse(store.getItem(key)); } catch { continue; }
        const t = parsed?.access_token || parsed?.session?.access_token || parsed?.currentSession?.access_token;
        if (typeof t === 'string' && t.split('.').length === 3) return t;
      }
    } catch { /* storage blocked */ }
  }
  return null;
}

export function readLocal(key) {
  try { return JSON.parse(window.localStorage.getItem(key) || '{}'); } catch { return {}; }
}
export function writeLocal(key, val) {
  try { window.localStorage.setItem(key, JSON.stringify(val)); } catch { /* private mode */ }
}
