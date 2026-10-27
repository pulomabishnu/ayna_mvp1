import React from 'react';
import AccountHead from './nav/AccountHead.jsx';
import { sentenceCase } from '../utils/sentenceCase.js';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';

export default function OmittedProducts({ omittedProducts, toggleOmitProduct, onBack = null, onBrowse = null }) {
    const omittedList = Object.values(omittedProducts);

    return (
        <div className="container ay-acct-page animate-fade-in-up">
            <AccountHead title="Not for me" back={onBack ? { label: 'My ecosystem', href: '/you/ecosystem', onClick: onBack } : null}>
                <p>Products you hid. They won&rsquo;t appear in Explore or your matches. Restore one any time.</p>
            </AccountHead>

            {omittedList.length === 0 ? (
                <div className="ay-acct-empty">
                    <p>Nothing hidden. When a product isn&rsquo;t for you, choose &ldquo;Not for me&rdquo; on it and it lands here.</p>
                    {onBrowse && <button type="button" className="ay-btn ay-btn--secondary" onClick={onBrowse}>Browse products</button>}
                </div>
            ) : (
                <ul className="ay-acct-list" aria-label="Hidden products">
                    {omittedList.map((product) => (
                        <li key={product.id} className="ay-acct-list__row">
                            <span className="ay-acct-list__plate">
                                <ProductTileImage
                                    product={product}
                                    alt=""
                                    imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    letterNode={<ProductImageFallback compact />}
                                />
                            </span>
                            <span className="ay-acct-list__text">
                                <b>{product.name}</b>
                                <span>{sentenceCase(product.category)}{product.outOfBusiness ? ' · No longer sold' : ''}</span>
                            </span>
                            <button type="button" className="ay-btn ay-btn--secondary" onClick={() => toggleOmitProduct(product)} aria-label={`Restore ${product.name}`}>
                                Restore
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
