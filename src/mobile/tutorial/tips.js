/**
 * The tip registry (TUTORIAL_RESEARCH.md): one entry per main screen, at most
 * 2 tips shown, anchored to a real element with a data-tour attribute. Order
 * matters: a screen that sits on top of another (the product sheet over the
 * chat, the product page inside the sheet) is listed first.
 *
 * Copy rules: plain, short, sentence case, no em dashes, says what the thing
 * does for her. Never "chatbot" or "agent".
 */
import { AUTO_HOUR } from '../../components/rundown/autoLaunch.js';

export const OFF_NOTE = 'Turn tips off any time in Settings.';
// Founder (Oct 25, 23:53): do not overcrowd. One short sentence per tip,
// at most 2 shown per screen. A third entry is only a fallback for when an
// earlier anchor isn't on screen.
export const MAX_TIPS = 2;

export const SCREENS = [
  {
    id: 'product-page',
    root: '[data-tour="pdp"]',
    tips: [
      { id: 'pdp-why', anchor: '[data-tour="pdp-why"]', text: 'Tap your match to see why it fits you.' },
      { id: 'pdp-tabs', anchor: '[data-tour="pdp"] [data-tour="evidence-tabs"]', text: 'Summary, clinical opinion, research and reviews each have a tab.' },
      { id: 'pdp-buy', anchor: '[data-tour="pdp-actions"]', text: 'Buy it, or add it to your routine.' },
    ],
  },
  {
    id: 'product-sheet',
    root: '[data-tour="psheet"]',
    tips: [
      { id: 'psheet-match', anchor: '[data-tour="psheet-match"]', text: 'Your match, with the reason it fits you.' },
      { id: 'psheet-actions', anchor: '[data-tour="psheet"] [data-tour="quick-actions"]', text: 'Save it for later or add it to your routine.' },
      { id: 'psheet-tabs', anchor: '[data-tour="psheet"] [data-tour="evidence-tabs"]', text: 'Swipe between summary, clinical opinion, research and reviews.' },
    ],
  },
  {
    id: 'ask-sheet',
    root: '[data-tour="ask-sheet"]',
    tips: [
      { id: 'ask-prompts', anchor: '[data-tour="ask-prompts"]', text: 'Tap a question from your data to ask it.' },
      { id: 'ask-mic', anchor: '[data-tour="ask-sheet"] .ay-mic', text: 'Tap the mic to ask out loud.' },
    ],
  },
  {
    id: 'chat',
    root: '[data-tour="chat"][data-open="true"]',
    tips: [
      { id: 'chat-starters', anchor: '[data-tour="chat-starters"]', text: 'Tap a question about today’s Rundown to ask it.' },
      { id: 'chat-input', anchor: '[data-tour="chat-input"]', text: 'Type or tap the mic to ask anything.' },
      { id: 'chat-guide', anchor: '[data-tour="chat-guide"]', text: 'Your week, memory and appointment notes live here.' },
    ],
  },
  {
    id: 'home',
    root: '[data-tour="home"]',
    rundown: true,
    welcome: true,
    tips: [
      { id: 'home-ask', anchor: '[data-tour="home-ask"]', text: 'Ask about your health, a product or your day.' },
      { id: 'home-rundown', anchor: '[data-tour="rundown-card"]', text: 'Your Daily Rundown opens each morning, 60 seconds long.' },
      { id: 'home-links', anchor: '[data-tour="home-links"]', text: 'Your routine, log and health data live in My dashboard.' },
    ],
  },
  {
    id: 'explore',
    root: '[data-tour="explore"]',
    tips: [
      { id: 'explore-search', anchor: '[data-tour="explore"] .ax-top input', text: 'Search products, symptoms, topics and services in one place.' },
      { id: 'explore-sections', anchor: '[data-tour="explore-sections"]', text: 'Switch between For you, categories, products and services.' },
    ],
  },
  {
    id: 'community',
    root: '[data-tour="community"]',
    tips: [
      { id: 'community-tabs', anchor: '[data-tour="community-tabs"]', text: 'Questions, reviews and playlists from members, one tab each.' },
      { id: 'community-compose', anchor: '[data-tour="community-compose"]', text: 'Share a tip, a win or a photo, even anonymously.' },
    ],
  },
  {
    id: 'you',
    root: '[data-tour="you"]',
    tips: [
      { id: 'you-beliefs', anchor: '[data-tour="you-beliefs"]', text: 'See or change anything ayna uses to match you.' },
      { id: 'you-settings', anchor: '[data-tour="you"] .ay-header-settings', text: 'Turn tips off or replay them in Settings.' },
    ],
  },
];

/**
 * The website's screens (src/App.jsx main tabs and the product page). Same
 * rules and the same seen-state as the app: one store, one key
 * (ayna_tour_v1), so a screen id both have (explore, product-page,
 * community, you) counts once for her on either. Today is the web's Home:
 * the welcome is offered there, under the same Daily Rundown rules.
 */
export const WEB_SCREENS = [
  {
    id: 'product-page',
    root: '[data-tour="pdp"]',
    tips: [
      { id: 'pdp-why', anchor: '[data-tour="pdp"] [data-tour="pdp-why"]', text: 'Tap your match to see why it fits you.' },
      { id: 'pdp-fit', anchor: '[data-tour="pdp"] [data-tour="pdp-fit"]', text: 'Your match, with the reasons it fits you.' },
      { id: 'pdp-tabs', anchor: '[data-tour="pdp"] [data-tour="evidence-tabs"]', text: 'Summary, clinical opinion, research and reviews each have a tab.' },
      { id: 'pdp-buy', anchor: '[data-tour="pdp"] [data-tour="pdp-actions"]', text: 'Buy it, or save it for later.' },
    ],
  },
  {
    id: 'today',
    root: '[data-tour="today"]',
    rundown: true,
    welcome: true,
    tips: [
      { id: 'today-rundown', anchor: '[data-tour="today"] [data-tour="rundown-card"]', text: 'Your Daily Rundown is new each morning, 60 seconds long.' },
      // The first of today's things (a safety or care item is never a tip's anchor, so then it's skipped).
      { id: 'today-things', anchor: '[data-tour="today"] [data-tour="today-things"] > li:first-child', text: 'A few things for today, picked from your answers.' },
    ],
  },
  {
    id: 'ask',
    root: '[data-tour="ask"]',
    tips: [
      { id: 'ask-starters', anchor: '[data-tour="ask"] [data-tour="ask-starters"]', text: 'Tap a question to ask it right away.' },
      { id: 'ask-based', anchor: '[data-tour="ask"] [data-tour="ask-based"]', text: 'Answers keep these goals of yours in mind.' },
    ],
  },
  {
    id: 'explore',
    root: '[data-tour="explore"]',
    tips: [
      { id: 'explore-search', anchor: '[data-tour="explore"] [data-tour="explore-search"]', text: 'Search products, symptoms, topics and services in one place.' },
      { id: 'explore-sections', anchor: '[data-tour="explore"] [aria-label="Explore sections"]', text: 'Switch between picks for you, categories, products, services and reads.' },
    ],
  },
  {
    id: 'community',
    root: '[data-tour="community"]',
    tips: [
      { id: 'community-tabs', anchor: '[data-tour="community"] [data-tour="community-tabs"]', text: 'Questions, reviews and playlists from members, one tab each.' },
      { id: 'community-compose', anchor: '[data-tour="community"] [data-tour="community-compose"]', text: 'Ask a question or review a product, even anonymously.' },
    ],
  },
  {
    id: 'you',
    root: '[data-tour="you"]',
    tips: [
      // Big blocks point at their heading, so the anchor fits on screen.
      { id: 'you-know', anchor: '[data-tour="you"] [data-tour="you-know"] h2', text: 'See or change anything ayna uses to match you.' },
      { id: 'you-sections', anchor: '[data-tour="you"] [data-tour="you-sections"]', text: 'Your ecosystem, saved products and health live here.' },
      { id: 'you-settings', anchor: '[aria-label="You sections"] a[href="/you/settings"]', text: 'Turn tips off or replay them in Settings and privacy.' },
    ],
  },
];

export const screensFor = (surface = 'app') => (surface === 'web' ? WEB_SCREENS : SCREENS);
export const screenById = (id, surface = 'app') => screensFor(surface).find((s) => s.id === id) || null;

/**
 * Safety and care items and the Ask inputs: a tip bubble never covers them
 * (and the dim leaves them clear). A tip anchored to one of them is skipped.
 */
export const AVOID = [
  '.ay-today__item.is-safety', '.ay-today__item.is-care', '.ay-pdp-safetyflag', '.ay-psheet__hold',
  '[data-tour-avoid]', '[role="alert"]',
  '.ay-asksheet__form', '.ay-asksheet .ay-askp-composer', '.ay-ask-input',
];
/** The website adds its own: the product page's safety hold and cautions, and the Ask composer. */
export const WEB_AVOID = [
  ...AVOID,
  '.ay-hold', '.ay-buy__warn', '.ayq-alert',
  '.ayna-ask-panel__composer',
];
export const avoidFor = (surface = 'app') => (surface === 'web' ? WEB_AVOID : AVOID);

/**
 * Has the Daily Rundown had its chance to open? (rundownStore memory +
 * onboardingSignal.) True when it was already viewed or auto-opened today,
 * it's before 8, setup just finished (the Rundown skips that visit), or
 * Home has been settled long enough that the auto-launch check has passed.
 */
export function rundownSettled({ memory = {}, today, now = new Date(), justOnboarded = false, settledMs = 0, waitMs = 1800 } = {}) {
  if (memory.viewedDay === today || memory.autoDay === today) return true;
  if (now.getHours() < AUTO_HOUR) return true;
  if (justOnboarded) return true;
  return settledMs >= waitMs;
}

/**
 * What the overlay should do for the screen she's on.
 * @returns {{ kind: 'none' } | { kind: 'welcome' } | { kind: 'tips', screen }}
 */
export function tourDecision({ screen, prefs, today, onboarding = false, rundownOpen = false, foreignDialog = false, settled = true } = {}) {
  if (!screen || !prefs || onboarding || rundownOpen || foreignDialog) return { kind: 'none' };
  if (screen.rundown && !settled) return { kind: 'none' };
  if (prefs.enabled === null) {
    if (!screen.welcome || prefs.welcomeDay === today) return { kind: 'none' };
    return { kind: 'welcome' };
  }
  if (prefs.enabled === false || prefs.seen[screen.id]) return { kind: 'none' };
  return { kind: 'tips', screen };
}

/**
 * The tips to show now: only those whose anchor is on screen and isn't a
 * safety or care item. `isUsable(selector)` is the DOM check (TutorialLayer).
 * The first tip she ever sees carries the line on turning tips off.
 */
export function tipsToShow(screen, isUsable, { offNoteShown = false } = {}) {
  const list = (screen?.tips || []).filter((t) => isUsable(t.anchor)).slice(0, MAX_TIPS);
  return list.map((t, i) => (i === 0 && !offNoteShown ? { ...t, offNote: OFF_NOTE } : t));
}
