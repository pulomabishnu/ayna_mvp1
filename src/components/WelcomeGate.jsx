import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import ScrollReveal from './ScrollReveal';
import RotatingWordHeadline from './RotatingWordHeadline';
import WaitlistLandingLayout from './WaitlistLandingLayout';

const WELCOME_PREFIX = 'Welcome to ';
const AYNA_WORD = 'AYNA';
const INTRO_TEXT = `${WELCOME_PREFIX}${AYNA_WORD}`;
const AYNA_START_INDEX = WELCOME_PREFIX.length;
const LETTER_MS = 88;
const PAUSE_AFTER_TYPING_MS = 380;
const MORPH_DURATION_MS = 1000;

/**
 * One-line typewriter, then the headline shrinks and moves to its final place;
 * the rest of the page appears after the morph completes.
 */
export default function WelcomeGate({ onPersonalizedPath, onBrowsePath, onWelcomePhaseChange }) {
  const [reveal, setReveal] = useState(0);
  const [headlineMode, setHeadlineMode] = useState('hero');
  const [showRest, setShowRest] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const morphDoneTimerRef = useRef(null);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Reduced motion: static final layout, all content at once
  useLayoutEffect(() => {
    if (!reduceMotion) return;
    setReveal(INTRO_TEXT.length);
    setHeadlineMode('docked');
    setShowRest(true);
  }, [reduceMotion]);

  // Letter stream (hero only)
  useEffect(() => {
    if (reduceMotion) return;
    if (headlineMode !== 'hero') return;
    if (reveal >= INTRO_TEXT.length) return;
    const t = window.setTimeout(() => setReveal((r) => r + 1), LETTER_MS);
    return () => window.clearTimeout(t);
  }, [reveal, headlineMode, reduceMotion]);

  // When typing is complete, short pause, then start dock (shrink + move)
  useEffect(() => {
    if (reduceMotion) return;
    if (reveal < INTRO_TEXT.length) return;
    if (headlineMode === 'docked' || showRest) return;
    const t = window.setTimeout(() => setHeadlineMode('docked'), PAUSE_AFTER_TYPING_MS);
    return () => window.clearTimeout(t);
  }, [reveal, headlineMode, showRest, reduceMotion]);

  // After morph animation, reveal eyebrow, rotating line, copy, CTA
  useEffect(() => {
    if (reduceMotion) return;
    if (headlineMode !== 'docked' || showRest) return;
    if (morphDoneTimerRef.current) window.clearTimeout(morphDoneTimerRef.current);
    morphDoneTimerRef.current = window.setTimeout(() => {
      setShowRest(true);
      morphDoneTimerRef.current = null;
    }, MORPH_DURATION_MS);
    return () => {
      if (morphDoneTimerRef.current) {
        window.clearTimeout(morphDoneTimerRef.current);
        morphDoneTimerRef.current = null;
      }
    };
  }, [headlineMode, showRest, reduceMotion]);

  // Sync app chrome: immersive until second screen content is ready
  useEffect(() => {
    onWelcomePhaseChange?.(showRest ? 'main' : 'intro');
  }, [showRest, onWelcomePhaseChange]);

  return (
    <WaitlistLandingLayout fullViewport={!showRest}>
      <section
        className={`ayna-landing-section welcome-gate ${showRest ? 'welcome-gate--with-rest' : 'welcome-gate--immersive'}`}
        style={{ minHeight: showRest ? '90vh' : undefined }}
        aria-label={!showRest ? 'Welcome' : undefined}
        aria-labelledby={showRest ? 'welcome-heading' : undefined}
      >
        <div
          className={[
            'welcome-gate__morph',
            headlineMode === 'docked' ? 'welcome-gate__morph--docked' : 'welcome-gate__morph--hero',
          ].join(' ')}
        >
          <h1
            className="welcome-gate__title-h1"
            id={showRest ? 'welcome-heading' : undefined}
            style={{ margin: 0 }}
          >
            {WELCOME_PREFIX.split('').map((ch, i) => (
              <span
                key={i}
                className="welcome-gate__intro-ch ayna-landing-welcome-lead"
                style={{ opacity: i < reveal ? 1 : 0 }}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
            <span className="ayna-landing-ayna-wordmark" aria-label="Ayna">
              {AYNA_WORD.split('').map((ch, j) => {
                const i = AYNA_START_INDEX + j;
                return (
                  <span
                    key={i}
                    className="welcome-gate__intro-ch"
                    style={{ opacity: i < reveal ? 1 : 0 }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          </h1>
        </div>

        {showRest && (
          <div
            key="welcome-rest"
            className="welcome-gate__rest"
          >
            <ScrollReveal className="stagger-1">
              <span className="ayna-eyebrow" style={{ textAlign: 'center', display: 'block', width: '100%' }}>
                Women&apos;s health, personalized
              </span>
              <RotatingWordHeadline
                as="p"
                style={{
                  marginTop: '0.25rem',
                  marginBottom: 'var(--spacing-lg)',
                }}
              />
            </ScrollReveal>

            <ScrollReveal className="stagger-2">
              <p
                className="ayna-landing__body"
                style={{
                  maxWidth: '640px',
                  margin: '0 auto 2.5rem',
                }}
              >
                Ayna builds your health ecosystem using clinical guidance, community signal, and evidence — so
                you can find products and care that fit you, from big names and small brands alike.
              </p>
            </ScrollReveal>

            <ScrollReveal className="stagger-3">
              <div className="ayna-landing-glass ayna-landing-cta-card" style={{ width: '100%' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    padding: '1rem 1.5rem',
                    lineHeight: 1.35,
                    whiteSpace: 'normal',
                    textAlign: 'center',
                  }}
                  onClick={onPersonalizedPath}
                >
                  Yes, build me my ecosystem!
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    padding: '1rem 1.5rem',
                    lineHeight: 1.35,
                    whiteSpace: 'normal',
                    textAlign: 'center',
                  }}
                  onClick={onBrowsePath}
                >
                  No thanks, I would rather browse myself
                </button>
              </div>
            </ScrollReveal>
          </div>
        )}
      </section>
    </WaitlistLandingLayout>
  );
}
