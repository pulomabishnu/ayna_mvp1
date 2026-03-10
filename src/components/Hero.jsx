import React, { useState, useEffect, useCallback } from 'react';
import { useScrollPosition } from '../hooks/useScrollPosition';
import ScrollReveal from './ScrollReveal';

const MET_SEARCH_URL = 'https://collectionapi.metmuseum.org/public/collection/v1/search';
const MET_OBJECT_URL = 'https://collectionapi.metmuseum.org/public/collection/v1/objects';

function useMetArtwork() {
    const [objectIDs, setObjectIDs] = useState([]);
    const [index, setIndex] = useState(0);
    const [artwork, setArtwork] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchObject = useCallback(async (id) => {
        try {
            const res = await fetch(`${MET_OBJECT_URL}/${id}`);
            const data = await res.json();
            if (data.primaryImage || data.primaryImageSmall) {
                return {
                    imageUrl: data.primaryImage || data.primaryImageSmall,
                    title: data.title || 'Untitled',
                    artist: data.artistDisplayName || 'Unknown',
                    objectURL: data.objectURL || `https://www.metmuseum.org/art/collection/search/${id}`,
                };
            }
        } catch (_) {}
        return null;
    }, []);

    useEffect(() => {
        let cancelled = false;
        async function loadSearch() {
            try {
                const res = await fetch(`${MET_SEARCH_URL}?hasImages=true&q=flower`);
                const data = await res.json();
                if (cancelled || !data.objectIDs || !data.objectIDs.length) {
                    setLoading(false);
                    return;
                }
                const ids = data.objectIDs.slice(0, 40);
                setObjectIDs(ids);
                const first = await fetchObject(ids[0]);
                if (first && !cancelled) setArtwork(first);
            } catch (_) {}
            setLoading(false);
        }
        loadSearch();
        return () => { cancelled = true; };
    }, [fetchObject]);

    const next = useCallback(async () => {
        if (objectIDs.length === 0) return;
        const nextIndex = (index + 1) % objectIDs.length;
        setIndex(nextIndex);
        setLoading(true);
        const nextArt = await fetchObject(objectIDs[nextIndex]);
        if (nextArt) setArtwork(nextArt);
        setLoading(false);
    }, [objectIDs, index, fetchObject]);

    return { artwork, loading, next };
}

export default function Hero({ onStartQuiz, onViewWaitlist, onViewDiscovery }) {
    const scrollY = useScrollPosition();
    const [searchValue, setSearchValue] = useState('');
    const { artwork, loading, next } = useMetArtwork();

    const handleSearch = () => {
        const q = (searchValue || '').trim();
        onViewDiscovery(q);
    };

    const handleSectionClick = (e) => {
        if (e.target.closest('button, input, a')) return;
        next();
    };

    return (
        <section
            onClick={handleSectionClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } }}
            aria-label="Click to change artwork"
            style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '85vh',
            textAlign: 'center',
            padding: 'var(--spacing-xl) var(--spacing-md)',
            position: 'relative',
            cursor: 'default'
        }} className="container">
            {/* Met Museum art panel – click landing page to rotate */}
            {(artwork || loading) && (
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        top: '10%',
                        right: '5%',
                        bottom: '10%',
                        width: '28%',
                        borderRadius: '32px',
                        overflow: 'hidden',
                        boxShadow: '0 32px 60px rgba(140, 72, 108, 0.28)',
                        backgroundColor: 'var(--color-surface-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {loading && !artwork && (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Loading…</span>
                    )}
                    {artwork && (
                        <>
                            <img
                                src={artwork.imageUrl}
                                alt={artwork.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '0.75rem 1rem',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                                color: 'white',
                                fontSize: '0.7rem',
                                lineHeight: 1.3
                            }}>
                                <span style={{ fontWeight: 600 }}>{artwork.title}</span>
                                {artwork.artist && <span> — {artwork.artist}</span>}
                                <br />
                                <a href={artwork.objectURL} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'underline' }}>The Met</a>
                            </div>
                        </>
                    )}
                </div>
            )}
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
