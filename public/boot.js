// pro-auth-return.js + bootstrap-error.js in one file: one request in <head> instead of two (PageSpeed, Nov 12).
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
;
// Keep the pre-React boot error fallback external so production CSP can block
// inline scripts. textContent/replaceChildren ensure an error message is never
// interpreted as HTML.
window.onerror = function onAynaBootError(msg, url, line, col, err) {
  // Only a failure to start the app: never after it has booted, never for noise that is not ours.
  if (window.__aynaBooted) return false;
  var text = String(msg || '');
  if (/ResizeObserver loop|^Script error\.?$/i.test(text)) return false;
  if (url && typeof url === 'string' && url.indexOf(window.location.origin) !== 0) return false;
  var root = document.getElementById('root');
  if (!root) return false;

  var wrap = document.createElement('div');
  wrap.style.padding = '2rem';
  wrap.style.minHeight = '100vh';
  wrap.style.boxSizing = 'border-box';
  wrap.style.background = '#ffedac';
  wrap.style.color = '#3e2723';
  wrap.style.fontFamily = "'DM Sans', system-ui, sans-serif";

  var heading = document.createElement('h2');
  heading.textContent = 'Something went wrong';

  var detail = document.createElement('p');
  detail.textContent = 'Please reload the page and try again.';

  wrap.appendChild(heading);
  wrap.appendChild(detail);
  root.replaceChildren(wrap);
  return false;
};

// Branded boot screen (index.html): if the app still hasn't replaced it after
// 8 seconds, say so and offer a reload instead of an endless spinner.
window.setTimeout(function ayBootSlow() {
  var boot = document.getElementById('ay-boot');
  if (!boot) return;
  var slow = boot.querySelector('.ay-boot__slow');
  if (slow) slow.hidden = false;
  var link = slow && slow.querySelector('a');
  if (link) link.addEventListener('click', function (e) { e.preventDefault(); window.location.reload(); });
}, 8000);
