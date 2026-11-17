import { useState } from 'react';

// Nov 16 (founder: "make the default when you first get into Shop 'My matches only' toggled off"):
// Shop opens with everything shown each time the app opens. Turning "My matches only" on lasts for this
// visit (switching tabs keeps it), not across launches.
export function usePersonalizedFeed(userId) {
  const [selection, setSelection] = useState(() => ({ key: userId || 'guest', value: false }));
  const key = userId || 'guest';
  const personalized = selection.key === key ? selection.value : false;
  const setPersonalized = (updater) => {
    const next = typeof updater === 'function' ? updater(personalized) : updater;
    setSelection({ key, value: Boolean(next) });
  };
  return [personalized, setPersonalized];
}
