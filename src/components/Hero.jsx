import React, { useState } from 'react';
import { useScrollPosition } from '../hooks/useScrollPosition';
import ScrollReveal from './ScrollReveal';

// Landing page: no photo carousel, no rotating images — text, search, and CTA only.
export default function Hero({ onStartQuiz, onViewWaitlist, onViewDiscovery }) {
    const scrollY = useScrollPosition();
    const [searchValue, setSearchValue] = useState('');

    const handleSearch = () => {
        const q = (searchValue || '').trim();
        onViewDiscovery(q);
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
                    <div style={{
                        background: 'white',
                        border: '1px solid var(--color-border)',
                        borderRadius: '2rem',
                        padding: '0.75rem 0.75rem 0.75rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: 'var(--shadow-lg)',
                        transition: 'all 0.3s ease',
                    }}
                        className="hero-search-container">
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Ask Ayna: 'best organic tampons', 'PCOS supplements', 'privacy-first trackers'..."
                            style={{
                                flexGrow: 1,
                                border: 'none',
                                outline: 'none',
                                fontSize: '1.1rem',
                                color: 'var(--color-text-main)',
                                background: 'transparent'
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSearch();
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{
                                borderRadius: '1.5rem',
                                padding: '0.6rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onClick={handleSearch}
                        >
                            <span>Search</span>
                            <span>→</span>
                        </button>
                    </div>

                    <div style={{
                        marginTop: '1.5rem',
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {['PCOS', 'Endometriosis', 'Heavy Flow', 'Privacy', 'Fertility'].map(tag => (
                            <button
                                key={tag}
                                onClick={() => onViewDiscovery(tag)}
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
                    </div>
                </div>
            </ScrollReveal>
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
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--color-surface-contrast)' }}>Want a Personalized Health Plan? ✨</h3>
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
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '200px', lineHeight: '1.2' }}>
                            *Premium upgrade required to unlock your personalized recommendation plan
                        </span>
                    </div>
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
