(() => {
  const RESUME_KEY = 'ayna.returnTo';
  const MAX_AGE_MS = 30 * 60 * 1000;

  if (window.location.pathname === '/pro' || window.location.pathname === '/pro.html') return;

  function pendingProReturn() {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(RESUME_KEY) || 'null');
      if (!saved || typeof saved.path !== 'string' || !saved.path.startsWith('/') || saved.path.startsWith('//')) return null;
      const target = saved.path.split(/[?#]/)[0];
      if (target !== '/pro' && target !== '/pro.html') return null;
      if (!(Date.now() - Number(saved.at) >= 0 && Date.now() - Number(saved.at) < MAX_AGE_MS)) {
        window.sessionStorage.removeItem(RESUME_KEY);
        return null;
      }
      return saved;
    } catch {
      return null;
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
    const saved = pendingProReturn();
    if (!saved || !accessTokenFromBrowser()) return false;
    window.location.replace(saved.path);
    return true;
  }

  if (!pendingProReturn() || returnToProWhenReady()) return;

  // Email/password can finish in place and OAuth can finish after a round trip.
  // Keep this tiny pre-app watcher alive only while a fresh /pro return is pending.
  const timer = window.setInterval(() => {
    if (!pendingProReturn() || returnToProWhenReady()) window.clearInterval(timer);
  }, 300);
})();