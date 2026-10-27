import { PRO_FEATURES } from './features.js';

/**
 * One way in to ayna Pro from anywhere: a locked card, a limit she just hit,
 * a database error. `openProPaywall` asks the one mounted <ProPaywallHost>
 * (App.jsx and MobileApp.jsx) to show the sheet, so two gates on one screen
 * never stack two sheets. Returns false when no host is mounted (tests,
 * stand-alone renders) so the caller can show its own.
 */
export const PRO_PAYWALL_EVENT = 'ayna:pro-paywall';
export const PRO_CHANGED_EVENT = 'ayna:pro-changed';
const RETURN_KEY = 'ayna_pro_return_v1';

// The app inside the website (/mobile-preview) mounts two hosts: the app's
// (priority 2) answers, so the sheet keeps the app's look and only one opens.
const hosts = new Set();
export function registerProPaywallHost(priority = 1) {
  const host = { priority };
  hosts.add(host);
  return { isActive: () => [...hosts].every((h) => h.priority <= host.priority) && [...hosts].find((h) => h.priority === host.priority) === host, unregister: () => hosts.delete(host) };
}
export function hasProPaywallHost() { return hosts.size > 0; }

export function openProPaywall(detail = {}) {
  if (!hosts.size || typeof window === 'undefined') return false;
  window.dispatchEvent(new CustomEvent(PRO_PAYWALL_EVENT, { detail }));
  return true;
}

/** Tell every gate to check access again (after checkout, "already Pro", sign-in). */
export function announceProChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(PRO_CHANGED_EVENT));
}

// Gate ids that differ from the Pro features list ids.
export const FEATURE_ALIAS = { trial: 'tracking', recap: 'insights', history: 'insights' };

/** The locked card's words, per gate id. Names come from the Pro features list. */
const LOCK_LINES = {
  ask: 'Free ayna includes 5 Ask ayna chats a month. Pro includes up to 50 chats a month.',
  reads: 'Free ayna includes 1 Read per week. Pro gives you unlimited Reads.',
  playlists: 'Free ayna includes 1 playlist. Pro gives you unlimited playlists.',
  quiz: 'Free ayna includes 1 quiz retake per month. Pro lets you retake it whenever your needs change.',
  wearables: 'Connect Apple Health, Health Connect or Oura, or upload your health data or screenshots, so ayna can use the signals you choose to share.',
  insights: 'More context around patterns, symptoms, goals, life stage and connected health signals. Basic insights stay free.',
  history: 'More context around patterns, symptoms, goals, life stage and connected health signals. Basic insights stay free.',
  recap: 'More context around patterns, symptoms, goals, life stage and connected health signals. Basic insights stay free.',
  trial: 'More detailed tracking over time, with trend insights. Basic tracking stays free.',
  dashboard: 'Your cycle, sleep, heart and activity together, with connected health apps and wearables. Your ecosystem stays free.',
  appointment: 'Organize symptoms, observations and questions before you see a clinician.',
};

export function proFeatureName(feature) {
  const id = FEATURE_ALIAS[feature] || feature;
  if (feature === 'appointment') return 'Appointment prep';
  if (feature === 'dashboard') return 'Your health dashboard';
  return PRO_FEATURES.find((f) => f.id === id)?.label || 'ayna Pro';
}

export function proLockLine(feature) {
  return LOCK_LINES[feature] || 'This is included with ayna Pro.';
}

/** Which Pro limit a server or database error means, or ''. */
export function proLimitFeature(error) {
  const message = String(error?.message || error || '');
  if (/Free ayna includes one playlist|pro_playlist/i.test(message)) return 'playlists';
  if (error?.code === 'ecosystem_limit_reached' || /ecosystem_limit_reached/.test(message)) return 'quiz';
  if (error?.code === 'daily_limit_reached' || /daily_limit_reached/.test(message)) return 'ask';
  return '';
}

/** Before leaving for checkout: remember where she was, to bring her back. */
export function rememberProReturn(feature = '') {
  try {
    const { pathname, search, hash } = window.location;
    const path = `${pathname}${search}${hash}`;
    if (path.startsWith('/pro')) return;
    window.sessionStorage.setItem(RETURN_KEY, JSON.stringify({ path, feature, at: Date.now() }));
  } catch { /* storage may be unavailable */ }
}

/*
 * Sign in, then straight back to ayna Pro (founder, Oct 27 17:15). Before sending her to sign in,
 * the sheet or /pro saves where she was, the feature and the plan she picked. sessionStorage
 * survives the same-tab Google/OAuth round trip; anything older than 30 minutes is ignored.
 */
export const RESUME_KEY = 'ayna.returnTo';
export const RESUME_MAX_AGE_MS = 30 * 60 * 1000;

export function saveProResume({ path, proFeature = '', plan = '' } = {}, storage = globalThis.sessionStorage, now = Date.now()) {
  try {
    const where = path || `${window.location.pathname}${window.location.search}`;
    if (!where.startsWith('/') || where.startsWith('//')) return;
    storage?.setItem(RESUME_KEY, JSON.stringify({ path: where, proFeature, plan, at: now, tries: 0 }));
  } catch { /* storage blocked */ }
}

/** The saved target if it is fresh; a stale or broken one is cleared. */
export function peekProResume(storage = globalThis.sessionStorage, now = Date.now()) {
  try {
    const saved = JSON.parse(storage?.getItem(RESUME_KEY) || 'null');
    if (!saved || typeof saved.path !== 'string' || !saved.path.startsWith('/') || saved.path.startsWith('//') ||
        !(now - Number(saved.at) >= 0 && now - Number(saved.at) < RESUME_MAX_AGE_MS)) {
      storage?.removeItem(RESUME_KEY);
      return null;
    }
    return saved;
  } catch { return null; }
}

export function clearProResume(storage = globalThis.sessionStorage) {
  try { storage?.removeItem(RESUME_KEY); } catch { /* storage blocked */ }
}

/**
 * Once she is signed in: 'open' the sheet here (she is back where she was), 'navigate' to the saved
 * path first (one try only, so a redirecting route can't loop), or nothing.
 */
export function resumeStep(saved, pathname) {
  if (!saved) return null;
  const target = saved.path.split(/[?#]/)[0];
  if (target === '/pro' || target === '/pro.html') return pathname === target ? null : (Number(saved.tries) >= 1 ? 'drop' : 'navigate');
  if (target === pathname || Number(saved.tries) >= 1) return 'open';
  return 'navigate';
}

/** Perimeter of a rounded rectangle. */
export function roundedPerimeter(w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  return 2 * (w + h) - (8 - 2 * Math.PI) * rr;
}

/** Path length that makes `square`-sized dashes tile the loop exactly (no seam). */
export function marqueeLength(perimeter, square) {
  return Math.max(2, Math.round(perimeter / (2 * square))) * 2 * square;
}

