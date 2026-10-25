/**
 * The tip registry (TUTORIAL_RESEARCH.md): one entry per main screen, 1 to 3
 * tips each, anchored to a real element with a data-tour attribute. Order
 * matters: a screen that sits on top of another (the product sheet over the
 * chat, the product page inside the sheet) is listed first.
 *
 * Copy rules: plain, short, sentence case, no em dashes, says what the thing
 * does for her. Never "chatbot" or "agent".
 */
import { AUTO_HOUR } from '../../components/rundown/autoLaunch.js';

export const OFF_NOTE = 'You can turn tips off any time in You, then Settings.';

export const SCREENS = [
  {
    id: 'product-page',
    root: '[data-tour="pdp"]',
    tips: [
      { id: 'pdp-why', anchor: '[data-tour="pdp-why"]', title: 'Your match', body: 'How well this fits you and why. Tap it for the details.' },
      { id: 'pdp-tabs', anchor: '[data-tour="pdp"] [data-tour="evidence-tabs"]', title: 'The full picture', body: 'ayna summary, clinical opinion, scientific literature and reviews, one tab each.' },
      { id: 'pdp-buy', anchor: '[data-tour="pdp-actions"]', title: 'Buy or add it', body: 'Buy opens the seller’s site. Add to my routine puts it in your ecosystem.' },
    ],
  },
  {
    id: 'product-sheet',
    root: '[data-tour="psheet"]',
    tips: [
      { id: 'psheet-match', anchor: '[data-tour="psheet-match"]', title: 'Your match', body: 'How well this fits you, with the reason. It comes from your health profile.' },
      { id: 'psheet-actions', anchor: '[data-tour="psheet"] [data-tour="quick-actions"]', title: 'One tap each', body: 'Save keeps it for later. Add to my routine puts it in your ecosystem.' },
      { id: 'psheet-tabs', anchor: '[data-tour="psheet"] [data-tour="evidence-tabs"]', title: 'Swipe for more', body: 'Swipe or tap between the ayna summary, clinical opinion, research and reviews.' },
    ],
  },
  {
    id: 'ask-sheet',
    root: '[data-tour="ask-sheet"]',
    tips: [
      { id: 'ask-prompts', anchor: '[data-tour="ask-prompts"]', title: 'Picked from your data', body: 'Each question shows the fact it comes from. Tap one to ask it right away.' },
      { id: 'ask-mic', anchor: '[data-tour="ask-sheet"] .ay-mic', title: 'Say it instead', body: 'Tap the mic and ask out loud. Nothing is recorded.' },
    ],
  },
  {
    id: 'chat',
    root: '[data-tour="chat"][data-open="true"]',
    tips: [
      { id: 'chat-starters', anchor: '[data-tour="chat-starters"]', title: 'From your Rundown', body: 'Questions about the cards you just saw. Tap one to ask it.' },
      { id: 'chat-guide', anchor: '[data-tour="chat-guide"]', title: 'Your week and notes', body: 'See what changed, what ayna remembers, and write a note for your next appointment.' },
      { id: 'chat-input', anchor: '[data-tour="chat-input"]', title: 'Ask anything', body: 'Type or tap the mic. Answers are educational, not medical advice.' },
    ],
  },
  {
    id: 'home',
    root: '[data-tour="home"]',
    rundown: true,
    tips: [
      { id: 'home-ask', anchor: '[data-tour="home-ask"]', title: 'Ask ayna', body: 'Ask about your health, a product or your day. Questions start from what you’ve shared.' },
      { id: 'home-rundown', anchor: '[data-tour="rundown-card"]', title: 'Your Daily Rundown', body: '60 seconds on what matters for your health today. It opens on its own each morning.' },
      { id: 'home-links', anchor: '[data-tour="home-links"]', title: 'One tap away', body: 'Your routine, daily log and health data are in My dashboard. Your matches are under it.' },
    ],
  },
  {
    id: 'explore',
    root: '[data-tour="explore"]',
    tips: [
      { id: 'explore-search', anchor: '[data-tour="explore"] .ax-top input', title: 'Search everything', body: 'Products, symptoms, topics and services, all in one search.' },
      { id: 'explore-sections', anchor: '[data-tour="explore-sections"]', title: 'Pick a section', body: 'For you, categories, products and services each have their own tab.' },
    ],
  },
  {
    id: 'community',
    root: '[data-tour="community"]',
    tips: [
      { id: 'community-tabs', anchor: '[data-tour="community-tabs"]', title: 'Find your people', body: 'Questions, reviews and playlists from other members, one tab each.' },
      { id: 'community-compose', anchor: '[data-tour="community-compose"]', title: 'Share something', body: 'Post a tip, a win or a photo. You can post anonymously.' },
    ],
  },
  {
    id: 'you',
    root: '[data-tour="you"]',
    tips: [
      { id: 'you-beliefs', anchor: '[data-tour="you-beliefs"]', title: 'What ayna knows', body: 'See, change or remove anything ayna uses to match you.' },
      { id: 'you-settings', anchor: '[data-tour="you"] .ay-header-settings', title: 'Settings', body: 'Notifications, appearance and tips. Turn tips off or replay them here.' },
    ],
  },
];

export const screenById = (id) => SCREENS.find((s) => s.id === id) || null;

/**
 * Safety and care items and the Ask inputs: a tip bubble never covers them
 * (and the dim leaves them clear). A tip anchored to one of them is skipped.
 */
export const AVOID = [
  '.ay-today__item.is-safety', '.ay-today__item.is-care', '.ay-pdp-safetyflag', '.ay-psheet__hold',
  '[data-tour-avoid]', '[role="alert"]',
  '.ay-asksheet__form', '.ay-ask-input',
];

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
    if (screen.id !== 'home' || prefs.welcomeDay === today) return { kind: 'none' };
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
  const list = (screen?.tips || []).filter((t) => isUsable(t.anchor)).slice(0, 3);
  return list.map((t, i) => (i === 0 && !offNoteShown ? { ...t, offNote: OFF_NOTE } : t));
}
