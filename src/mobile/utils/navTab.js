/**
 * Which of the app's five tabs a screen (or overlay) sits under:
 * Explore · Library · ayna (centre) · Community · You (founder, Oct 24 20:12).
 * The old Today and Ask ayna screens are views of the ayna tab now.
 */
export function navTabFor(screen, overlayType = null) {
  if (['profile', 'profile-auth'].includes(overlayType)) return 'profile';
  if (['ayna', 'today', 'ask'].includes(screen)) return 'ayna';
  if (['explore', 'browse'].includes(screen)) return 'explore';
  if (screen === 'library') return 'library';
  if (screen === 'community') return 'community';
  // My ecosystem and Saved live under You.
  if (['eco', 'ecointro', 'saved'].includes(screen)) return 'profile';
  return null;
}

/**
 * Old screen keys (push routes, dev links, saved history, code that still says
 * "today" or "ask") map onto the ayna tab and one of its views.
 * @returns {{ screen: string, view: string|null }}
 */
export function aynaRoute(screen) {
  if (screen === 'today') return { screen: 'ayna', view: 'dashboard' };
  if (screen === 'ask') return { screen: 'ayna', view: 'chat' };
  return { screen, view: null };
}

/**
 * Where the app opens. Answers waiting on the quiz-end steps come back there;
 * a profile or ecosystem on this phone (signed in, or kept here) opens the
 * ayna chat; a started quiz opens its intro; otherwise the welcome.
 */
export function initialAppRoute({ devScreen = null, pendingQuiz = false, quizStep = null, hasProfile = false, hasDraft = false } = {}) {
  return aynaRoute(devScreen
    || (pendingQuiz ? quizStep || 'connect' : null)
    || (hasProfile ? 'ayna' : hasDraft ? 'ecointro' : 'landing'));
}
