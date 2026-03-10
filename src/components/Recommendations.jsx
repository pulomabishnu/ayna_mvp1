import React, { useMemo } from 'react';
import { getRecommendations, SIMILAR_PROFILES, ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';

export default function Recommendations({ results, onRetake, trackedProducts, toggleTrackProduct, myProducts, toggleMyProduct, omittedProducts, toggleOmitProduct, onOpenProduct }) {
    const recommended = useMemo(() => {
        const base = getRecommendations(results || {});
        return base.filter(p => !omittedProducts[p.id]);
    }, [results, omittedProducts]);

    const physicalProducts = recommended.filter(p => p.type === 'physical');
    const digitalProducts = recommended.filter(p => p.type === 'digital');

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

    const renderProductCard = (product) => {
        const isTracked = !!trackedProducts[product.id];
        const isInEcosystem = !!myProducts[product.id];
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

                <div style={{ height: '160px', width: '100%', overflow: 'hidden', position: 'relative' }}>
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
                </div>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <span style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        {CATEGORY_LABELS[product.category] || product.category}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>{product.name}</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', flexGrow: 1, marginBottom: '1rem', lineHeight: '1.5' }}>{product.summary}</p>

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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
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
                        </div>
                    ))}
                </div>
            )}

            {/* Physical Products */}
            {physicalProducts.length > 0 && (
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Physical Products
                        <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'var(--color-text-muted)' }}>— shipped or in-store</span>
                    </h3>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {physicalProducts.map(renderProductCard)}
                    </div>
                </div>
            )}

            {/* Digital Tools */}
            {digitalProducts.length > 0 && (
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Digital Tools
                        <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'var(--color-text-muted)' }}>— apps & telehealth</span>
                    </h3>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {digitalProducts.map(renderProductCard)}
                    </div>
                </div>
            )}

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

