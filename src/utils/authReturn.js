/**
 * Send people back to the page they signed in from.
 *
 * Signing in from a page (an admin tool, Partner Studio, a product page) used
 * to drop her on the landing page: the email sign-in's post-login step and the
 * Google return trip (/auth/callback) both end on "/". This remembers the page
 * at sign-in time and, if the app then bounces to "/" within a moment, puts her
 * back. A deliberate post-login destination (Saved, the ecosystem after the
 * quiz) is never "/", so those still win. Same-origin paths only.
 */
const KEY = 'ayna_auth_return_to';
const MAX_AGE_MS = 30 * 60 * 1000;
// Pages that already decide where sign-in goes, or must not be returned to.
const SKIP = [/^\/$/, /^\/auth\//, /^\/confirmed\/?$/, /^\/mobile-preview/, /^\/quiz/];

export function safeReturnPath(p) {
  if (typeof p !== 'string' || p.length > 500) return null;
  if (!p.startsWith('/') || p.startsWith('//') || p.startsWith('/\\')) return null;
  const path = p.split(/[?#]/)[0];
  if (SKIP.some((re) => re.test(path))) return null;
  return p;
}

const here = (win) => `${win.location.pathname}${win.location.search}${win.location.hash}`;

/** Before a sign-in that leaves the page (Google, Apple). */
export function rememberReturnTo(win = window, now = Date.now()) {
  const path = safeReturnPath(here(win));
  try {
    if (path) win.sessionStorage.setItem(KEY, JSON.stringify({ path, at: now }));
    else win.sessionStorage.removeItem(KEY);
  } catch { /* storage blocked */ }
  return path;
}

/** On the way back (once). Stale or unsafe values are dropped. */
export function takeReturnTo(win = window, now = Date.now()) {
  try {
    const saved = JSON.parse(win.sessionStorage.getItem(KEY) || 'null');
    win.sessionStorage.removeItem(KEY);
    if (!saved || now - Number(saved.at || 0) > MAX_AGE_MS) return null;
    return safeReturnPath(saved.path);
  } catch { return null; }
}

/**
 * After sign-in: if the app sends her to "/" within `waitMs`, go back to `path`.
 * Pages the main app renders get a history swap plus popstate (no reload);
 * separate pages (partner-studio.html) load normally.
 */
export function restoreAfterSignIn(path, { win = window, waitMs = 2500, every = 100 } = {}) {
  const target = safeReturnPath(path);
  if (!target) return () => {};
  const targetPath = target.split(/[?#]/)[0];
  const started = Date.now();
  let timer = null;
  const tick = () => {
    const cur = win.location.pathname;
    if (cur === '/') {
      if (/\.html$/.test(targetPath)) win.location.replace(target);
      else {
        win.history.replaceState(null, '', target);
        win.dispatchEvent(new win.PopStateEvent('popstate', { state: null }));
      }
      return;
    }
    // Sent somewhere on purpose (not "/", not the callback, not where she was): leave it.
    if (cur !== '/auth/callback' && cur !== targetPath) return;
    if (Date.now() - started < waitMs) timer = win.setTimeout(tick, every);
  };
  timer = win.setTimeout(tick, every);
  return () => win.clearTimeout(timer);
}
