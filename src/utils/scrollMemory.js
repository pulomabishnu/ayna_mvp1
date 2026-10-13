/**
 * Scroll memory for the website's hand-rolled router (launch audit G09).
 *
 * - Every history entry gets a small key (`__k` in history.state).
 * - In-app navigation (pushState) always starts the new page at the top.
 * - Browser Back / Forward (popstate) puts the page back where she left it,
 *   once the view has rendered enough height to scroll there.
 *
 * Positions live in a Map and are mirrored to sessionStorage so Back still
 * works after a reload in the same tab.
 */
const STORE_KEY = 'ayna_scroll_positions_v1';
const MAX_ENTRIES = 60;
const RESTORE_TIMEOUT_MS = 4000;

let positions = new Map();
let currentKey = null;
let restoreJob = null;

// html has scroll-behavior: smooth; jumps here must be instant.
const jump = (y) => window.scrollTo({ top: y, left: 0, behavior: 'instant' });

const newKey = () => Math.random().toString(36).slice(2, 10);

function withKey(state, key) {
  if (state == null) return { __k: key };
  if (typeof state === 'object' && !Array.isArray(state)) return { ...state, __k: key };
  return state;
}

function persist() {
  try {
    const entries = [...positions.entries()].slice(-MAX_ENTRIES);
    sessionStorage.setItem(STORE_KEY, JSON.stringify(entries));
  } catch { /* storage blocked: memory only */ }
}

function load() {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (raw) positions = new Map(JSON.parse(raw));
  } catch { positions = new Map(); }
}

function record() {
  if (currentKey && !restoreJob) {
    positions.delete(currentKey);
    positions.set(currentKey, Math.round(window.scrollY));
  }
}

function cancelRestore() {
  if (!restoreJob) return;
  cancelAnimationFrame(restoreJob.raf);
  restoreJob.stopListening();
  restoreJob = null;
  record();
}

function restoreTo(y) {
  cancelRestore();
  const started = performance.now();
  const stopOnInput = () => cancelRestore();
  const inputs = ['wheel', 'touchstart', 'keydown', 'mousedown'];
  inputs.forEach((t) => window.addEventListener(t, stopOnInput, { passive: true, capture: true }));
  let settled = 0;
  const job = {
    raf: 0,
    stopListening: () => inputs.forEach((t) => window.removeEventListener(t, stopOnInput, { capture: true })),
  };
  const tick = () => {
    if (restoreJob !== job) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const target = Math.min(y, Math.max(0, max));
    if (Math.abs(window.scrollY - target) > 1) jump(target);
    // Done once the page is tall enough and the position held for a few frames.
    if (max >= y - 1 && Math.abs(window.scrollY - y) <= 1) settled += 1; else settled = 0;
    if (settled >= 6 || performance.now() - started > RESTORE_TIMEOUT_MS) { cancelRestore(); return; }
    job.raf = requestAnimationFrame(tick);
  };
  restoreJob = job;
  job.raf = requestAnimationFrame(tick);
}

/** True while a Back/Forward restore is running (App skips its scroll-to-top). */
export function isRestoringScroll() {
  return !!restoreJob;
}

export function installScrollMemory() {
  if (typeof window === 'undefined' || window.__aynaScrollMemory) return;
  window.__aynaScrollMemory = true;
  try { window.history.scrollRestoration = 'manual'; } catch { /* old browsers */ }
  load();
  const h = window.history;
  const origPush = h.pushState.bind(h);
  const origReplace = h.replaceState.bind(h);
  currentKey = h.state?.__k || newKey();
  origReplace(withKey(h.state, currentKey), '');

  h.pushState = function pushState(state, title, url) {
    cancelRestore();
    record();
    currentKey = newKey();
    const out = origPush(withKey(state, currentKey), title, url);
    jump(0);
    positions.set(currentKey, 0);
    persist();
    return out;
  };
  h.replaceState = function replaceState(state, title, url) {
    return origReplace(withKey(state, currentKey), title, url);
  };

  let raf = 0;
  window.addEventListener('scroll', () => {
    if (raf || restoreJob) return;
    raf = requestAnimationFrame(() => { raf = 0; record(); });
  }, { passive: true });

  // Registered before App's own popstate listener, so it runs first.
  window.addEventListener('popstate', (e) => {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    cancelRestore();
    record();
    persist();
    const key = e.state?.__k;
    if (key) currentKey = key;
    else { currentKey = newKey(); origReplace(withKey(e.state, currentKey), ''); }
    const y = positions.get(currentKey);
    if (y > 0) restoreTo(y);
    else jump(0);
  });
  window.addEventListener('pagehide', () => { record(); persist(); });
}
