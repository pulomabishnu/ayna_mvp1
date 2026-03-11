import React, { useState, useMemo } from 'react';
import { getRecommendations, getRecommendationExplanation, SIMILAR_PROFILES, ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';
import { getRecommendedArticles } from './Articles';

const TYPE_FILTERS = ['all', 'physical', 'digital'];

export default function Recommendations({ results, onRetake, trackedProducts, toggleTrackProduct, myProducts, toggleMyProduct, omittedProducts, toggleOmitProduct, onOpenProduct, onViewArticle }) {
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const recommended = useMemo(() => {
        const base = getRecommendations(results || {});
        return base.filter(p => !omittedProducts[p.id]);
    }, [results, omittedProducts]);

    // Apply type filter, then group by category
    const filteredRecommended = useMemo(() => {
        if (typeFilter === 'all') return recommended;
        return recommended.filter(p => (p.type || 'physical') === typeFilter);
    }, [recommended, typeFilter]);

    // Group by category so products are linked by category (pad, tampon, supplement, tracker, etc.)
    const byCategory = useMemo(() => {
        const map = {};
        filteredRecommended.forEach(p => {
            const cat = p.category || 'other';
            if (!map[cat]) map[cat] = [];
            map[cat].push(p);
        });
        const order = ['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'supplement', 'tracker', 'telehealth', 'mental-health', 'menopause', 'intimate-care', 'sex-tech', 'postpartum', 'pregnancy', 'fitness-cycle', 'pelvic-floor', 'cramp-relief', 'other'];
        const ordered = order.filter(c => map[c]).map(c => ({ category: c, label: CATEGORY_LABELS[c] || c, products: map[c] }));
        const rest = Object.keys(map).filter(c => !order.includes(c));
        return [...ordered, ...rest.map(c => ({ category: c, label: CATEGORY_LABELS[c] || c, products: map[c] }))];
    }, [filteredRecommended]);

    // When a category is selected, show only that section
    const displayedSections = useMemo(() => {
        if (categoryFilter === 'all') return byCategory;
        const section = byCategory.find(s => s.category === categoryFilter);
        return section ? [section] : [];
    }, [byCategory, categoryFilter]);

    // Find matching similar profiles
    const matchedProfiles = useMemo(() => {
        if (!results?.frustrations) return [];
        const tags = results.frustrations.map(f => {
            const map = { 'Heavy flow': 'heavy-flow', 'Painful cramps': 'cramps', 'Recurrent UTIs': 'uti', 'Irregular cycles': 'irregular' };
            return map[f];
        }).filter(Boolean);

        if (results?.preference === 'Privacy & data security') tags.push('privacy');

        return tags
            .filter(t => SIMILAR_PROFILES[t])
            .map(t => ({ tag: t, ...SIMILAR_PROFILES[t] }))
            .slice(0, 2);
    }, [results]);

    const recommendedArticles = useMemo(() => getRecommendedArticles(results || {}), [results]);

    const renderProductCard = (product) => {
        const isTracked = !!trackedProducts[product.id];
        const isInEcosystem = !!myProducts[product.id];
        const { whyItWorks, considerations } = getRecommendationExplanation(product, results);
        return (
            <div key={product.id} className="card hover-lift" style={{
                padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                minWidth: '280px', maxWidth: '360px', flex: '1 1 300px', position: 'relative'
            }}>
                <button
                    onClick={() => toggleOmitProduct(product)}
                    style={{
                        position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 5,
                        background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%',
                        width: '24px', height: '24px', cursor: 'pointer', fontSize: '0.8rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)'
                    }}
                    title="Don't recommend this again"
                >✕</button>

                <div style={{ height: '140px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                    <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{
                        position: 'absolute', top: '0.75rem', left: '0.75rem',
                        background: product.type === 'physical' ? 'var(--color-surface-contrast)' : 'var(--color-primary)',
                        color: 'white', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)',
                        fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase'
                    }}>
                        {product.type === 'physical' ? 'Physical' : 'Digital'}
                    </span>
                    {isTracked && (
                        <span style={{
                            position: 'absolute', top: '0.75rem', right: '2.5rem',
                            background: 'var(--color-primary)', color: 'white', padding: '0.25rem 0.6rem',
                            borderRadius: 'var(--radius-pill)', fontSize: '0.7rem', fontWeight: '600'
                        }}>
                            ✓ Tracked
                        </span>
                    )}
                    {product.outOfBusiness && (
                        <span style={{
                            position: 'absolute', bottom: '0.75rem', left: '0.75rem',
                            background: 'var(--color-text-muted)', color: 'white', padding: '0.25rem 0.6rem',
                            borderRadius: 'var(--radius-pill)', fontSize: '0.7rem', fontWeight: '600'
                        }}>
                            No longer sold
                        </span>
                    )}
                </div>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>{product.name}</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: '1.45' }}>{product.summary}</p>

                    {whyItWorks && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-primary-hover)', fontWeight: '500', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                            {whyItWorks}
                        </p>
                    )}
                    {considerations && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', lineHeight: 1.4, fontStyle: 'italic' }}>
                            {considerations}
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {product.safety?.recalls && !product.safety.recalls.includes('⚠️') && (
                            <span style={{ fontSize: '0.75rem', background: 'var(--color-secondary-fade)', color: 'var(--color-text-main)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>✓ No recalls</span>
                        )}
                        {product.safety?.recalls && product.safety.recalls.includes('⚠️') && (
                            <span style={{ fontSize: '0.75rem', background: '#F8F9FA', color: 'var(--color-text-main)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>⚠️ Safety note</span>
                        )}
                        {product.privacy?.sellsData?.includes('❌') && (
                            <span style={{ fontSize: '0.75rem', background: 'var(--color-secondary-fade)', color: 'var(--color-text-main)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>🔒 No data selling</span>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: 'auto' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text-main)' }}>{product.price}</span>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => toggleMyProduct(product)}>
                                {isInEcosystem ? '✓ Added' : '+ Add'}
                            </button>
                            <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => onOpenProduct(product)}>
                                Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', maxWidth: '700px', margin: '0 auto var(--spacing-xl)' }}>
                <div style={{
                    background: 'var(--color-secondary-fade)', color: 'var(--color-primary-hover)',
                    padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', fontSize: '0.875rem',
                    fontWeight: '600', marginBottom: '1rem', display: 'inline-block'
                }}>
                    Your Personalized Results
                </div>
                <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>Products curated for you</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                    {results?.frustrations?.length > 0
                        ? <>Based on your focus areas: <strong>{results.frustrations.join(', ')}</strong></>
                        : 'Here are our top recommendations for you.'
                    }
                </p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    🔒 We never sell your data. Every product below is reviewed by OB-GYNs and real women.
                </p>
                <p style={{ color: 'var(--color-primary)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: '500' }}>
                    Forgot something? Use the 💬 chat button to add more to your profile — we'll refresh your recommendations.
                </p>
            </div>

            {/* Filters: Type + Category (like Discovery) */}
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
                <button onClick={() => setCategoryFilter('all')} style={{
                    padding: '0.4rem 1rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem',
                    fontWeight: '500', border: '1px solid var(--color-border)',
                    background: categoryFilter === 'all' ? 'var(--color-surface-contrast)' : 'transparent',
                    color: categoryFilter === 'all' ? 'white' : 'var(--color-text-muted)',
                    cursor: 'pointer', transition: 'all 0.2s'
                }}>
                    All
                </button>
                {byCategory.map(({ category, label }) => (
                    <button key={category} onClick={() => setCategoryFilter(category)} style={{
                        padding: '0.4rem 1rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem',
                        fontWeight: '500', border: '1px solid var(--color-border)',
                        background: categoryFilter === category ? 'var(--color-surface-contrast)' : 'transparent',
                        color: categoryFilter === category ? 'white' : 'var(--color-text-muted)',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                        {label}
                    </button>
                ))}
            </div>
            {(categoryFilter !== 'all' || typeFilter !== 'all') && (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Showing {displayedSections.reduce((n, s) => n + s.products.length, 0)} product{displayedSections.reduce((n, s) => n + s.products.length, 0) !== 1 ? 's' : ''}
                </p>
            )}

            {/* "Women Like You" Section */}
            {matchedProfiles.length > 0 && (
                <div style={{ maxWidth: '800px', margin: '0 auto var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        👥 Women with similar profiles also use
                    </h3>
                    {matchedProfiles.map(profile => (
                        <div key={profile.tag} style={{
                            background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)', padding: '1.25rem'
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{profile.label}</div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                {profile.topProducts.map(pid => {
                                    const product = ALL_PRODUCTS.find(p => p.id === pid);
                                    if (!product || omittedProducts[pid]) return null;
                                    return (
                                        <span key={pid} style={{
                                            background: 'white', border: '1px solid var(--color-border)',
                                            padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-pill)',
                                            fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer'
                                        }} onClick={() => onOpenProduct(product)}>
                                            {product.name}
                                        </span>
                                    );
                                })}
                            </div>
                            <p style={{ fontStyle: 'italic', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                {profile.quote}
                            </p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', fontWeight: '600' }}>
                                — Community experience; not brand-affiliated
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Recommended articles */}
            {onViewArticle && recommendedArticles.length > 0 && (
              <div style={{ maxWidth: '800px', margin: '0 auto var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📖 Recommended articles
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  Health reads that match your focus areas.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recommendedArticles.map((art) => (
                    <div
                      key={art.id}
                      style={{
                        background: 'var(--color-surface-soft)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--color-text-main)' }}>{art.title}</div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>{art.teaser}</p>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ alignSelf: 'flex-start', padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                        onClick={() => onViewArticle(art.id)}
                      >
                        Read article
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations by category — products linked by category with why it could work / considerations */}
            {displayedSections.map(({ category, label, products }) => (
                <div key={category} style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {label}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                        {products.length === 1 ? '1 product' : `${products.length} products`} in this category that match your profile.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {products.map(renderProductCard)}
                    </div>
                </div>
            ))}

            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
                <button className="btn btn-outline" onClick={onRetake}>Retake Assessment</button>
                {Object.keys(omittedProducts).length > 0 && (
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Note: {Object.keys(omittedProducts).length} products are hidden based on your preference.
                    </p>
                )}
            </div>
        </section>
    );
}

