import React from 'react';
import AccountHead from './nav/AccountHead.jsx';
import { sentenceCase } from '../utils/sentenceCase.js';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';

export default function OmittedProducts({ omittedProducts, toggleOmitProduct, onBack = null, onBrowse = null }) {
    const omittedList = Object.values(omittedProducts);

    return (
        <div className="container ay-acct-page animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)' }}>
            <AccountHead title="Not for me" back={onBack ? { label: 'Your ecosystem', href: '/you/ecosystem', onClick: onBack } : null}>
                <p>Products you hid. They won&rsquo;t appear in Explore or your matches. Restore one any time.</p>
            </AccountHead>

            {omittedList.length === 0 ? (
                <div className="ay-acct-empty">
                    <p>Nothing hidden. When a product isn&rsquo;t for you, choose &ldquo;Not for me&rdquo; on it and it lands here.</p>
                    {onBrowse && <button type="button" className="ay-btn ay-btn--secondary" onClick={onBrowse}>Browse products</button>}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '1000px' }}>
                    {omittedList.map((product) => (
                        <div key={product.id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <ProductTileImage
                                product={product}
                                alt={product.name}
                                imgStyle={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                                letterNode={(
                                    <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', flexShrink: 0, overflow: 'hidden' }}>
                                        <ProductImageFallback compact />
                                    </div>
                                )}
                            />
                            <div style={{ flexGrow: 1 }}>
                                <h3 style={{ fontSize: 16, marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>{product.name}{product.outOfBusiness && <span style={{ fontSize: 12.5, fontWeight: '600', color: 'var(--color-text-muted)', background: 'var(--color-surface-soft)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>No longer sold</span>}</h3>
                                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{sentenceCase(product.category)}</p>
                            </div>
                            <button
                                className="btn btn-outline"
                                style={{ fontSize: 12.5, padding: '0.4rem 0.75rem' }}
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
