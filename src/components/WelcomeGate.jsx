import React from 'react';
import ScrollReveal from './ScrollReveal';
import RotatingWordHeadline from './RotatingWordHeadline';
import WaitlistLandingLayout from './WaitlistLandingLayout';

/**
 * First screen on load: choose personalized recommendations (quiz / health profile)
 * or open discovery search.
 */
export default function WelcomeGate({ onPersonalizedPath, onBrowsePath }) {
  return (
    <WaitlistLandingLayout>
      <section
        className="ayna-landing-section"
        style={{
          minHeight: '90vh',
        }}
        aria-labelledby="welcome-heading"
      >
        <ScrollReveal className="stagger-1">
          <span className="ayna-eyebrow" style={{ textAlign: 'center', display: 'block', width: '100%' }}>
            Women&apos;s health, personalized
          </span>
          <h1
            id="welcome-heading"
            style={{
              maxWidth: '720px',
              margin: '0 auto 0.75rem',
            }}
          >
            Welcome to Ayna
          </h1>
          <RotatingWordHeadline
            as="p"
            style={{
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
      </section>
    </WaitlistLandingLayout>
  );
}
