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
export const FEATURE_ALIAS = { trial: 'tracking' };

/** The locked card's words, per gate id. Names come from the Pro features list. */
const LOCK_LINES = {
  ask: 'Free ayna includes 5 Ask ayna chats a day. Pro includes up to 50 a day.',
  reads: 'Free ayna includes one Read each week. Pro opens every Read in the Library.',
  playlists: 'Free ayna includes one playlist. Pro lets you make as many as you want.',
  quiz: 'Free ayna includes one ecosystem update a month. Pro lets you update it anytime.',
  wearables: 'Connect supported health apps and wearables so ayna can use the data you choose to share.',
  history: 'Detailed cycle, sleep and body history. Your basic health view stays free.',
  recap: 'A look back at your recent observations, where enough connected data is available.',
  trial: 'Try one small change, then check back in 7 or 14 days. Basic health logging stays free.',
  appointment: 'Organize symptoms, observations and questions before you see a clinician.',
  insights: 'Deeper personalized health insights, as Pro expands.',
};

export function proFeatureName(feature) {
  const id = FEATURE_ALIAS[feature] || feature;
  if (feature === 'insights') return 'Deeper health insights';
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
