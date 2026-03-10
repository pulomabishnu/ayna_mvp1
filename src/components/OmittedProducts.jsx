import React from 'react';

export default function OmittedProducts({ omittedProducts, toggleOmitProduct }) {
    const omittedList = Object.values(omittedProducts);

    return (
        <div className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Omitted Products</h2>
                <p style={{ color: 'var(--color-text-muted)' }}>These products will no longer appear in your Discovery or Recommendations.</p>
            </div>

            {omittedList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>You haven't omitted any products yet.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                    {omittedList.map((product) => (
                        <div key={product.id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img src={product.image} alt={product.name} style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                            <div style={{ flexGrow: 1 }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>{product.name}</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{product.category}</p>
                            </div>
                            <button
                                className="btn btn-outline"
                                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                                onClick={() => toggleOmitProduct(product)}
                            >
                                Restore
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
