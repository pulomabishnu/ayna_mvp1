/**
 * Ask ayna opens as a guided chat: starter questions that follow where she
 * is and what ayna knows (founder, Oct 25). Pure: context in, tiles out.
 *
 *   surface: 'today' | 'pdp' | 'shop' | 'explore' | 'ecosystem' | 'compare' | 'other'
 *   signals (from Today, on this device only): hasRundown, hasYesterdayLog,
 *     lowSleepOrEnergy (she logged low sleep/mood, or connected sleep dropped),
 *     hasRecentChanges, hasHistory (tries with outcomes)
 *
 * A starter only appears when ayna can answer it from what it has: "Why am I
 * feeling so tired today?" needs a low sleep or energy signal; "Explain my
 * Daily Rundown" needs a rundown. Tiles fill the box; nothing sends on its own.
 */

export const SURFACES = ['home', 'today', 'pdp', 'shop', 'explore', 'ecosystem', 'compare', 'other'];

const t = (label, question, icon, tone, sub) => ({ label, question, icon, tone, ...(sub ? { sub } : {}) });

export function defaultStarters({ hasHealthData = false } = {}) {
  return [
    t('Ask about your week', 'What stands out in my health data this week?', 'week', 'pink', hasHealthData ? 'Read against your cycle' : 'Best with health data connected'),
    t('What helps with period cramps?', 'What helps with period cramps?', 'cramps', 'sky'),
    t('What helped last time?', 'What helped last time?', 'chat', 'group', 'From what you recorded'),
    t('Explain my top match', 'Explain my top match', 'match', 'ink', 'The % and why, from your profile'),
  ];
}

/**
 * @param {{ surface?: string, signals?: object, productName?: string, hasHealthData?: boolean }} ctx
 * @returns {Array<{ label, question, icon, tone, sub? }>} 2 to 5 tiles
 */
export function startersFor({ surface = 'other', signals = {}, productName = '', hasHealthData = false } = {}) {
  const s = signals || {};
  const name = String(productName || '').trim();
  let out;
  switch (surface) {
    // The app's ayna tab, where the chat is home (founder, Oct 24 20:12).
    case 'home':
      out = [
        t('What should I focus on today?', 'What should I focus on today?', 'week', 'pink', 'From your log and data'),
        s.lowSleepOrEnergy && t('Why am I feeling so tired today?', 'Why am I feeling so tired today?', 'chat', 'ink'),
        s.hasRundown && t('Explain my Daily Rundown', 'Explain my Daily Rundown', 'chat', 'sky'),
        s.hasYesterdayLog && t('What changed from yesterday?', 'What changed from yesterday?', 'week', 'group'),
        t('Explain my top match', 'Explain my top match', 'match', 'ink', 'The % and why, from your profile'),
        t('Check a product for me', 'Check a product for me', 'safety', 'sky', 'Ingredients, safety notes and evidence'),
      ].filter(Boolean).slice(0, 5);
      break;
    case 'today':
      out = [
        t('What should I focus on today?', 'What should I focus on today?', 'week', 'pink', 'From your log and data'),
        s.hasRundown && t('Explain my Daily Rundown', 'Explain my Daily Rundown', 'chat', 'sky'),
        s.hasYesterdayLog && t('What changed from yesterday?', 'What changed from yesterday?', 'week', 'group'),
        s.lowSleepOrEnergy && t('Why am I feeling so tired today?', 'Why am I feeling so tired today?', 'chat', 'ink'),
        s.hasHistory && t('What helped last time?', 'What helped last time?', 'chat', 'group', 'From what you recorded'),
      ];
      break;
    case 'pdp':
      out = [
        t(name ? `Why is ${name} my match?` : 'Why is this my match?', name ? `Why is ${name} my match?` : 'Why is this my match?', 'match', 'pink', 'The % and why, from your profile'),
        t('Check this product for me', name ? `Check ${name} for me` : 'Check this product for me', 'safety', 'sky', 'Ingredients, safety notes and evidence'),
        t('What are similar options?', name ? `What are similar options to ${name}?` : 'What are similar options to this?', 'leaf', 'group'),
      ];
      break;
    case 'shop':
    case 'explore':
      out = [
        t('Show me non-pill options under $30', 'Show me non-pill options under $30', 'leaf', 'pink'),
        t('Explain my top match', 'Explain my top match', 'match', 'ink', 'The % and why, from your profile'),
        t('What helps with period cramps?', 'What helps with period cramps?', 'cramps', 'sky'),
      ];
      break;
    case 'ecosystem':
      out = [
        t('What changed recently?', 'What changed recently?', 'week', 'pink', s.hasRecentChanges ? 'From your log and data' : null),
        t('Explain my top match', 'Explain my top match', 'match', 'ink', 'The % and why, from your profile'),
        s.hasHistory && t('What helped last time?', 'What helped last time?', 'chat', 'group', 'From what you recorded'),
      ];
      break;
    case 'compare':
      out = [
        t('Which one fits my preferences better?', 'Which one fits my preferences better?', 'match', 'pink'),
        t('Which has stronger evidence?', 'Which of these has stronger evidence?', 'leaf', 'sky'),
      ];
      break;
    default:
      out = defaultStarters({ hasHealthData });
  }
  return out.filter(Boolean);
}

/**
 * Where she is, read from the screen already on the page (no props threaded
 * through the app): the app root's data-screen, the site root's data-view,
 * and the product she has open.
 */
export function askSurfaceFrom({ doc = typeof document !== 'undefined' ? document : null, search = typeof window !== 'undefined' ? window.location.search : '', focusProduct = null } = {}) {
  if (focusProduct) return 'pdp';
  if (!doc) return 'other';
  const app = doc.querySelector?.('.ayna-mobile[data-screen]');
  if (app) {
    const screen = app.getAttribute('data-screen');
    if (screen === 'ayna') return doc.querySelector('.ay-home[data-view="dashboard"]') ? 'today' : 'home';
    if (screen === 'today') return 'today';
    if (screen === 'eco') return doc.querySelector('.eco-seg[data-on="dashboard"]') ? 'today' : 'ecosystem';
    if (screen === 'browse' || screen === 'shop') return 'shop';
    if (screen === 'library' || screen === 'explore') return 'explore';
    return 'other';
  }
  const view = doc.querySelector?.('.app-container[data-view]')?.getAttribute('data-view') || '';
  if (view === 'health' || view === 'today' || (view === 'ecosystem' && /view=dashboard/.test(search))) return 'today';
  if (view === 'ecosystem') return doc.querySelector('.ay-today') ? 'today' : 'ecosystem';
  if (view === 'discovery') return 'shop';
  if (view === 'articles' || view === 'explore') return 'explore';
  if (view === 'comparison') return 'compare';
  return 'other';
}

/**
 * Signed out on the app's chat home: only starters ayna answers on this
 * phone (src/utils/askToday.js, askHistory.js, askMatch.js), so every one
 * works without an account. "Explain my top match" needs her profile saved
 * here. Tiles fill the box; nothing sends on its own.
 */
export function onDeviceStarters({ hasProfile = false, signals = {}, device = 'phone' } = {}) {
  const s = signals || {};
  const here = `this ${device}`;
  return [
    t('What should I focus on today?', 'What should I focus on today?', 'week', 'pink', `Answered on ${here}`),
    s.hasRundown && t('Explain my Daily Rundown', 'Explain my Daily Rundown', 'chat', 'sky', `Answered on ${here}`),
    t('What changed from yesterday?', 'What changed from yesterday?', 'week', 'group', `From your log on ${here}`),
    hasProfile && t('Explain my top match', 'Explain my top match', 'match', 'ink', `The % and why, on ${here}`),
    t('What helped last time?', 'What helped last time?', 'chat', 'group', 'From what you recorded here'),
  ].filter(Boolean);
}
