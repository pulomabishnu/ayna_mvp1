import { useEffect, useState } from 'react';

const KEY = 'ayna_mobile_personalized_v1';

function loadPersonalized() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

// Lives in MobileApp.jsx (above BrowseScreen) so the "For You" toggle
// survives navigating away from Browse and back — Browse fully unmounts
// when the screen changes (see SCREENS map in MobileApp.jsx), so state
// local to it can't outlive that. It should stay on until the user
// explicitly turns it off, not reset just from leaving the tab.
export function usePersonalizedFeed() {
  const [personalized, setPersonalized] = useState(loadPersonalized);

  useEffect(() => {
    try { localStorage.setItem(KEY, personalized ? '1' : '0'); } catch { /* private mode */ }
  }, [personalized]);

  return [personalized, setPersonalized];
}
