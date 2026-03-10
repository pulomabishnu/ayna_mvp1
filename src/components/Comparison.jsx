import React from 'react';

export default function Comparison({ compareList, onRemove, onClear, CATEGORY_LABELS }) {
    if (compareList.length === 0) {
        return (
            <div className="container animate-fade-in" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>⚖️</div>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Comparison Tool</h2>
                <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', margin: '0 auto 2rem' }}>
                    Select up to 3 products from your ecosystem or discovery to compare their safety profiles, ingredients, and expert opinions side-by-side.
                </p>
                <button className="btn btn-primary" onClick={() => window.location.hash = '#discovery'}>Browse Products</button>
            </div>
        );
    }

    const categories = [
        { key: 'category', label: 'Category' },
        { key: 'price', label: 'Price' },
        { key: 'safety.fdaStatus', label: 'FDA Status' },
        { key: 'safety.materials', label: 'Materials/Ingredients' },
        { key: 'effectiveness', label: 'Clinical Effectiveness' },
        { key: 'doctorOpinion', label: 'Doctor Consensus' },
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

    return (
        <div className="container animate-fade-in" style={{ padding: 'var(--spacing-lg) var(--spacing-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '3rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Product Comparison</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Analyze differences in safety, efficacy, and value.</p>
                </div>
                <button className="btn-outline" onClick={onClear} style={{ color: 'var(--color-text-muted)' }}>Clear All</button>
            </div>

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
                                {cat.key === 'category' ? (CATEGORY_LABELS[getVal(p, cat.key)] || getVal(p, cat.key)) : getVal(p, cat.key)}
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>

            <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--color-secondary-fade)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-primary-fade)' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>⚖️ Ayna's Comparison Insight</h3>
                <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--color-text-main)' }}>
                    When choosing between products, prioritize <strong>Materials Transparency</strong> and <strong>Doctor Consensus</strong>.
                    Price often reflects marketing budget more than ingredient quality. Check for "B-Corp" or "Sustainable" badges for higher ethical standards.
                </p>
            </div>
        </div>
    );
}
