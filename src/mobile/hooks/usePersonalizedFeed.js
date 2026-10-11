import { useState } from 'react';

const KEY = 'ayna_mobile_personalized_v2';
const keyFor = (userId) => `${KEY}:${userId || 'guest'}`;

function loadPreference(userId) {
  try {
    const stored = localStorage.getItem(keyFor(userId));
    if (stored != null) return stored === '1';
  } catch { /* Storage may be unavailable. */ }
  return Boolean(userId);
}

// Remember the Browse choice for each account. A signed-in member starts in
// For You once, and a later manual choice remains theirs across navigation.
export function usePersonalizedFeed(userId) {
  const key = keyFor(userId);
  const [selection, setSelection] = useState(() => ({ key, value: loadPreference(userId) }));
  const personalized = selection.key === key ? selection.value : loadPreference(userId);

  const setPersonalized = (updater) => {
    const next = typeof updater === 'function' ? updater(personalized) : updater;
    setSelection({ key, value: next });
    try { localStorage.setItem(key, next ? '1' : '0'); } catch { /* private mode */ }
  };

  return [personalized, setPersonalized];
}
