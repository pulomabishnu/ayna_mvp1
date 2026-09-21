import { useState } from 'react';

/**
 * A search-box placeholder showing ONE example search that never changes while the
 * page is open. A new example is picked (at random) each time the component mounts —
 * i.e. when the user leaves and comes back, or reloads the page. Nothing animates or
 * updates on its own, which keeps it accessible (no moving content to pause).
 * Pass enabled=false (e.g. once the user has typed something) to show the fallback.
 */
export default function useStaticPlaceholder(phrases, { prefix = '', fallback = '', enabled = true } = {}) {
  const [phrase] = useState(() => (
    Array.isArray(phrases) && phrases.length > 0
      ? phrases[Math.floor(Math.random() * phrases.length)]
      : ''
  ));
  if (!enabled || !phrase) return fallback;
  return `${prefix}${phrase}`;
}
