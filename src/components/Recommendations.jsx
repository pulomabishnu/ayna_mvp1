import React, { useState, useMemo } from 'react';
import { getRecommendationExplanation, SIMILAR_PROFILES, ALL_PRODUCTS, CATEGORY_LABELS, getRecommendationsGroupedByWorkflow } from '../data/products';
import { getRecommendedArticles } from './Articles';
import { inferTagsFromHealthProfile } from '../utils/healthDataProfile';
import CareNearYouPanel from './CareNearYouPanel';
import { generateTieredRecommendations } from '../utils/recommendationEngine';

const TYPE_OPTIONS = [
    { value: 'all', label: 'All types' },
    { value: 'physical', label: 'Physical' },
    { value: 'digital', label: 'Digital' },
];

export default function Recommendations({
    results,
    onRetake,
    trackedProducts,
    toggleTrackProduct,
    myProducts,
    toggleMyProduct,
    omittedProducts,
    toggleOmitProduct,
    onOpenProduct,
    onViewArticle,
    healthProfile = null,
    userZipCode = '',
    onZipCodeChange,
}) {
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [expandedSections, setExpandedSections] = useState({});

    const { byWorkflow, byCategory: byCategoryRaw } = useMemo(
        () => getRecommendationsGroupedByWorkflow(results || {}, omittedProducts || {}, healthProfile),
        [results, omittedProducts, healthProfile]
    );

    const workflowWithFilter = useMemo(() => {
        const applyTypeFilter = (products) => {
            if (!products || typeFilter === 'all') return products || [];
            return products.filter(p => (p.type || 'physical') === typeFilter);
        };
        return byWorkflow.map(w => ({
            ...w,
            steps: w.steps.map(s => ({ ...s, products: applyTypeFilter(s.products) })).filter(s => s.products.length > 0),
        })).filter(w => w.steps.length > 0);
    }, [byWorkflow, typeFilter]);

    const byCategory = useMemo(() => {
        const applyTypeFilter = (products) => {
            if (!products || typeFilter === 'all') return products || [];
            return products.filter(p => (p.type || 'physical') === typeFilter);
        };
        return byCategoryRaw.map(c => ({
            ...c,
            products: applyTypeFilter(c.products),
        })).filter(c => c.products.length > 0);
    }, [byCategoryRaw, typeFilter]);

    const categoryOptions = useMemo(() => {
        const opts = [{ value: 'all', label: 'All categories' }];
        byCategory.forEach(({ category, label }) => opts.push({ value: category, label }));
        return opts;
    }, [byCategory]);

    const displayedSections = useMemo(() => {
        if (categoryFilter === 'all') return byCategory;
        const section = byCategory.find(s => s.category === categoryFilter);
        return section ? [section] : [];
    }, [byCategory, categoryFilter]);

    const isExpanded = (key) => expandedSections[key] === true;
    const toggleExpanded = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

    // Find matching similar profiles
    const matchedProfiles = useMemo(() => {
        if (!results?.frustrations) return [];
        const tags = results.frustrations.map(f => {
            const map = { 'Heavy flow': 'heavy-flow', 'Painful cramps': 'cramps', 'Hormonal bloating': 'bloating', 'Recurrent UTIs': 'uti', 'Irregular cycles': 'irregular' };
            return map[f];
        }).filter(Boolean);

        const prefs = Array.isArray(results?.preference)
            ? results.preference
            : (results?.preference ? [results.preference] : []);
        if (prefs.includes('Privacy & data security')) tags.push('privacy');

        return tags
            .filter(t => SIMILAR_PROFILES[t])
            .map(t => ({ tag: t, ...SIMILAR_PROFILES[t] }))
            .slice(0, 2);
    }, [results]);

    const recommendedArticles = useMemo(() => getRecommendedArticles(results || {}, healthProfile), [results, healthProfile]);
    const tiered = useMemo(() => generateTieredRecommendations(results?.fullHealthIntake || {}), [results]);

    const renderProductCard = (product) => {
        const isTracked = !!trackedProducts[product.id];
        const isInEcosystem = !!myProducts[product.id];
        const { whyItWorks, considerations } = getRecommendationExplanation(product, results, healthProfile);
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

            {/* Header + Retake at top */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', maxWidth: '700px', margin: '0 auto var(--spacing-lg)' }}>
                <div style={{
                    background: 'var(--color-secondary-fade)', color: 'var(--color-primary-hover)',
                    padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', fontSize: '0.875rem',
                    fontWeight: '600', marginBottom: '1rem', display: 'inline-block'
                }}>
                    Your personalized ecosystem
                </div>
                <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>Products curated for you</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                    {results?.frustrations?.length > 0
                        ? <>Ranking uses your quiz focus areas (<strong>{results.frustrations.join(', ')}</strong>), anything you’ve told us in chat, imported records (FHIR or manual), and wearable summaries from My Account.</>
                        : 'Ranking combines your quiz, chat updates, imported health records, and wearable notes when you add them under My Account.'
                    }
                </p>
                {inferTagsFromHealthProfile(healthProfile).length > 0 && (
                    <p style={{ color: 'var(--color-primary)', fontSize: '0.95rem', marginTop: '0.75rem', lineHeight: 1.5 }}>
                        Your imported profile (conditions, medications, EHR summary, or wearable text) is informing these picks — not a diagnosis, but extra signal for what might fit.
                    </p>
                )}
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    🔒 We never sell your data. Every product below is reviewed by OB-GYNs and real women.
                </p>
                <p style={{ color: 'var(--color-primary)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: '500' }}>
                    Forgot something? Use the 💬 chat button to speak or type more — we’ll refresh your ecosystem.
                </p>
                <div style={{ marginTop: '1.25rem' }}>
                    <button type="button" className="btn btn-outline" onClick={onRetake}>
                        Retake Assessment
                    </button>
                </div>
            </div>

            <CareNearYouPanel
                quizResults={results}
                healthProfile={healthProfile}
                userZipCode={userZipCode}
                onZipCodeChange={onZipCodeChange}
                onOpenProduct={onOpenProduct}
            />

            {tiered.length > 0 && (
                <div style={{ maxWidth: '980px', margin: '0 auto var(--spacing-xl)', display: 'grid', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem' }}>Tiered recommendations</h3>
                    {tiered.map((entry) => (
                        <div key={entry.concern} className="card" style={{ padding: '1rem' }}>
                            <p style={{ fontWeight: '700', marginBottom: '0.75rem' }}>{entry.concern}</p>
                            {entry.tiers.map((tier) => (
                                <div key={tier.name} style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '700' }}>{tier.name}</div>
                                    <button
                                        type="button"
                                        style={{ marginTop: '0.35rem', background: 'none', border: 'none', padding: 0, color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}
                                        onClick={() => onOpenProduct(tier.product)}
                                    >
                                        {tier.product.name}
                                    </button>
                                    {tier.safetyFlags?.length > 0 && (
                                        <p style={{ fontSize: '0.82rem', marginTop: '0.25rem', color: '#b42318' }}>
                                            Safety: {tier.safetyFlags.join(' ')}
                                        </p>
                                    )}
                                </div>
                            ))}
                            {entry.notes?.length > 0 && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 0 }}>
                                    {entry.notes.join(' ')} This recommendation may help with symptom support and should be confirmed with a provider.
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Filters: dropdowns for Type and Category */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'var(--spacing-lg)', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Type
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        style={{
                            padding: '0.5rem 2rem 0.5rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface-soft)',
                            color: 'var(--color-text-main)',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            minWidth: '140px'
                        }}
                    >
                        {TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Category
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        style={{
                            padding: '0.5rem 2rem 0.5rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface-soft)',
                            color: 'var(--color-text-main)',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            minWidth: '180px'
                        }}
                    >
                        {categoryOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </label>
            </div>
            {(categoryFilter !== 'all' || typeFilter !== 'all') && (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Showing {displayedSections.reduce((n, s) => n + s.products.length, 0)} product{displayedSections.reduce((n, s) => n + s.products.length, 0) !== 1 ? 's' : ''}
                </p>
            )}

            {/* Clinical workflow: e.g. For Recurrent UTIs → Prevent, Test, Treat, Get care */}
            {workflowWithFilter.length > 0 && workflowWithFilter.map((wf) => (
                <div key={wf.frustration} style={{ maxWidth: '900px', margin: '0 auto var(--spacing-xl)' }}>
                    <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                        For {wf.frustrationLabel}
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                        Recommendations follow a typical care path: prevent, test at home, treat or manage, and get care when needed.
                    </p>
                    {wf.steps.map((step) => {
                        const sectionKey = `wf-${wf.frustration}-${step.stepId}`;
                        const open = isExpanded(sectionKey);
                        return (
                            <div key={step.stepId} style={{ marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-surface-soft)' }}>
                                <button
                                    type="button"
                                    onClick={() => toggleExpanded(sectionKey)}
                                    style={{
                                        width: '100%',
                                        padding: '1rem 1.25rem',
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: 'var(--color-text-main)'
                                    }}
                                >
                                    <span>{step.stepLabel}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>{step.products.length} product{step.products.length !== 1 ? 's' : ''}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{open ? '▼' : '▶'}</span>
                                </button>
                                {open && (
                                    <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--color-border)' }}>
                                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                            {step.products.map(p => renderProductCard(p))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}

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

            {/* Recommendations by category — collapsible sections */}
            {displayedSections.length > 0 && (
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <h3 style={{ fontSize: '1.35rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>
                        More for you by category
                    </h3>
                    {displayedSections.map(({ category, label, products }) => {
                        const sectionKey = `cat-${category}`;
                        const open = isExpanded(sectionKey);
                        return (
                            <div key={category} style={{ marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-surface-soft)' }}>
                                <button
                                    type="button"
                                    onClick={() => toggleExpanded(sectionKey)}
                                    style={{
                                        width: '100%',
                                        padding: '1rem 1.25rem',
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: 'var(--color-text-main)'
                                    }}
                                >
                                    <span>{label}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>{products.length} product{products.length !== 1 ? 's' : ''}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{open ? '▼' : '▶'}</span>
                                </button>
                                {open && (
                                    <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--color-border)' }}>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                            {products.length === 1 ? '1 product' : `${products.length} products`} in this category that match your profile.
                                        </p>
                                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                            {products.map(p => renderProductCard(p))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {Object.keys(omittedProducts).length > 0 && (
                <p style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Note: {Object.keys(omittedProducts).length} products are hidden based on your preference.
                </p>
            )}
        </section>
    );
}

