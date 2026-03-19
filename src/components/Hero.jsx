import React, { useState } from 'react';
import { useScrollPosition } from '../hooks/useScrollPosition';
import ScrollReveal from './ScrollReveal';
import FindYourPadModal from './FindYourPadModal';

// Landing page: no photo carousel, no rotating images — text, search, and CTA only.
export default function Hero({ onStartQuiz, onViewWaitlist, onViewDiscovery }) {
    const scrollY = useScrollPosition();
    const [searchValue, setSearchValue] = useState('');
    const [showFindPadModal, setShowFindPadModal] = useState(false);

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
        <section style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '85vh',
            textAlign: 'center',
            padding: 'var(--spacing-xl) var(--spacing-md)',
            position: 'relative'
        }} className="container">
            <ScrollReveal className="stagger-1">
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                    maxWidth: '900px',
                    marginBottom: 'var(--spacing-md)',
                    color: 'var(--color-surface-contrast)',
                    lineHeight: '1.1',
                    fontWeight: '800'
                }}>
                    What are you looking for today?
                </h1>
            </ScrollReveal>

            <ScrollReveal className="stagger-2">
                <p style={{
                    fontSize: '1.25rem',
                    color: 'var(--color-text-muted)',
                    maxWidth: '640px',
                    marginBottom: '3rem',
                    lineHeight: '1.6'
                }}>
                    Interrogate our database of 500+ women's health products, apps, and startups.
                </p>
            </ScrollReveal>

            {/* Search Input Centric UI */}
            <ScrollReveal className="stagger-3">
                <div style={{
                    width: '100%',
                    maxWidth: '800px',
                    margin: '0 auto 4rem',
                    position: 'relative'
                }}>
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSearch(e); }}
                        style={{
                            background: 'white',
                            border: '1px solid var(--color-border)',
                            borderRadius: '2rem',
                            padding: '0.75rem 0.75rem 0.75rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            boxShadow: 'var(--shadow-lg)',
                            transition: 'all 0.3s ease',
                        }}
                        className="hero-search-container"
                    >
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Ask Ayna: 'prenatal vitamins', 'postpartum recovery', 'organic pads', 'supplements for cramps'..."
                            style={{
                                flexGrow: 1,
                                border: 'none',
                                outline: 'none',
                                fontSize: '1.1rem',
                                color: 'var(--color-text-main)',
                                background: 'transparent'
                            }}
                            aria-label="Search products and articles"
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                borderRadius: '1.5rem',
                                padding: '0.6rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onClick={(e) => { e.preventDefault(); handleSearch(e); }}
                        >
                            <span>Search</span>
                            <span>→</span>
                        </button>
                    </form>

                    <div style={{
                        marginTop: '1.5rem',
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {['Prenatal vitamins', 'Postpartum recovery', 'Organic pads', 'Breastfeeding essentials', 'Supplements for cramps', 'Pregnancy support'].map(tag => (
                            <button
                                key={tag}
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
                                style={{
                                    background: 'var(--color-surface-soft)',
                                    border: '1px solid var(--color-border)',
                                    padding: '0.4rem 1rem',
                                    borderRadius: 'var(--radius-pill)',
                                    fontSize: '0.85rem',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'var(--color-secondary-fade)'}
                                onMouseLeave={(e) => e.target.style.background = 'var(--color-surface-soft)'}
                            >
                                {tag}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowFindPadModal(true)}
                            style={{
                                background: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                padding: '0.4rem 1rem',
                                borderRadius: 'var(--radius-pill)',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                            }}
                        >
                            Find your pad →
                        </button>
                    </div>
                </div>
            </ScrollReveal>
            {showFindPadModal && (
                <FindYourPadModal
                    onClose={() => setShowFindPadModal(false)}
                    onFind={(opts) => onViewDiscovery(opts)}
                />
            )}
            {/* Premium CTA Block */}
            <ScrollReveal className="stagger-4">
                <div style={{
                    background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 40%, #E0F2FE 100%)',
                    padding: '2.5rem',
                    borderRadius: 'var(--radius-xl)',
                    maxWidth: '800px',
                    width: '100%',
                    marginBottom: 'var(--spacing-xl)',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '2rem',
                    flexWrap: 'wrap',
                    border: '1px solid rgba(255,255,255,0.7)',
                    boxShadow: '0 22px 45px rgba(236, 90, 163, 0.18)'
                }}>
                    <div style={{ flex: '1 1 400px' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--color-surface-contrast)' }}>Want personalized recommendations without the work? ✨</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                            Join Ayna Premium for tailored recommendations, cycle tracking, and safety monitoring specific to your body.
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            className="btn btn-primary"
                            style={{ padding: '0.8rem 2rem', fontSize: '1rem', whiteSpace: 'nowrap' }}
                            onClick={onStartQuiz}
                        >
                            Start Your Health Profile
                        </button>
                        <a
                            href="https://forms.gle/AnaaVhW2vjYr5r5RA"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                fontSize: '0.9rem',
                                color: 'var(--color-primary)',
                                fontWeight: '600',
                                textDecoration: 'underline',
                                textUnderlineOffset: '0.2em'
                            }}
                        >
                            Join Ayna Early Access →
                        </a>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '200px', lineHeight: '1.2' }}>
                            *Premium upgrade required to unlock your personalized recommendation plan
                        </span>
                    </div>
                </div>
            </ScrollReveal>

            {/* The gap we fill */}
            <ScrollReveal>
                <div style={{
                    maxWidth: '720px',
                    textAlign: 'center',
                    padding: '2.5rem 1.5rem 3rem',
                    marginBottom: '0.5rem'
                }}>
                    <h3 style={{
                        fontSize: '1.35rem',
                        marginBottom: '1rem',
                        color: 'var(--color-surface-contrast)',
                        fontWeight: '700'
                    }}>
                        Nobody makes the everyday simple — introducing Ayna.
                    </h3>
                    <p style={{
                        color: 'var(--color-text-muted)',
                        lineHeight: '1.85',
                        fontSize: '1.05rem'
                    }}>
                        Whether you want a new period pad, a clinician for menopause solutions, or a digital health tracker, we're here to help you. Online platforms and in-person doctor's appointments give you specialized care for specific issues — then leave you on your own for the rest of your health as a woman: which products to use, how to decide, where to look. Ayna fills that gap. We’re not replacing your clinician; we’re making the day-to-day management of women’s health actually simple.                     </p>
                </div>
            </ScrollReveal>

            {/* Founder Story */}
            <ScrollReveal>
                <div style={{
                    maxWidth: '700px',
                    textAlign: 'center',
                    padding: '3rem 0',
                    opacity: Math.min(scrollY / 1000 + 0.5, 1)
                }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Why We Built Ayna</h3>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: '2', fontSize: '1.1rem' }}>
                        We experienced the same frustrations you have — hours Googling products, being dismissed by doctors, cultural taboos, and not knowing which apps are safe with our data. We built Ayna because <strong>every woman deserves a trusted guide</strong> for her health ecosystem, not another hour on Reddit. We're passionate about making women's health accessible, transparent, and personalized — without the noise.
                    </p>
                </div>
            </ScrollReveal>
        </section >
    );
}
