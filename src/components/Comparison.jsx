import React from 'react';

export default function Comparison({ compareList, onRemove, onClear, CATEGORY_LABELS, myProducts = {}, onBrowseProducts, onAddToCompare }) {
    const ecosystemList = Object.values(myProducts || {});

    if (compareList.length === 0) {
        return (
            <div className="container animate-fade-in" style={{ padding: 'var(--spacing-xl) var(--spacing-md)' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚖️</div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Comparison Tool</h2>
                    <p style={{ color: 'var(--color-text-muted)', maxWidth: '520px', margin: '0 auto' }}>
                        Compare up to 3 products side-by-side: safety, ingredients, and expert opinions.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                    <button
                        type="button"
                        onClick={onBrowseProducts}
                        style={{
                            padding: '2rem',
                            background: 'var(--color-surface-soft)',
                            border: '2px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                            e.currentTarget.style.background = 'var(--color-secondary-fade)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                            e.currentTarget.style.background = 'var(--color-surface-soft)';
                        }}
                    >
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Browse products</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            Search discovery and add products to compare from the full catalog.
                        </p>
                    </button>

                    <div
                        style={{
                            padding: '2rem',
                            background: 'var(--color-surface-soft)',
                            border: '2px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌿</div>
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Compare from your ecosystem</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                            {ecosystemList.length > 0
                                ? `Pick up to 3 from your ${ecosystemList.length} saved product(s).`
                                : 'Add products to My Ecosystem first, then compare them here.'}
                        </p>
                        {ecosystemList.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                                {ecosystemList.slice(0, 5).map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ width: '100%', maxWidth: '240px', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                        onClick={() => onAddToCompare(p)}
                                    >
                                        Add “{p.name}” to comparison
                                    </button>
                                ))}
                                {ecosystemList.length > 5 && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        +{ecosystemList.length - 5} more in your ecosystem
                                    </span>
                                )}
                            </div>
                        ) : (
                            <button type="button" className="btn btn-outline" onClick={onBrowseProducts}>
                                Go to Discovery
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const categories = [
        { key: 'category', label: 'Category' },
        { key: 'price', label: 'Price' },
        { key: 'safety.fdaStatus', label: 'FDA Status' },
        { key: 'safety.materials', label: 'Materials/Ingredients' },
        { key: 'effectiveness', label: 'Clinical Effectiveness' },
        { key: 'doctorOpinion', label: 'Clinical opinions' },
        { key: 'badges', label: 'Appeal Badges' },
    ];

    const getVal = (obj, path) => {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current == null) return 'N/A';
            current = current[part];
        }
        if (Array.isArray(current)) return current.join(', ');
        return current || 'N/A';
    };

    const inCompareIds = new Set(compareList.map(p => p.id));
    const moreFromEcosystem = ecosystemList.filter(p => !inCompareIds.has(p.id));
    const canAddMore = compareList.length < 3;

    return (
        <div className="container animate-fade-in" style={{ padding: 'var(--spacing-lg) var(--spacing-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Product Comparison</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Analyze differences in safety, efficacy, and value.</p>
                </div>
                <button className="btn-outline" onClick={onClear} style={{ color: 'var(--color-text-muted)' }}>Clear All</button>
            </div>
            {canAddMore && (onBrowseProducts || onAddToCompare) && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Add product:</span>
                    {onBrowseProducts && (
                        <button type="button" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }} onClick={onBrowseProducts}>
                            Browse products
                        </button>
                    )}
                    {onAddToCompare && moreFromEcosystem.length > 0 && (
                        <select
                            style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem', background: 'var(--color-surface-soft)' }}
                            value=""
                            onChange={(e) => {
                                const id = e.target.value;
                                if (!id) return;
                                const p = moreFromEcosystem.find(x => x.id === id);
                                if (p) onAddToCompare(p);
                                e.target.value = '';
                            }}
                        >
                            <option value="">From your ecosystem</option>
                            {moreFromEcosystem.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: `150px repeat(${compareList.length}, 1fr)`, gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {/* Headers */}
                <div style={{ background: 'var(--color-surface-soft)', padding: '1.5rem', fontWeight: '700' }}></div>
                {compareList.map(p => (
                    <div key={p.id} style={{ background: 'var(--color-surface)', padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
                        <button
                            onClick={() => onRemove(p)}
                            style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1rem' }}
                        >✕</button>
                        <img src={p.image} alt={p.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{p.name}</h3>
                    </div>
                ))}

                {/* Rows */}
                {categories.map(cat => (
                    <React.Fragment key={cat.key}>
                        <div style={{ background: 'var(--color-surface-soft)', padding: '1.5rem', fontWeight: '600', fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                            {cat.label}
                        </div>
                        {compareList.map(p => (
                            <div key={`${p.id}-${cat.key}`} style={{ background: 'var(--color-surface)', padding: '1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                {cat.key === 'category' ? (CATEGORY_LABELS[getVal(p, cat.key)] || getVal(p, cat.key))
                                    : cat.key === 'doctorOpinion' ? (
                                        <>
                                            {getVal(p, cat.key)}
                                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600', marginTop: '0.35rem' }}>
                                                {p.clinicianOpinionSource === 'independent' ? '(Independent — not brand-affiliated)' : p.clinicianOpinionSource === 'brand' ? '(Brand-affiliated)' : p.clinicianOpinionSource === 'mixed' ? '(Mixed: some sources brand-affiliated)' : ''}
                                            </span>
                                        </>
                                    ) : getVal(p, cat.key)}
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>

            <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--color-secondary-fade)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-primary-fade)' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>⚖️ Ayna's Comparison Insight</h3>
                <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--color-text-main)' }}>
                    When choosing between products, prioritize <strong>Materials Transparency</strong> and <strong>Clinical opinions</strong>.
                    Price often reflects marketing budget more than ingredient quality. Check for "B-Corp" or "Sustainable" badges for higher ethical standards.
                </p>
            </div>
        </div>
    );
}
