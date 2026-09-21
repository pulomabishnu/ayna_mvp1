import { useEffect, useState } from 'react';

const TYPE_MS = 38;
const HOLD_MS = 2200;
const REDUCED_MOTION_HOLD_MS = 4000;

function prefersReducedMotion() {
  try {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * A search-box placeholder that keeps cycling through example searches: each one
 * is "typed" out, held for a moment, then replaced by the next. Under
 * prefers-reduced-motion it swaps whole phrases instead of animating the typing.
 * Pass enabled=false (e.g. once the user has typed something) to pause it.
 */
export default function useRotatingPlaceholder(phrases, { prefix = '', fallback = '', enabled = true } = {}) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!enabled || !Array.isArray(phrases) || phrases.length === 0) return undefined;

    let cancelled = false;
    let timer = null;
    let index = Math.floor(Math.random() * phrases.length);

    if (prefersReducedMotion()) {
      const showNext = () => {
        if (cancelled) return;
        setText(phrases[index % phrases.length]);
        index += 1;
        timer = setTimeout(showNext, REDUCED_MOTION_HOLD_MS);
      };
      showNext();
      return () => { cancelled = true; clearTimeout(timer); };
    }

    const typeNext = () => {
      if (cancelled) return;
      const phrase = phrases[index % phrases.length];
      let chars = 0;
      const step = () => {
        if (cancelled) return;
        chars += 1;
        setText(phrase.slice(0, chars));
        if (chars < phrase.length) {
          timer = setTimeout(step, TYPE_MS);
        } else {
          index += 1;
          timer = setTimeout(typeNext, HOLD_MS);
        }
      };
      step();
    };
    typeNext();

    return () => { cancelled = true; clearTimeout(timer); };
  }, [phrases, enabled]);

  if (!enabled || !text) return fallback;
  return `${prefix}${text}`;
}
