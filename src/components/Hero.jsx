import React, { useState } from 'react';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { useSpeechToText } from '../hooks/useSpeechToText';
import ScrollReveal from './ScrollReveal';
import SearchMicButton from './SearchMicButton';
import RotatingWordHeadline from './RotatingWordHeadline';
import WaitlistLandingLayout from './WaitlistLandingLayout';

// Landing page: no photo carousel, no rotating images — text, search, and CTA only.
export default function Hero({ onStartQuiz, onViewWaitlist: _onViewWaitlist, onViewDiscovery }) {
  const scrollY = useScrollPosition();
  const [searchValue, setSearchValue] = useState('');
  const speech = useSpeechToText();

  const toggleVoiceSearch = () => {
    if (speech.isRecording) {
      const t = speech.stop();
      if (t) setSearchValue((prev) => (prev.trim() ? `${prev.trim()} ${t}` : t));
    } else {
      speech.start();
    }
  };

  const handleSearch = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const q = (searchValue || '').trim();
    if (typeof onViewDiscovery === 'function') {
      const lower = q.toLowerCase();
      if (lower.includes('pad') || lower.includes('pads')) {
        const opts = { query: q, initialCategory: 'pad' };
        if (lower.includes('organic')) opts.initialPadPreference = 'organic';
        else if (lower.includes('overnight')) opts.initialPadUseCase = 'overnight';
        else if (lower.includes('heavy')) opts.initialPadFlow = 'heavy';
        onViewDiscovery(opts);
      } else if (lower.includes('postpartum') || lower.includes('breastfeeding') || lower.includes('nursing')) {
        onViewDiscovery({ query: q, initialCategory: 'postpartum' });
      } else if (lower.includes('prenatal') || (lower.includes('pregnancy') && !lower.includes('postpartum'))) {
        const opts = { query: q, initialCategory: (lower.includes('prenatal') || lower.includes('vitamin')) ? 'supplement' : 'pregnancy' };
        onViewDiscovery(opts);
      } else if (lower.includes('supplement')) {
        const opts = { query: q, initialCategory: 'supplement' };
        if (lower.includes('cramps')) opts.initialSymptom = 'cramps';
        else if (lower.includes('pcos')) opts.initialSymptom = 'pcos';
        onViewDiscovery(opts);
      } else {
        onViewDiscovery(q);
      }
    }
  };

  return (
    <>
      <WaitlistLandingLayout>
        <section
          className="ayna-landing-section"
          style={{
            minHeight: 'min(100vh, 1200px)',
          }}
        >
          <ScrollReveal className="stagger-1">
            <a
              href="https://forms.gle/AnaaVhW2vjYr5r5RA"
              target="_blank"
              rel="noopener noreferrer"
              className="ayna-landing-waitlist"
            >
              Join the waitlist
            </a>
          </ScrollReveal>
          <ScrollReveal className="stagger-1">
            <span className="ayna-eyebrow">Women&apos;s health, personalized</span>
            <RotatingWordHeadline
              style={{
                maxWidth: '900px',
                marginBottom: '0.75rem',
              }}
            />
            <h2
              style={{
                marginBottom: 'var(--spacing-md)',
              }}
            >
              What are you looking for today?
            </h2>
          </ScrollReveal>

          <ScrollReveal className="stagger-2">
            <p
              className="ayna-landing__body"
              style={{
                maxWidth: '680px',
                margin: '0 auto 3rem',
              }}
            >
              Build a personalized ecosystem of women’s health products, talk or type your needs, import
              records and wearable summaries, and find telehealth and nearby care matched to your symptoms —
              all in one place.
            </p>
          </ScrollReveal>

          <ScrollReveal className="stagger-3">
            <div
              style={{
                width: '100%',
                maxWidth: '800px',
                margin: '0 auto 4rem',
                position: 'relative',
              }}
            >
              <form
                onSubmit={(e) => { e.preventDefault(); handleSearch(e); }}
                className="ayna-landing-glass ayna-landing-search"
              >
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Ask Ayna: 'prenatal vitamins', 'postpartum recovery', 'organic pads', 'supplements for cramps'..."
                  aria-label="Search products and articles"
                />
                {speech.supported && (
                  <SearchMicButton
                    className="ayna-landing-mic"
                    isRecording={speech.isRecording}
                    onClick={toggleVoiceSearch}
                  />
                )}
                <button
                  type="submit"
                  className="btn btn-primary ayna-landing-search-submit"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flex: '0 0 auto',
                    padding: '0.7rem 1.25rem',
                    fontSize: '0.72rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                  onClick={(e) => { e.preventDefault(); handleSearch(e); }}
                >
                  <span>Search</span>
                  <span>→</span>
                </button>
              </form>
              {speech.isRecording && (
                <p
                  className="ayna-landing-voice"
                  style={{
                    marginTop: '0.65rem',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    paddingLeft: '0.25rem',
                    lineHeight: 1.45,
                  }}
                  aria-live="polite"
                >
                  {speech.liveText ? (
                    <>
                      <strong>Listening:</strong> {speech.liveText}
                    </>
                  ) : (
                    'Listening… describe what you need or ask for product ideas.'
                  )}
                </p>
              )}

              <div
                style={{
                  marginTop: '1.5rem',
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {['Prenatal vitamins', 'Postpartum recovery', 'Organic pads', 'Breastfeeding essentials', 'Supplements for cramps', 'Pregnancy support'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="ayna-landing-tag"
                    onClick={() => {
                      const lower = tag.toLowerCase();
                      if (lower.includes('pad')) {
                        const opts = { query: tag, initialCategory: 'pad' };
                        if (lower.includes('organic')) opts.initialPadPreference = 'organic';
                        else if (lower.includes('overnight')) opts.initialPadUseCase = 'overnight';
                        else if (lower.includes('heavy')) opts.initialPadFlow = 'heavy';
                        onViewDiscovery(opts);
                      } else if (lower.includes('prenatal') || lower.includes('pregnancy support')) {
                        const opts = { query: tag, initialCategory: lower.includes('prenatal') ? 'supplement' : 'pregnancy' };
                        onViewDiscovery(opts);
                      } else if (lower.includes('postpartum') || lower.includes('breastfeeding')) {
                        onViewDiscovery({ query: tag, initialCategory: 'postpartum' });
                      } else if (lower.includes('supplement')) {
                        const opts = { query: tag, initialCategory: 'supplement' };
                        if (lower.includes('cramps')) opts.initialSymptom = 'cramps';
                        else if (lower.includes('pcos')) opts.initialSymptom = 'pcos';
                        onViewDiscovery(opts);
                      } else {
                        onViewDiscovery(tag);
                      }
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>
      </WaitlistLandingLayout>

      <section
        className="hero-continuation"
        style={{
          textAlign: 'center',
        }}
      >
        <ScrollReveal className="stagger-4">
          <div
            style={{
              background: 'linear-gradient(145deg, #FAF5F0 0%, #F0E8E1 100%)',
              padding: '2.5rem',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '800px',
              width: '100%',
              margin: '0 auto var(--spacing-xl)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '2rem',
              flexWrap: 'wrap',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ flex: '1 1 400px' }}>
              <h3
                style={{
                  fontSize: '1.4rem',
                  marginBottom: '0.5rem',
                  color: 'var(--color-surface-contrast)',
                }}
              >
                Want personalized recommendations without the work? ✨
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                Join Ayna Premium for tailored recommendations, your product ecosystem, and safety-aware
                discovery.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.8rem 2rem', fontSize: '1rem', whiteSpace: 'nowrap' }}
                onClick={onStartQuiz}
              >
                Start Your Health Profile
              </button>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  maxWidth: '200px',
                  lineHeight: '1.2',
                }}
              >
                *Premium upgrade required to unlock your personalized recommendation plan
              </span>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div
            style={{
              maxWidth: '720px',
              textAlign: 'center',
              padding: '2.5rem 1.5rem 3rem',
              margin: '0 auto 0.5rem',
            }}
          >
            <h3
              style={{
                fontSize: '1.35rem',
                marginBottom: '1rem',
                color: 'var(--color-surface-contrast)',
                fontWeight: '700',
              }}
            >
              Nobody makes the everyday simple — introducing Ayna.
            </h3>
            <p
              style={{
                color: 'var(--color-text-muted)',
                lineHeight: '1.85',
                fontSize: '1.05rem',
              }}
            >
              Whether you want a new period pad, a clinician for menopause solutions, or a digital health
              tracker, we&apos;re here to help you. Online platforms and in-person doctor&apos;s appointments
              give you specialized care for specific issues — then leave you on your own for the rest of your
              health as a woman: which products to use, how to decide, where to look. Ayna fills that gap.
              We’re not replacing your clinician; we’re making the day-to-day management of women’s health
              actually simple.{' '}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div
            style={{
              maxWidth: '700px',
              textAlign: 'center',
              padding: '3rem 0',
              margin: '0 auto',
              opacity: Math.min(scrollY / 1000 + 0.5, 1),
            }}
          >
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Why We Built Ayna</h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: '2', fontSize: '1.1rem' }}>
              We experienced the same frustrations you have — hours Googling products, being dismissed by
              doctors, cultural taboos, and not knowing which apps are safe with our data. We built Ayna
              because <strong>every woman deserves a trusted guide</strong> for her health ecosystem, not
              another hour on Reddit. We&apos;re passionate about making women&apos;s health accessible,
              transparent, and personalized — without the noise.
            </p>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
