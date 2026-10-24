import React from 'react';
import BackLink from './nav/BackLink.jsx';
import GlossaryTerm from './GlossaryTerm';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import '../styles/compare-page.css';

export default function Comparison({ onBack = null, compareList, onRemove, onClear, CATEGORY_LABELS, myProducts = {}, onBrowseProducts, onAddToCompare }) {
    const ecosystemList = Object.values(myProducts || {});

    if (compareList.length === 0) {
        return (
            <div className="ay-container aycmp">
                <header className="aycmp__head">
                    {onBack && <BackLink label="Your ecosystem" href="/ecosystem" onClick={onBack} />}
                    <h1 className="ay-h1">Side by side</h1>
                    <p className="aycmp__lede">
                        Compare up to 3 products on safety, ingredients and expert opinions.
                    </p>
                </header>

                <div className="aycmp__start">
                    <section className="ay-group is-padded aycmp__opt" aria-labelledby="aycmp-shop-h">
                        <h2 id="aycmp-shop-h" className="ay-h3">Go to Shop</h2>
                        <p>Search the Shop and add products from the full catalog.</p>
                        <button type="button" className="ay-btn ay-btn--primary" onClick={onBrowseProducts}>Go to Shop</button>
                    </section>

                    <section className="ay-group is-padded aycmp__opt" aria-labelledby="aycmp-eco-h">
                        <h2 id="aycmp-eco-h" className="ay-h3">Compare from your ecosystem</h2>
                        <p>
                            {ecosystemList.length > 0
                                ? `Pick up to 3 from the ${ecosystemList.length} ${ecosystemList.length === 1 ? 'product' : 'products'} in your ecosystem.`
                                : 'Add products to your ecosystem first, then compare them here.'}
                        </p>
                        {ecosystemList.length > 0 ? (
                            <>
                                <ul className="ay-group__rows aycmp__picks">
                                    {ecosystemList.slice(0, 5).map((p) => (
                                        <li key={p.id}>
                                            <button type="button" className="ay-group__row ay-group__row--link" onClick={() => onAddToCompare(p)}>
                                                <span className="ay-group__value">Add {p.name} to comparison</span>
                                                <span className="ay-group__end" aria-hidden="true">+</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                {ecosystemList.length > 5 && (
                                    <span className="aycmp__more">+{ecosystemList.length - 5} more in your ecosystem</span>
                                )}
                            </>
                        ) : (
                            <button type="button" className="ay-btn ay-btn--secondary" onClick={onBrowseProducts}>
                                Go to Discovery
                            </button>
                        )}
                    </section>
                </div>
            </div>
        );
    }

    const hasPads = compareList.some((p) => p.category === 'pad');
    const categories = [
        { key: 'category', label: 'Category' },
        { key: 'price', label: 'Price' },
        { key: 'effectiveness', label: hasPads ? 'Absorbency / flow' : 'How well it works' },
        { key: 'safety.fdaStatus', label: <GlossaryTerm term="FDA">FDA status</GlossaryTerm> },
        { key: 'safety.materials', label: 'Materials and ingredients' },
        { key: 'safety.recalls', label: hasPads ? <>Recalls / <GlossaryTerm term="PFAS">PFAS</GlossaryTerm></> : 'Recalls' },
        { key: 'doctorOpinion', label: 'Doctor’s opinion' },
        { key: 'badges', label: 'Badges' },
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

    const inCompareIds = new Set(compareList.map((p) => p.id));
    const moreFromEcosystem = ecosystemList.filter((p) => !inCompareIds.has(p.id));
    const canAddMore = compareList.length < 3;

    return (
        <div className="ay-container aycmp">
            <header className="aycmp__head is-row">
                <div>
                    {onBack && <BackLink label="Your ecosystem" href="/ecosystem" onClick={onBack} />}
                    <h1 className="ay-h1">Side by side</h1>
                    <p className="aycmp__lede">See how they differ on safety, how well they work, and value.</p>
                </div>
                <button type="button" className="ay-btn ay-btn--text" onClick={onClear}>Clear all</button>
            </header>
            {canAddMore && (onBrowseProducts || onAddToCompare) && (
                <div className="aycmp__add">
                    <span>Add product:</span>
                    {onBrowseProducts && (
                        <button type="button" className="ay-btn ay-btn--secondary" onClick={onBrowseProducts}>
                            Browse products
                        </button>
                    )}
                    {onAddToCompare && moreFromEcosystem.length > 0 && (
                        <select
                            className="aycmp__select"
                            aria-label="Add a product from your ecosystem"
                            value=""
                            onChange={(e) => {
                                const id = e.target.value;
                                if (!id) return;
                                const p = moreFromEcosystem.find((x) => x.id === id);
                                if (p) onAddToCompare(p);
                                e.target.value = '';
                            }}
                        >
                            <option value="">From your ecosystem</option>
                            {moreFromEcosystem.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            <div className="aycmp__scroll" role="region" aria-label="Comparison table" tabIndex={0}>
                <table className="aycmp__table">
                    <thead>
                        <tr>
                            <td />
                            {compareList.map((p) => (
                                <th key={p.id} scope="col">
                                    <span className="aycmp__tile">
                                        <ProductTileImage
                                            product={p}
                                            alt={p.name}
                                            imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            letterNode={<ProductImageFallback />}
                                        />
                                    </span>
                                    <span className="aycmp__name">{p.name}</span>
                                    <button type="button" className="aycmp__remove" onClick={() => onRemove(p)} aria-label={`Remove ${p.name} from comparison`}>Remove</button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((cat) => (
                            <tr key={cat.key}>
                                <th scope="row">{cat.label}</th>
                                {compareList.map((p) => (
                                    <td key={`${p.id}-${cat.key}`}>
                                        {cat.key === 'category' ? (CATEGORY_LABELS[getVal(p, cat.key)] || getVal(p, cat.key))
                                            : cat.key === 'doctorOpinion' ? (
                                                <>
                                                    {getVal(p, cat.key)}
                                                    <span className="aycmp__src">
                                                        {p.clinicianOpinionSource === 'independent' ? '(Independent. Not brand-affiliated)' : p.clinicianOpinionSource === 'brand' ? '(Brand-affiliated)' : p.clinicianOpinionSource === 'mixed' ? '(Mixed: some sources brand-affiliated)' : ''}
                                                    </span>
                                                </>
                                            ) : getVal(p, cat.key)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <aside className="ay-group is-padded aycmp__tip" aria-labelledby="aycmp-tip-h">
                <h2 id="aycmp-tip-h" className="aycmp__tip-h">ayna’s tip</h2>
                <p>
                    When choosing between products, look closely at <strong>Materials and ingredients</strong> and the <strong>Doctor’s opinion</strong>.
                    A higher price often means more marketing, not better ingredients. Look for &quot;B-Corp&quot; or &quot;Sustainable&quot; badges. They can mean higher ethical standards.
                </p>
            </aside>
        </div>
    );
}
