import React, { useState, useEffect, useLayoutEffect } from 'react';
import ScrollReveal from './ScrollReveal';
import RotatingWordHeadline from './RotatingWordHeadline';
import WaitlistLandingLayout from './WaitlistLandingLayout';

const WELCOME_PREFIX = 'Welcome to ';
const AYNA_WORD = 'AYNA';
const INTRO_TEXT = `${WELCOME_PREFIX}${AYNA_WORD}`;
const AYNA_START_INDEX = WELCOME_PREFIX.length;
const LETTER_MS = 88;
/** After "Welcome to AYNA" + subline are shown, time before the second landing page. */
const PAUSE_BEFORE_SECOND_PAGE_MS = 1200;
/** Let the second screen begin fading in before the app nav mounts (stagger = softer handoff). */
const WELCOME_MAIN_PHASE_DELAY_MS = 420;

/**
 * First page: typewriter + eyebrow; then second page: same headline (static) + the rest, simple fade.
 */
export default function WelcomeGate({ onPersonalizedPath, onBrowsePath, onWelcomePhaseChange }) {
  const [reveal, setReveal] = useState(0);
  const [page, setPage] = useState('first');
  const [reduceMotion, setReduceMotion] = useState(false);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useLayoutEffect(() => {
    if (!reduceMotion) return;
    setReveal(INTRO_TEXT.length);
    setPage('second');
  }, [reduceMotion, INTRO_TEXT.length]);

  useEffect(() => {
    if (reduceMotion) return;
    if (page !== 'first') return;
    if (reveal >= INTRO_TEXT.length) return;
    const t = window.setTimeout(() => setReveal((r) => r + 1), LETTER_MS);
    return () => window.clearTimeout(t);
  }, [reveal, page, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    if (page !== 'first' || reveal < INTRO_TEXT.length) return;
    const t = window.setTimeout(() => setPage('second'), PAUSE_BEFORE_SECOND_PAGE_MS);
    return () => window.clearTimeout(t);
  }, [reveal, page, reduceMotion, INTRO_TEXT.length]);

  useEffect(() => {
    if (page === 'first') {
      onWelcomePhaseChange?.('intro');
      return;
    }
    if (reduceMotion) {
      onWelcomePhaseChange?.('main');
      return;
    }
    const t = window.setTimeout(
      () => onWelcomePhaseChange?.('main'),
      WELCOME_MAIN_PHASE_DELAY_MS
    );
    return () => window.clearTimeout(t);
  }, [page, reduceMotion, onWelcomePhaseChange]);

  return (
    <WaitlistLandingLayout fullViewport>
      <section
        className={`ayna-landing-section welcome-gate ${page === 'first' ? 'welcome-gate--page-first' : 'welcome-gate--page-second'}`}
        style={{ minHeight: page === 'second' ? '90vh' : undefined }}
        aria-label={page === 'first' ? 'Welcome' : undefined}
        aria-labelledby={page === 'second' ? 'welcome-heading' : undefined}
      >
        {page === 'first' && (
          <div className="welcome-gate__page welcome-gate__page--first">
            <div className="welcome-gate__first-stack">
              <h1 className="welcome-gate__typewriter-h1" style={{ margin: 0 }}>
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
              <p
                className={`ayna-eyebrow welcome-gate__first-eyebrow${
                  reveal >= INTRO_TEXT.length ? ' welcome-gate__first-eyebrow--on' : ' welcome-gate__first-eyebrow--off'
                }`}
                aria-hidden={reveal < INTRO_TEXT.length}
              >
                Women&apos;s health, personalized
              </p>
            </div>
          </div>
        )}

        {page === 'second' && (
          <div className="welcome-gate__page welcome-gate__page--second" key="welcome-second">
            <h1
              className="ayna-landing-hero-welcome"
              id="welcome-heading"
              style={{
                maxWidth: '900px',
                margin: '0 auto 0',
                textAlign: 'center',
              }}
            >
              <span className="ayna-landing-welcome-lead">Welcome to </span>
              <span className="ayna-landing-ayna-wordmark" aria-label="Ayna">AYNA</span>
            </h1>
            <ScrollReveal className="stagger-1">
              <span className="ayna-eyebrow" style={{ textAlign: 'center', display: 'block', width: '100%' }}>
                Women&apos;s health, personalized
              </span>
              <RotatingWordHeadline
                layout="stacked"
                as="div"
                style={{
                  marginTop: '0.35rem',
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
