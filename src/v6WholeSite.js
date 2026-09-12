import './v6WholeSite.css';
import './v6WholeSiteDetails.css';
import { getSupabaseClient } from './utils/supabaseClient';

const ROUTE_CLASS_PREFIX = 'v6-page-';
const PAGE_BY_PATH = new Map([
  ['/', 'home'],
  ['/quiz', 'quiz'],
  ['/ecosystem', 'ecosystem'],
  ['/discovery', 'browse'],
  ['/profile', 'profile'],
  ['/privacy-policy', 'privacy-policy'],
  ['/terms-of-use', 'terms-of-use'],
  ['/how-we-make-money', 'how-we-make-money'],
  ['/how-it-works', 'how-it-works'],
  ['/about', 'about'],
  ['/contact', 'contact'],
  ['/library', 'library'],
  ['/screenings', 'screenings'],
  ['/appointment-prep', 'appointment-prep'],
  ['/tracked', 'tracked'],
  ['/comparison', 'comparison'],
  ['/recalls', 'recalls'],
  ['/omitted', 'omitted'],
  ['/startups', 'startups'],
  ['/text-ayna', 'text-ayna'],
  ['/confirmed', 'confirmed'],
  ['/auth/callback', 'auth'],
  ['/auth/confirm', 'auth'],
]);

function pageForPath(pathname) {
  if (/^\/product\//.test(pathname)) return 'product';
  return PAGE_BY_PATH.get(pathname) || 'generic';
}

function applyRouteClass() {
  const root = document.documentElement;
  [...root.classList].forEach((name) => {
    if (name.startsWith(ROUTE_CLASS_PREFIX)) root.classList.remove(name);
  });
  root.classList.add(`${ROUTE_CLASS_PREFIX}${pageForPath(window.location.pathname)}`);
  root.classList.add('v6-route-ready');
}

function applyAuthClass(user) {
  const root = document.documentElement;
  const signedIn = Boolean(user?.id);
  root.classList.toggle('v6-signed-in', signedIn);
  root.classList.toggle('v6-signed-out', !signedIn);
  document.body?.classList.toggle('v6-signed-in', signedIn);
  document.body?.classList.toggle('v6-signed-out', !signedIn);
}

function patchHistory() {
  if (window.__AYNA_V6_HISTORY_PATCHED__) return;
  window.__AYNA_V6_HISTORY_PATCHED__ = true;
  for (const method of ['pushState', 'replaceState']) {
    const original = window.history[method];
    if (typeof original !== 'function') continue;
    window.history[method] = function v6HistoryMethod(...args) {
      const result = original.apply(this, args);
      queueMicrotask(applyRouteClass);
      return result;
    };
  }
  window.addEventListener('popstate', applyRouteClass);
}

async function watchAuth() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    applyAuthClass(null);
    return;
  }
  try {
    const { data } = await supabase.auth.getSession();
    applyAuthClass(data?.session?.user || null);
  } catch {
    applyAuthClass(null);
  }
  try {
    supabase.auth.onAuthStateChange((_event, session) => applyAuthClass(session?.user || null));
  } catch {
    // Existing app auth remains authoritative if this optional visual observer fails.
  }
}

function start() {
  document.documentElement.classList.add('v6-whole-site');
  applyRouteClass();
  patchHistory();
  watchAuth();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
