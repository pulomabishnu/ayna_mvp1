/** Which of the five main tabs a screen (or overlay) sits under. */
export function navTabFor(screen, overlayType = null) {
  if (['profile', 'profile-auth'].includes(overlayType)) return 'profile';
  if (screen === 'today') return 'today';
  if (['explore', 'browse', 'library'].includes(screen)) return 'explore';
  if (screen === 'ask') return 'ask';
  if (screen === 'community') return 'community';
  // My ecosystem and Saved live under You.
  if (['eco', 'ecointro', 'saved'].includes(screen)) return 'profile';
  return null;
}
