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
  if (['ayna', 'today', 'ask'].includes(screen)) return 'home';
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
