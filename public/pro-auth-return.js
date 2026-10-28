(() => {
  const ACTION_KEY = 'ayna_pending_auth_action';
  const PRO_ACTION = 'pro';

  if (window.location.pathname === '/pro' || window.location.pathname === '/pro.html') return;

  function pendingProReturn() {
    try {
      return window.sessionStorage.getItem(ACTION_KEY) === PRO_ACTION;
    } catch {
      return false;
    }
  }

  function accessTokenFromBrowser() {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      try {
        for (let i = 0; i < storage.length; i += 1) {
          const key = storage.key(i);
          if (!key || !/auth-token/i.test(key)) continue;
          const raw = storage.getItem(key);
          if (!raw) continue;
          let parsed;
          try { parsed = JSON.parse(raw); } catch { continue; }
          const candidate = parsed?.access_token || parsed?.session?.access_token || parsed?.currentSession?.access_token;
          if (typeof candidate === 'string' && candidate.split('.').length === 3) return candidate;
        }
      } catch { /* storage can be unavailable in privacy-restricted browsers */ }
    }
    return null;
  }

  function returnToProWhenReady() {
    if (!pendingProReturn() || !accessTokenFromBrowser()) return false;
    try { window.sessionStorage.removeItem(ACTION_KEY); } catch { /* best effort */ }
    window.location.replace('/pro');
    return true;
  }

  if (!pendingProReturn() || returnToProWhenReady()) return;

  // Sign-in can complete in-place (email/password) or after an OAuth round trip.
  // Keep this tiny pre-app watcher alive only for a Pro return so either path
  // lands back on the plan page as soon as Supabase has persisted the session.
  const timer = window.setInterval(() => {
    if (!pendingProReturn() || returnToProWhenReady()) window.clearInterval(timer);
  }, 300);
})();
