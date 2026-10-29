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

/*
 * A screen can also have parts (`within: 'home'` or a list of ids): more groups
 * of at most 2 tips on the same page, offered one group at a time after the
 * page's own tips, only once their root is on screen (a long page like Home,
 * a view she has to open like Routine). Each part is seen once, like a screen.
 * Tip copy uses tonight's names (Oct 27): Shop, Services, Home, Community,
 * Library, the Rundown bubble, For today, Your data.
 */
// The product page is long (restructured Oct 26): the buy row and the evidence tabs get their
// own parts, offered when she scrolls to them if they weren't on screen with her match.
const pdpParts = (buyText) => [
  {
    id: 'pdp-buy',
    within: 'product-page',
    root: '[data-tour="pdp"] [data-tour="pdp-actions"]',
    tips: [{ id: 'pdp-buy', anchor: '[data-tour="pdp"] [data-tour="pdp-actions"]', text: buyText }],
  },
  {
    id: 'pdp-tabs',
    within: 'product-page',
    root: '[data-tour="pdp"] [data-tour="evidence-tabs"]',
    tips: [{ id: 'pdp-tabs', anchor: '[data-tour="pdp"] [data-tour="evidence-tabs"]', text: 'Summary, clinical opinion, research and reviews each have a tab.' }],
  },
];

export const SCREENS = [
  {
    // Signed out, the first thing on the landing (founder Oct 27 03:59): one welcome tip on
    // Slide to start. No opt-in needed; it waits out the slider's one-time nudge (waitMs).
    id: 'landing',
    root: '[data-tour="landing-start"]',
    landing: true,
    waitMs: 2400,
    tips: [
      { id: 'landing-start', anchor: '[data-tour="landing-start"] .ay-sts__track', text: 'Welcome to ayna: start here to build your ecosystem.' },
    ],
  },
  {
    id: 'product-page',
    root: '[data-tour="pdp"]',
    tips: [
      { id: 'pdp-why', anchor: '[data-tour="pdp"] [data-tour="pdp-why"]', text: 'Tap your match to see why it fits you.' },
      { id: 'pdp-buy', anchor: '[data-tour="pdp"] [data-tour="pdp-actions"]', text: 'Buy it here, or tap the heart to save it.' },
    ],
  },
  ...pdpParts('Buy it here, or tap the heart to save it.'),
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
    id: 'metric-sheet',
    profile: true,
    root: '[data-tour="metric-sheet"]',
    tips: [
      { id: 'metric-range', anchor: '[data-tour="metric-sheet"] .ay-db-range', text: 'Switch between 7, 30 and 90 days.' },
      { id: 'metric-more', anchor: '[data-tour="metric-sheet"] .ay-msheet__more', text: 'Tap here for every chart in Your data.' },
    ],
  },
  {
    id: 'ask-sheet',
    root: '[data-tour="ask-sheet"]',
    tips: [
      { id: 'ask-prompts', anchor: '[data-tour="ask-prompts"]', text: 'Tap a suggestion to ask it right away.' },
      { id: 'ask-mic', anchor: '[data-tour="ask-sheet"] .ay-mic', text: 'Tap the mic to ask out loud.' },
    ],
  },
  {
    id: 'chat',
    root: '[data-tour="chat"][data-open="true"]',
    tips: [
      { id: 'chat-starters', anchor: '[data-tour="ask-starters"] [data-tab="rundown"]', text: 'Tap a question about today’s Rundown to ask it.' },
      { id: 'chat-input', anchor: '[data-tour="chat"] [data-tour="chat-input"]', text: 'Type or tap the mic to ask anything.' },
      { id: 'chat-guide', anchor: '[data-tour="ask-starters"] [data-tab="guide"]', text: 'Your week, memory and appointment notes live here.' },
    ],
  },
  {
    id: 'compare',
    root: '[data-tour="compare"]',
    tips: [
      { id: 'compare-table', anchor: '[data-tour="compare"] h1', text: 'Pick 2 to 4 products to see them side by side.' },
      { id: 'compare-pick', anchor: '[data-tour="compare"] .ay-cmpv__pick', text: 'Tap a product here to add it to the comparison.' },
    ],
  },
  {
    id: 'home',
    profile: true,
    root: '[data-tour="home"]',
    rundown: true,
    welcome: true,
    tips: [
      { id: 'home-rings', anchor: '[data-tour="home"] [data-tour="score-rings"]', text: 'Your cycle, sleep and activity; tap a ring for more.' },
      { id: 'home-rundown', anchor: '[data-tour="home"] [data-tour="rundown-bubble"]', text: 'Tap Rundown for your 60-second Daily Rundown.' },
    ],
  },
  {
    id: 'home-streak',
    profile: true,
    within: 'home',
    root: '[data-tour="home"] [data-tour="streak"]',
    tips: [
      { id: 'home-streak', anchor: '[data-tour="home"] [data-tour="streak"]', text: 'Log once a day to keep your streak going.' },
    ],
  },
  {
    id: 'home-header',
    within: 'home',
    root: '[data-tour="home"] [data-tour="saved-heart"]',
    tips: [
      { id: 'saved-heart', anchor: '[data-tour="home"] [data-tour="saved-heart"]', text: 'Everything you save is under the heart.' },
      { id: 'profile-button', anchor: '[data-tour="home"] [data-tour="profile-button"]', text: 'Tap here for your profile and Settings.' },
    ],
  },
  {
    id: 'home-links',
    profile: true,
    within: 'home',
    root: '[data-tour="home"] [data-tour="home-links"]',
    tips: [
      { id: 'home-links', anchor: '[data-tour="home"] [data-tour="home-links"]', text: 'Your data and Your products each open in one tap.' },
    ],
  },
  {
    id: 'home-views',
    profile: true,
    within: 'home',
    root: '[data-tour="home"] [data-tour="home-views"]',
    tips: [
      { id: 'home-views', anchor: '[data-tour="home"] [data-tour="home-views"] [role="tablist"]', text: 'Switch between Your week, For today and Routine.' },
    ],
  },
  {
    id: 'home-today',
    profile: true,
    within: 'home',
    root: '[data-tour="home"] [data-tour="deck"]',
    tips: [
      { id: 'deck-later', anchor: '[data-tour="home"] [data-tour="deck-later"]', text: 'Tap Later to move a card to the back for now.' },
    ],
  },
  {
    // Only when she has more than one thing for today (the titles of the cards behind).
    id: 'home-deck-titles',
    profile: true,
    within: 'home',
    root: '[data-tour="home"] [data-tour="deck-titles"]',
    tips: [
      { id: 'deck-titles', anchor: '[data-tour="home"] [data-tour="deck-titles"]', text: 'Tap a title to bring that card to the front.' },
    ],
  },
  {
    id: 'home-routine',
    profile: true,
    within: 'home',
    root: '[data-tour="home"] [data-tour="routine"]',
    tips: [
      // The timeline can be taller than the screen: the first step (or the empty line) is the anchor.
      { id: 'home-routine', anchor: '[data-tour="home"] [data-tour="routine"] :is(.ay-rtl__line > li:first-child, p:first-child)', text: 'Your routine for the day, in order.' },
    ],
  },
  {
    id: 'health-data',
    profile: true,
    root: '[data-tour="health-data"]',
    tips: [
      { id: 'data-rings', anchor: '[data-tour="health-data"] [data-tour="score-rings"]', text: 'Tap a ring to open its detail.' },
    ],
  },
  {
    id: 'services',
    root: '[data-tour="explore"][data-kind="services"]',
    tips: [
      { id: 'services-search', anchor: '[data-tour="explore"][data-kind="services"] .ayna-shop-heading input', text: 'Search care, apps and clinics by need.' },
      { id: 'services-card', anchor: '[data-tour="explore"][data-kind="services"] [data-tour="service-card"]', text: 'Tap a service to see its cost and how to start.' },
    ],
  },
  {
    id: 'explore',
    root: '[data-tour="explore"]',
    tips: [
      { id: 'explore-search', anchor: '[data-tour="explore"] .ayna-shop-heading input', text: 'Search products and brands in one place.' },
      { id: 'explore-sections', anchor: '[data-tour="explore"] [data-tour="explore-sections"]', text: 'Tap a group to shop by need.' },
    ],
  },
  {
    id: 'shop-compare',
    within: 'explore',
    root: '[data-tour="explore"] [data-tour="compare-toggle"]',
    tips: [
      { id: 'compare-toggle', anchor: '[data-tour="explore"] [data-tour="compare-toggle"]', text: 'Tap Compare, then pick products to see side by side.' },
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
    id: 'library',
    root: '[data-tour="reads"]',
    tips: [
      { id: 'library-search', anchor: '[data-tour="reads"] .ay-lib-head input', text: 'Search reads by symptom, product or topic.' },
      { id: 'library-topics', anchor: '[data-tour="reads"] .al-topics--v9 :is(button, a)', text: 'Tap a topic to see only those reads.' },
    ],
  },
  {
    id: 'ask-row',
    within: ['explore', 'services', 'community', 'library'],
    root: '[data-tour="ask-suggest"]',
    tips: [
      { id: 'ask-suggest', anchor: '[data-tour="ask-suggest"] .ay-asksug__pill', text: 'Tap a question to ask ayna right away.' },
    ],
  },
  {
    id: 'you',
    root: '[data-tour="you"]',
    tips: [
      { id: 'you-sections', anchor: '[data-tour="you"] [data-tour="you-sections"] :is(button, a)', text: 'Your ecosystem, saved products and health live here.' },
      { id: 'you-settings', anchor: '[data-tour="you"] .ay-header-settings', text: 'Turn tips off or replay them in Settings.' },
    ],
  },
  {
    id: 'you-beliefs',
    within: 'you',
    root: '[data-tour="you"] [data-tour="you-beliefs"]',
    tips: [
      { id: 'you-beliefs', anchor: '[data-tour="you"] [data-tour="you-beliefs"]', text: 'See or change anything ayna uses to match you.' },
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
    // Signed out, the first thing on the landing (founder Oct 27 03:59): one welcome tip on
    // Slide to start. No opt-in needed; it waits out the slider's one-time nudge (waitMs).
    id: 'landing',
    root: '[data-tour="landing-start"]',
    landing: true,
    waitMs: 2400,
    tips: [
      { id: 'landing-start', anchor: '[data-tour="landing-start"] .ay-sts__track', text: 'Welcome to ayna: start here to build your ecosystem.' },
    ],
  },
  {
    id: 'product-page',
    root: '[data-tour="pdp"]',
    tips: [
      { id: 'pdp-why', anchor: '[data-tour="pdp"] [data-tour="pdp-why"]', text: 'Tap your match to see why it fits you.' },
      { id: 'pdp-buy', anchor: '[data-tour="pdp"] [data-tour="pdp-actions"]', text: 'Buy it, or save it for later.' },
    ],
  },
  ...pdpParts('Buy it, or save it for later.'),
  {
    id: 'metric-sheet',
    profile: true,
    root: '[data-tour="metric-sheet"]',
    tips: [
      { id: 'metric-range', anchor: '[data-tour="metric-sheet"] .ay-db-range', text: 'Switch between 7, 30 and 90 days.' },
      { id: 'metric-more', anchor: '[data-tour="metric-sheet"] .ay-msheet__more', text: 'Tap here for every chart in Your data.' },
    ],
  },
  {
    id: 'compare',
    root: '[data-tour="compare"]',
    tips: [
      { id: 'compare-sample', anchor: '[data-tour="compare"] .aycmp__sample-head', text: 'A sample comparison; add your own products below it.' },
      { id: 'compare-add', anchor: '[data-tour="compare"] :is(.aycmp__add, .aycmp__own-cta)', text: 'Add products to compare 2 to 4 side by side.' },
    ],
  },
  {
    id: 'today',
    profile: true,
    root: '[data-tour="today"]',
    rundown: true,
    welcome: true,
    tips: [
      { id: 'today-rundown', anchor: '[data-tour="today"] [data-tour="rundown-card"]', text: 'Your Daily Rundown is new each morning, 60 seconds long.' },
      { id: 'home-rings', anchor: '[data-tour="today"] [data-tour="score-rings"]', text: 'Your cycle, sleep and activity; tap a ring for more.' },
    ],
  },
  {
    // With health data the rings lead and the Rundown card can sit lower: its tip then comes on scroll.
    id: 'today-rundown',
    profile: true,
    within: 'today',
    root: '[data-tour="today"] [data-tour="rundown-card"]',
    tips: [
      { id: 'today-rundown', anchor: '[data-tour="today"] [data-tour="rundown-card"]', text: 'Your Daily Rundown is new each morning, 60 seconds long.' },
    ],
  },
  {
    id: 'today-more',
    profile: true,
    within: 'today',
    root: '[data-tour="today"] [data-tour="today-things"]',
    tips: [
      // The first of today's things (a safety or care item is never a tip's anchor, so then it's skipped).
      { id: 'today-things', anchor: '[data-tour="today"] [data-tour="today-things"] > li:first-child', text: 'A few things for today, picked from your answers.' },
      { id: 'home-views', anchor: '[data-tour="today"] [role="tablist"]', text: 'Switch between Your week and Routine.' },
    ],
  },
  {
    id: 'web-header',
    within: ['today', 'explore', 'services', 'community', 'library'],
    root: '.app-nav-wrap .ay-nav__heart',
    tips: [
      { id: 'saved-heart', anchor: '.app-nav-wrap .ay-nav__heart', text: 'Everything you save is under the heart.' },
      { id: 'profile-button', anchor: '.app-nav-wrap .ay-avatar', text: 'Tap here for your profile and Settings.' },
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
    id: 'services',
    root: '.app-container[data-view="explore-services"] [data-tour="explore"]',
    tips: [
      { id: 'services-search', anchor: '.app-container[data-view="explore-services"] [data-tour="explore-search"]', text: 'Search care, apps and clinics by need.' },
      { id: 'services-card', anchor: '.app-container[data-view="explore-services"] [data-tour="service-card"]', text: 'Tap a service to see its cost and how to start.' },
    ],
  },
  {
    id: 'explore',
    root: '[data-tour="explore"]',
    tips: [
      { id: 'explore-search', anchor: '[data-tour="explore"] [data-tour="explore-search"]', text: 'Search products, symptoms, topics and services in one place.' },
      { id: 'explore-sections', anchor: '[data-tour="explore"] [data-tour="explore-sections"]', text: 'Tap a group to shop by need.' },
    ],
  },
  {
    id: 'shop-compare',
    within: 'explore',
    root: '[data-tour="explore"] [data-tour="compare-toggle"]',
    tips: [
      { id: 'compare-toggle', anchor: '[data-tour="explore"] [data-tour="compare-toggle"]', text: 'Tap Compare, then pick products to see side by side.' },
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
    id: 'library',
    // The Library page (Articles.jsx) carries no data-tour of its own: its header classes are the anchors.
    root: '.app-container[data-view="articles"] .lb-lib',
    tips: [
      { id: 'library-search', anchor: '.app-container[data-view="articles"] .lb-search', text: 'Search reads by symptom, product or topic.' },
      { id: 'library-topics', anchor: '.app-container[data-view="articles"] .ll-side ul > :first-child', text: 'Pick a topic to see only those reads.' },
    ],
  },
  {
    id: 'ask-row',
    within: ['explore', 'services', 'community', 'library'],
    root: '[data-tour="ask-suggest"]',
    tips: [
      { id: 'ask-suggest', anchor: '[data-tour="ask-suggest"] .ay-asksug__pill', text: 'Tap a question to ask ayna right away.' },
    ],
  },
  {
    id: 'you',
    root: '[data-tour="you"]',
    tips: [
      // Big blocks point at their heading, so the anchor fits on screen.
      { id: 'you-know', anchor: '[data-tour="you"] [data-tour="you-know"] h2', text: 'See or change anything ayna uses to match you.' },
      { id: 'you-sections', anchor: '[data-tour="you"] [data-tour="you-sections"] :is(button, a)', text: 'Your ecosystem, saved products and health live here.' },
      { id: 'you-settings', anchor: '[data-tour="you"] [aria-label^="Settings & privacy"]', text: 'Turn tips off or replay them in Settings and privacy.' },
    ],
  },
];

export const screensFor = (surface = 'app') => (surface === 'web' ? WEB_SCREENS : SCREENS);
/** The page-level screens (no parts): the ones that can be the screen she's on. */
export const topScreens = (screens) => screens.filter((s) => !s.within);
const withinIds = (s) => (Array.isArray(s.within) ? s.within : s.within ? [s.within] : []);
/** The parts of a page, in order. */
export const partsOf = (screen, screens) => (screen ? screens.filter((s) => withinIds(s).includes(screen.id)) : []);
export const screenById = (id, surface = 'app') => screensFor(surface).find((s) => s.id === id) || null;

/**
 * Safety and care items and the Ask inputs: a tip bubble never covers them
 * (and the dim leaves them clear). A tip anchored to one of them is skipped.
 */
export const AVOID = [
  '.ay-today__item.is-safety', '.ay-today__item.is-care', '.ay-pdp-safetyflag', '.ay-psheet__hold',
  '[data-tour-avoid]', '[role="alert"]',
  '.ay-asksheet__form', '.ay-asksheet .ay-askp-composer', '.ay-ask-input',
  '.lsx-search',
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
export function tourDecision({ screen, prefs, today, onboarding = false, rundownOpen = false, foreignDialog = false, settled = true, hasProfile = true } = {}) {
  if (!screen || !prefs || rundownOpen || foreignDialog) return { kind: 'none' };
  // The landing's welcome tip: before setup, no opt-in asked; Turn off tips still wins.
  if (screen.landing) return prefs.enabled === false || prefs.seen[screen.id] ? { kind: 'none' } : { kind: 'tips', screen };
  if (onboarding) return { kind: 'none' };
  // Tips about her own data (Home rings, streak, For today...) wait until she has a profile.
  if (screen.profile && !hasProfile) return { kind: 'none' };
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
export function tipsToShow(screen, isUsable, { offNoteShown = false, seen = {} } = {}) {
  const list = (screen?.tips || []).filter((t) => !seen[`tip:${t.id}`] && isUsable(t.anchor)).slice(0, MAX_TIPS);
  return list.map((t, i) => (i === 0 && !offNoteShown ? { ...t, offNote: OFF_NOTE } : t));
}
