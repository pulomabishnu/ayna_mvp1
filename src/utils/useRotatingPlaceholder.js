import { useEffect, useRef, useState } from 'react';

const SWAP_MS = 5000;

function prefersReducedMotion() {
  try {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * A search-box placeholder that shows one example search at a time and swaps to the
 * next every few seconds. Written to be safe for people with vestibular, cognitive
 * or low-vision needs:
 *   - whole phrases swap in place; nothing is "typed" letter by letter, so the box
 *     never shows half-finished words;
 *   - it does not move at all under prefers-reduced-motion (one fixed example);
 *   - it holds still while `paused` is true — Browse passes true while the box is
 *     focused or hovered, so anyone reading, tabbing in or pointing at it gets a
 *     stable example (WCAG 2.2.2 pause/stop/hide);
 *   - callers keep a real aria-label on the input, since placeholder text is not a
 *     label and is not announced when it changes.
 * Pass enabled=false (e.g. once the user has typed something) to switch it off.
 */
export default function useRotatingPlaceholder(phrases, { prefix = '', fallback = '', enabled = true, paused = false } = {}) {
  const [index, setIndex] = useState(0);
  const startedAt = useRef(null);

  // Start on a random example, but only once, so re-renders never re-shuffle.
  if (startedAt.current === null && Array.isArray(phrases) && phrases.length > 0) {
    startedAt.current = Math.floor(Math.random() * phrases.length);
  }

  useEffect(() => {
    if (!enabled || paused || prefersReducedMotion()) return undefined;
    if (!Array.isArray(phrases) || phrases.length < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => i + 1), SWAP_MS);
    return () => clearInterval(timer);
  }, [phrases, enabled, paused]);

  if (!enabled || !Array.isArray(phrases) || phrases.length === 0) return fallback;
  const phrase = phrases[((startedAt.current || 0) + index) % phrases.length];
  return `${prefix}${phrase}`;
}
