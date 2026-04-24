import React, { useState, useEffect, useLayoutEffect } from 'react';
import ScrollReveal from './ScrollReveal';
import RotatingWordHeadline from './RotatingWordHeadline';
import WaitlistLandingLayout from './WaitlistLandingLayout';

const INTRO_TEXT = 'Welcome to AYNA';
/** First "A" of AYNA — index 11 for "Welcome to AYNA" (15 chars) */
const GOLD_LETTER_START = 11;
const LETTER_MS = 88;
const INTRO_TO_MAIN_MS = 3000;
const REDUCED_MOTION_INTRO_TO_MAIN_MS = 1500;

/**
 * First screen: letter-by-letter "Welcome to AYNA", then after 3s a soft crossfade
 * to the full welcome (eyebrow, rotating line, copy, CTA buttons).
 */
export default function WelcomeGate({ onPersonalizedPath, onBrowsePath }) {
  const [phase, setPhase] = useState('intro');
  const [reveal, setReveal] = useState(0);
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
    if (reduceMotion) setReveal(INTRO_TEXT.length);
  }, [reduceMotion]);

  useEffect(() => {
    if (phase !== 'intro' || reduceMotion) return;
    if (reveal >= INTRO_TEXT.length) return;
    const t = window.setTimeout(() => setReveal((r) => r + 1), LETTER_MS);
    return () => window.clearTimeout(t);
  }, [phase, reveal, reduceMotion]);

  useEffect(() => {
    const delay = reduceMotion ? REDUCED_MOTION_INTRO_TO_MAIN_MS : INTRO_TO_MAIN_MS;
    const t = window.setTimeout(() => setPhase('main'), delay);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  return (
    <WaitlistLandingLayout>
      <section
        className={`ayna-landing-section welcome-gate ${phase === 'main' ? 'welcome-gate--main' : 'welcome-gate--intro'}`}
        style={{ minHeight: '90vh' }}
        aria-label={phase === 'intro' ? 'Welcome' : undefined}
        aria-labelledby={phase === 'main' ? 'welcome-heading' : undefined}
      >
        <div
          className="welcome-gate__layer welcome-gate__layer--intro"
          aria-hidden={phase === 'main'}
        >
          <h1 className="welcome-gate__intro-h1" style={{ margin: 0 }}>
            {INTRO_TEXT.split('').map((ch, i) => (
              <span
                key={i}
                className={[
                  'welcome-gate__intro-ch',
                  i >= GOLD_LETTER_START ? 'ayna-landing-brand-caps' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  opacity: i < reveal ? 1 : 0,
                }}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </h1>
        </div>

        <div
          className="welcome-gate__layer welcome-gate__layer--main"
          aria-hidden={phase === 'intro'}
        >
          <div
            key={phase}
            className="welcome-gate__main-inner"
          >
            <ScrollReveal className="stagger-1">
              <h1
                id="welcome-heading"
                style={{
                  maxWidth: '720px',
                  margin: '0 auto 0.75rem',
                }}
              >
                Welcome to <span className="ayna-landing-brand-caps" aria-label="Ayna">AYNA</span>
              </h1>
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
        </div>
      </section>
    </WaitlistLandingLayout>
  );
}
