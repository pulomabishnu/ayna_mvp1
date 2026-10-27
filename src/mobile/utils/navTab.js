/**
 * Which of the app's five tabs a screen (or overlay) sits under:
 * Today · Shop · Services · Community · Library (founder, Oct 26).
 * Today (key 'home') is the 'ayna' screen. Shop keeps the 'explore' key; the
 * same screen with the Services section is the Services tab. The chat ('ask')
 * and You ('profile') are reached from the header, so no tab lights for them.
 * In the chat-first variant (?home=chat) the chat is home.
 */
export function navTabFor(screen, overlayType = null, { view = null, variant = 'dashboard', section = null } = {}) {
  if (['profile', 'profile-auth'].includes(overlayType)) return 'profile';
  if (variant !== 'chat' && (screen === 'ask' || (screen === 'ayna' && view === 'chat'))) return 'ask';
  // The landing is Home when signed out (founder, Oct 27 01:10).
  if (['ayna', 'today', 'ask', 'landing'].includes(screen)) return 'home';
  if (screen === 'library' || (screen === 'explore' && section === 'resources')) return 'library';
  if (screen === 'explore' && section === 'services') return 'services';
  if (['explore', 'browse'].includes(screen)) return 'explore';
  if (screen === 'community') return 'community';
  // My ecosystem and Saved live under You.
  if (['eco', 'ecointro', 'saved'].includes(screen)) return 'profile';
  return null;
}

/**
 * Old screen keys (push routes, dev links, saved history, code that still says
 * "today", "ask" or "ayna") map onto Home and one of its views.
 *   dashboard-first Home (default): 'home' (the one-screen dashboard),
 *     'dashboard' (everything else on it), 'chat' (full screen), 'products'.
 *   chat-first Home (?home=chat, focus group): 'chat' is home, with
 *     'products' and 'dashboard' behind its switch.
 * @returns {{ screen: string, view: string|null }}
 */
export function aynaRoute(screen, variant = 'dashboard') {
  const chatFirst = variant === 'chat';
  if (screen === 'home' || screen === 'ayna') return { screen: 'ayna', view: chatFirst ? 'chat' : 'home' };
  if (screen === 'today') return { screen: 'ayna', view: chatFirst ? 'dashboard' : 'home' };
  if (screen === 'ask') return { screen: 'ayna', view: 'chat' };
  return { screen, view: null };
}

/**
 * Where the app opens. Answers waiting on the quiz-end steps come back there;
 * a profile or ecosystem on this phone (signed in, or kept here) opens Home; a started quiz opens its intro; otherwise the welcome.
 */
export function initialAppRoute({ devScreen = null, pendingQuiz = false, quizStep = null, hasProfile = false, hasDraft = false, variant = 'dashboard' } = {}) {
  return aynaRoute(devScreen
    || (pendingQuiz ? quizStep || 'connect' : null)
    || (hasProfile ? 'home' : hasDraft ? 'ecointro' : 'landing'), variant);
}

/**
 * Where Home goes. Signed out, Home is always the landing, whatever this phone
 * or browser kept from earlier visits (answers, an ecosystem, a quiz waiting,
 * fixtures). Founder, Oct 27 11:38 ("it should stay on the landing page when ur
 * signed out on the app, not glitch and go to an empty dashboard") and 13:46
 * ("if im signed out its not taking me to the landing page its taking me to an
 * empty dashboard"). Signed-out visitors reach Shop, Services, Community and
 * Library from the tabs; a finished quiz shows her matches in My ecosystem.
 * `hasProfile` and `pendingQuiz` are still accepted and no longer change it.
 */
export function homeScreenFor({ signedIn = false } = {}) {
  return signedIn ? 'ayna' : 'landing';
}

/**
 * True when the app is showing the Home dashboard to someone signed out (or
 * whose session is still loading). The chat view of Home (the Ask tab) is fine
 * signed out; the dashboard is not.
 */
export function showsEmptyHome({ screen, view = null, variant = 'dashboard', signedIn = false } = {}) {
  if (screen !== 'ayna' && screen !== 'today') return false;
  if (screen === 'ayna' && view === 'chat' && variant !== 'chat') return false;
  return homeScreenFor({ signedIn }) === 'landing';
}

/**
 * The website's Home: Today signed in, the landing ('welcome') signed out, the
 * same rule as the app. While her session is still being restored, Today (it
 * hands over to the landing if she turns out to be signed out).
 */
export function webHomeView({ signedIn = false, authLoading = false } = {}) {
  return signedIn || authLoading ? 'today' : 'welcome';
}
