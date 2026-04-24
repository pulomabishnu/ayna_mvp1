import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { ROTATING_INTRO_WORDS } from '../data/rotatingIntroWords';

const CYCLE_MS = 2500;
const FADE_MS = 400;

/**
 * One span, imperative text + animation — same as ayna_waitlist (avoids React fighting textContent).
 * @see https://github.com/pulomabishnu/ayna_waitlist/blob/main/index.html
 */
export default function RotatingWordHeadline({
  words = ROTATING_INTRO_WORDS,
  before = "The women's health assistant built to find the best ",
  after = ' for your body.',
  as: Tag = 'h1',
  className = '',
  headlineClassName = 'ayna-rotating-headline',
  id,
  style = {},
}) {
  const wordRef = useRef(null);
  const indexRef = useRef(0);
  const wordsRef = useRef(words);
  wordsRef.current = words;

  useLayoutEffect(() => {
    const el = wordRef.current;
    if (el) el.textContent = wordsRef.current[0] ?? '';
    indexRef.current = 0;
  }, [words]);

  useEffect(() => {
    const el = wordRef.current;
    if (!el || (wordsRef.current || []).length === 0) return;

    const tick = () => {
      if (!el.isConnected) return;
      const w = wordsRef.current;
      el.style.animation = 'rotatingWordFadeOut 0.4s ease forwards';
      window.setTimeout(() => {
        if (!el.isConnected) return;
        indexRef.current = (indexRef.current + 1) % w.length;
        el.textContent = w[indexRef.current] ?? '';
        el.style.animation = 'rotatingWordFadeIn 0.4s ease both';
      }, FADE_MS);
    };

    const intervalId = window.setInterval(tick, CYCLE_MS);
    return () => window.clearInterval(intervalId);
  }, [words.length]);

  return (
    <Tag
      id={id}
      className={`${headlineClassName} ${className}`.trim()}
      style={{
        fontSize: 'clamp(1.35rem, 3.8vw, 2.15rem)',
        fontWeight: 600,
        ...style,
      }}
    >
      {before}
      <span
        ref={wordRef}
        className="ayna-rotating-word"
        aria-live="polite"
        aria-atomic="true"
      />
      {after}
    </Tag>
  );
}
