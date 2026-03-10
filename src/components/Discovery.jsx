import React, { useState, useMemo } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';
import { STARTUPS } from '../data/startups';
import ProductModal from './ProductModal';

const ALL_CATEGORIES = ['all', 'pad', 'tampon', 'cup', 'disc', 'period-underwear', 'supplement', 'tracker', 'telehealth', 'mental-health', 'fitness', 'diagnostics', 'hormone-monitoring', 'menopause', 'fertility', 'pelvic-health', 'postpartum', 'pregnancy', 'sex-tech', 'intimate-care', 'contraception'];
const TYPE_FILTERS = ['all', 'physical', 'digital', 'startup'];

export default function Discovery({ trackedProducts, toggleTrackProduct, myProducts, onToggleProduct, joinedWaitlists, toggleJoinWaitlist, omittedProducts, toggleOmitProduct, setCurrentView, onOpenProduct, isPremium, onUpgrade, initialSearch }) {
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState(initialSearch || '');

    React.useEffect(() => {
        if (initialSearch !== undefined) {
            setSearchQuery(initialSearch);
        }
    }, [initialSearch]);

    const combined = useMemo(() => {
        const products = ALL_PRODUCTS.map(p => ({ ...p, isStartup: false }));
        const startups = STARTUPS.map(s => ({ ...s, isStartup: true, type: 'startup' }));
        return [...products, ...startups];
    }, []);

    const filtered = useMemo(() => {
        return combined.filter(item => {
            if (omittedProducts[item.id]) return false;
            if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
            if (typeFilter !== 'all' && item.type !== typeFilter) return false;

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const nameMatch = item.name?.toLowerCase().includes(query);
                const summaryMatch = item.summary?.toLowerCase().includes(query);
                const taglineMatch = item.tagline?.toLowerCase().includes(query);
                const tagsMatch = item.tags?.some(t => t.toLowerCase().includes(query));

                if (!nameMatch && !summaryMatch && !taglineMatch && !tagsMatch) {
                    return false;
                }
            }

            return true;
        });
    }, [combined, categoryFilter, typeFilter, omittedProducts, searchQuery]);

    const handleSmartSearch = (e) => {
        e.preventDefault();
        const q = searchQuery.toLowerCase();

        if (q.includes('track') || q.includes('cycle') || q.includes('period') || q.includes('log')) {
            if (setCurrentView) setCurrentView('cycle-tracker');
        } else if (q.includes('waitlist') || q.includes('startup') || q.includes('new')) {
            if (setCurrentView) setCurrentView('waitlist');
        } else if (q.includes('ecosystem') || q.includes('routine')) {
            if (setCurrentView) setCurrentView('ecosystem');
        } else if (q.includes('quiz') || q.includes('assess')) {
            if (setCurrentView) setCurrentView('quiz');
        }
        // If it doesn't match these keywords, the filtered useMemo will naturally fuzzy-filter the Discovery page products below.
    };

    return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', maxWidth: '700px', margin: '0 auto var(--spacing-lg)' }}>
                <div style={{
                    background: 'var(--color-secondary-fade)', color: 'var(--color-primary-hover)',
                    padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', fontSize: '0.875rem',
                    fontWeight: '600', marginBottom: '1rem', display: 'inline-block'
                }}>
                    Discovery
                </div>
                <h2 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Browse All Products</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                    Explore our curated database of women's health products and digital tools — each reviewed by doctors and real women.
                </p>
            </div>

            {/* Smart Search */}
            <form onSubmit={handleSmartSearch} style={{ maxWidth: '600px', margin: '0 auto 2rem', position: 'relative' }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask a question, search for a product, or type a health symptom..."
                    style={{
                        width: '100%',
                        padding: '1rem 1.5rem',
                        fontSize: '1rem',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)',
                        outline: 'none'
                    }}
                />
                <button type="submit" style={{
                    position: 'absolute',
                    right: '0.4rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.7rem 1.4rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                }}>
                    Search
                </button>
            </form>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {TYPE_FILTERS.map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)} style={{
                        padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem',
                        fontWeight: '500', border: '1px solid var(--color-border)',
                        background: typeFilter === t ? 'var(--color-primary)' : 'transparent',
                        color: typeFilter === t ? 'white' : 'var(--color-text-main)',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                        {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'var(--spacing-lg)' }}>
                {ALL_CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategoryFilter(c)} style={{
                        padding: '0.4rem 1rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem',
                        fontWeight: '500', border: '1px solid var(--color-border)',
                        background: categoryFilter === c ? 'var(--color-surface-contrast)' : 'transparent',
                        color: categoryFilter === c ? 'white' : 'var(--color-text-muted)',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                        {c === 'all' ? 'All' : (CATEGORY_LABELS[c] || c)}
                    </button>
                ))}
            </div>

            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </p>

            {/* Product Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
                {filtered.map((item, idx) => {
                    const isInEcosystem = !item.isStartup && !!myProducts[item.id];
                    const isJoined = item.isStartup && !!joinedWaitlists[item.id];

                    return (
                        <div key={item.id} className="card hover-lift" style={{
                            padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                            width: '280px', animation: `fadeInUp 0.4s ${Math.min(idx * 0.05, 0.3)}s backwards`,
                            border: isJoined ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'
                        }}>
                            <div style={{ height: '140px', width: '100%', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                                {item.image && item.image !== '/ayna_placeholder.png' ? (
                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>
                                        <img src={`https://logo.clearbit.com/${item.url ? item.url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0] : (item.whereToBuy?.[0] ? item.whereToBuy[0].toLowerCase().replace(/\s+/g, '') + '.com' : 'ayna.com')}`}
                                            alt={`${item.name} Logo`}
                                            style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain' }}
                                            onError={(e) => {
                                                e.target.onerror = null; // prevents looping
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                        <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-primary)' }}>AYNA</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Your women's health assistant</span>
                                        </div>
                                    </>
                                )}
                                <span style={{
                                    position: 'absolute', top: '0.5rem', left: '0.5rem',
                                    background: item.type === 'physical' ? 'var(--color-surface-contrast)' : 'var(--color-primary)',
                                    color: 'white', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)',
                                    fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase'
                                }}>
                                    {item.type}
                                </span>
                                {isInEcosystem && (
                                    <span style={{
                                        position: 'absolute', top: '0.5rem', right: '0.5rem',
                                        background: '#10B981', color: 'white', padding: '0.2rem 0.5rem',
                                        borderRadius: 'var(--radius-pill)', fontSize: '0.65rem', fontWeight: '600'
                                    }}>
                                        Added to Ecosystem
                                    </span>
                                )}
                                {isJoined && (
                                    <span style={{
                                        position: 'absolute', top: '0.5rem', right: '0.5rem',
                                        background: 'var(--color-primary)', color: 'white', padding: '0.2rem 0.5rem',
                                        borderRadius: 'var(--radius-pill)', fontSize: '0.65rem', fontWeight: '600'
                                    }}>
                                        On Waitlist
                                    </span>
                                )}
                            </div>
                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                <span style={{ color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                    {CATEGORY_LABELS[item.category] || item.category.charAt(0) + item.category.slice(1)}
                                </span>
                                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>{item.name}</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', flexGrow: 1, marginBottom: '0.75rem', lineHeight: '1.4' }}>
                                    {item.isStartup ? item.tagline : item.summary}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{item.isStartup ? item.stage : item.price}</span>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        {item.isStartup ? (
                                            <button
                                                className={`btn ${isJoined ? 'btn-outline' : 'btn-primary'}`}
                                                style={{
                                                    padding: '0.35rem 0.7rem',
                                                    fontSize: '0.75rem',
                                                    opacity: (!isPremium && !isJoined) ? 0.8 : 1
                                                }}
                                                onClick={() => {
                                                    if (isPremium || isJoined) {
                                                        toggleJoinWaitlist(item);
                                                    } else {
                                                        onUpgrade();
                                                    }
                                                }}
                                            >
                                                {isJoined ? 'Leave' : (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        {!isPremium && <span>🔒</span>}
                                                        {isPremium ? 'Join' : 'Upgrade'}
                                                    </span>
                                                )}
                                            </button>
                                        ) : (
                                            <>
                                                <button className="btn btn-outline" style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }} onClick={() => onToggleProduct(item)}>
                                                    {isInEcosystem ? '✓' : '+'}
                                                </button>
                                                <button className="btn btn-primary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }} onClick={() => onOpenProduct(item)}>
                                                    Details
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}


