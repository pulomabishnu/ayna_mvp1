import React, { useState, useMemo } from 'react';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { useSpeechToText } from '../hooks/useSpeechToText';
import ScrollReveal from './ScrollReveal';
import SearchMicButton from './SearchMicButton';
import RotatingWordHeadline from './RotatingWordHeadline';
import WaitlistLandingLayout from './WaitlistLandingLayout';
import { CATEGORY_LABELS } from '../data/products';

function displayNameFromUser(user) {
  const meta = user?.user_metadata || {};
  const raw = meta.first_name || meta.firstName || meta.given_name || meta.full_name || meta.name || '';
  return String(raw).trim().split(/\s+/).filter(Boolean)[0] || '';
}

// Returning-user hero: shown instead of the search-first hero once someone has
// an account and at least one product already in their ecosystem.
function WelcomeBackHero({ user, myProducts, ecosystemCount, onStartQuiz, onViewEcosystem, onViewDiscovery }) {
  const name = displayNameFromUser(user) || 'there';
  const areaStatus = useMemo(() => {
    const byCategory = new Map();
    Object.values(myProducts || {}).forEach((p) => {
      const key = p.category || 'other';
      byCategory.set(key, (byCategory.get(key) || 0) + 1);
    });
    return Array.from(byCategory.entries())
      .map(([category, count]) => ({
        category,
        label: CATEGORY_LABELS[category] || (category.charAt(0).toUpperCase() + category.slice(1)),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [myProducts]);

  return (
    <WaitlistLandingLayout>
      <section className="ayna-landing-section" style={{ minHeight: 'min(70vh, 640px)', alignItems: 'stretch' }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'center',
          justifyContent: 'space-between', width: '100%', maxWidth: '1100px', margin: '0 auto', textAlign: 'left',
        }}>
          <div style={{ flex: '1 1 400px' }}>
            <span className="ayna-eyebrow" style={{ display: 'block' }}>Welcome back, {name}</span>
            <h1 className="ayna-rotating-headline" style={{ textAlign: 'left', margin: '0.5rem 0 1rem', maxWidth: '520px' }}>
              Your ecosystem is <span className="ayna-rotating-word" style={{ display: 'inline' }}>{ecosystemCount}</span> product{ecosystemCount === 1 ? '' : 's'} strong.
            </h1>
            <p className="ayna-landing__body" style={{ textAlign: 'left', margin: '0 0 1.75rem', maxWidth: '480px' }}>
              Come back anytime to rebuild it, or keep browsing for what's next.
            </p>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={onStartQuiz}>
                Rebuild my ecosystem
              </button>
              <button
                type="button"
                onClick={() => onViewDiscovery('')}
                style={{
                  padding: '0.875rem 1.75rem', borderRadius: 'var(--radius-pill)', fontWeight: 500,
                  border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.08)', color: '#fff',
                }}
              >
                Browse products
              </button>
            </div>
          </div>

          {areaStatus.length > 0 && (
            <div style={{
              flex: '1 1 320px', maxWidth: '380px', background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)', borderRadius: 'var(--radius-lg)', padding: '1.5rem',
              backdropFilter: 'blur(12px)', cursor: 'pointer',
            }}
            onClick={onViewEcosystem}
            >
              <span style={{
                fontFamily: 'var(--font-label)', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)',
              }}>
                Your ecosystem
              </span>
              <div style={{ marginTop: '0.75rem' }}>
                {areaStatus.map((a, i) => (
                  <div key={a.category} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.6rem 0', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: '0.92rem',
                  }}>
                    <span>{a.label}</span>
                    <span style={{ color: 'var(--color-amber)', fontWeight: 600 }}>{a.count} {a.count === 1 ? 'pick' : 'picks'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </WaitlistLandingLayout>
  );
}

// Landing page: no photo carousel, no rotating images — text, search, and CTA only.
export default function Hero({ onStartQuiz, onViewWaitlist: _onViewWaitlist, onViewDiscovery, user, myProducts, ecosystemCount = 0, onViewEcosystem }) {
  const scrollY = useScrollPosition();
  const [searchValue, setSearchValue] = useState('');
  const speech = useSpeechToText();

  if (user && ecosystemCount > 0) {
    return (
      <WelcomeBackHero
        user={user}
        myProducts={myProducts}
        ecosystemCount={ecosystemCount}
        onStartQuiz={onStartQuiz}
        onViewEcosystem={onViewEcosystem}
        onViewDiscovery={onViewDiscovery}
      />
    );
  }

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
          <div className="welcome-gate__page welcome-gate__page--second">
            <h1
              className="ayna-landing-hero-welcome"
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
              <div className="welcome-gate__second-text-stack">
                <span className="ayna-eyebrow welcome-gate__second-eyebrow">
                  Women&apos;s health, personalized
                </span>
                <RotatingWordHeadline layout="stacked" as="div" />
                <p className="ayna-landing__body welcome-gate__second-lead">
                  Ayna helps you find health products and care that fit you. Backed by real research, doctor input,
                  and other women's experiences. Big brands and small brands, all in one place.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal className="stagger-2">
              <h2
                style={{
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                What are you looking for today?
              </h2>
            </ScrollReveal>
          </div>

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
              background: 'var(--color-surface-soft)',
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
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 500,
                  fontSize: '1.6rem',
                  marginBottom: '0.5rem',
                  color: 'var(--color-surface-contrast)',
                }}
              >
                Tell us about your body once.
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                Six questions, and your shop rebuilds around you.
              </p>
            </div>
            <button
              type="button"
              className="btn-navy"
              style={{ padding: '0.85rem 2rem', fontSize: '1rem', whiteSpace: 'nowrap' }}
              onClick={onStartQuiz}
            >
              Build your ecosystem
            </button>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div
            style={{
              background: 'var(--color-surface-soft)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
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
              Meet Ayna. Health made simple.
            </h3>
            <p
              style={{
                color: 'var(--color-text-muted)',
                lineHeight: '1.85',
                fontSize: '1.05rem',
              }}
            >
              Need a period pad? A doctor for menopause symptoms? A health tracker? We can help. Apps and
              doctor visits are great for one problem at a time. But after that, you're on your own to figure
              out what products to use and where to look. Ayna fills that gap. We don't replace your doctor.
              We make the everyday parts of your health easier.{' '}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div
            style={{
              background: 'var(--color-surface-soft)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
              maxWidth: '700px',
              textAlign: 'center',
              padding: '3rem 2rem',
              margin: '0 auto',
              opacity: Math.min(scrollY / 1000 + 0.5, 1),
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: '1.6rem', marginBottom: '1.5rem' }}>Why We Built Ayna</h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: '2', fontSize: '1.1rem' }}>
              We've felt the same frustrations you have. Hours spent searching online, doctors who don't
              listen, and not knowing if an app is keeping your data safe. Every woman deserves a guide she can
              trust for her health, not another hour scrolling for answers. That's why we built Ayna: to make
              women's health simple, honest, and made just for you.
            </p>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
